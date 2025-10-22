from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import logging
import json
import psycopg2
from psycopg2.extras import RealDictCursor
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai-chat", tags=["AI Chat"])

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    industry_context: Optional[str] = None
    company_name: Optional[str] = None
    current_page: Optional[str] = None
    user_context: Optional[Dict[str, Any]] = None

class ChatResponse(BaseModel):
    output: str
    error: str = ""
    system_data: Optional[Dict[str, Any]] = None
    suggestions: Optional[List[str]] = None

def get_system_data(company_name: str, context: Dict[str, Any] = None, user_message: str = ""):
    """Fetch relevant system data based on context"""
    try:
        if not company_name or not context:
            return None
            
        # Get database configuration
        if os.getenv('DOCKER_ENV') == 'true':
            POSTGRES_HOST = os.getenv('POSTGRES_HOST', 'postgres')
        else:
            POSTGRES_HOST = os.getenv('POSTGRES_HOST', 'localhost')
            
        POSTGRES_PORT = os.getenv('POSTGRES_PORT', '5432')
        POSTGRES_USER = 'postgres'
        POSTGRES_PASSWORD = os.getenv('POSTGRES_PASSWORD', 'epm_password')
        
        # Connect to company database
        company_db_name = company_name.lower().replace(' ', '_').replace('-', '_')
        
        conn = psycopg2.connect(
            host=POSTGRES_HOST,
            port=POSTGRES_PORT,
            user=POSTGRES_USER,
            password=POSTGRES_PASSWORD,
            database=company_db_name
        )
        
        cur = conn.cursor(cursor_factory=RealDictCursor)
        system_data = {}
        
        # Get recent data input entries if requested or if asking about entries
        if context.get('analyze_journals') or 'entry' in user_message.lower() or 'posted' in user_message.lower():
            # Try multiple possible table names for data input, including process-specific tables
            tables_to_try = [
                'actuals_entity_amounts_entries',  # Process-specific table from logs
                'entity_amounts', 
                'data_input_entity_amounts', 
                'journal_entries'
            ]
            
            for table_name in tables_to_try:
                try:
                    cur.execute(f"""
                        SELECT * FROM {table_name} 
                        ORDER BY created_at DESC 
                        LIMIT 10
                    """)
                    entries = [dict(row) for row in cur.fetchall()]
                    if entries:
                        system_data['recent_entries'] = entries
                        system_data['table_used'] = table_name
                        logger.info(f"✅ Found {len(entries)} entries in table {table_name}")
                        break
                except Exception as e:
                    logger.debug(f"Table {table_name} not found or error: {e}")
                    continue
            
            # Also try to get intercompany entries
            try:
                cur.execute("""
                    SELECT * FROM ic_amounts 
                    ORDER BY created_at DESC 
                    LIMIT 5
                """)
                ic_entries = [dict(row) for row in cur.fetchall()]
                if ic_entries:
                    system_data['ic_entries'] = ic_entries
            except Exception as e:
                logger.debug(f"IC amounts table not found: {e}")
            
            # Try to get other amounts
            try:
                cur.execute("""
                    SELECT * FROM other_amounts 
                    ORDER BY created_at DESC 
                    LIMIT 5
                """)
                other_entries = [dict(row) for row in cur.fetchall()]
                if other_entries:
                    system_data['other_entries'] = other_entries
            except Exception as e:
                logger.debug(f"Other amounts table not found: {e}")
        
        # Get process data if on process page
        if context.get('analyze_processes'):
            cur.execute("""
                SELECT process_name, status, last_run_date, entity_count
                FROM financial_processes 
                ORDER BY last_run_date DESC 
                LIMIT 5
            """)
            system_data['recent_processes'] = [dict(row) for row in cur.fetchall()]
        
        # Get entity data if requested or if asking about specific entities
        if context.get('analyze_entities') or any(entity_word in user_message.lower() for entity_word in ['entity', 'backooy', 'company']):
            # Try different possible entity table names, avoiding problematic ones
            entity_tables = ['axes_entity_elements', 'entities']
            
            for table_name in entity_tables:
                try:
                    cur.execute(f"""
                        SELECT * FROM {table_name} 
                        ORDER BY entity_code 
                        LIMIT 20
                    """)
                    entities = [dict(row) for row in cur.fetchall()]
                    if entities:
                        system_data['entities'] = entities
                        system_data['entity_table_used'] = table_name
                        logger.info(f"✅ Found {len(entities)} entities in table {table_name}")
                        break
                except Exception as e:
                    logger.debug(f"Entity table {table_name} not found: {e}")
                    continue
        
        cur.close()
        conn.close()
        
        return system_data
        
    except Exception as e:
        logger.error(f"Error fetching system data: {e}")
        return None

def build_expert_prompt(user_message: str, industry_context: str = None, system_data: Dict = None):
    """Build enhanced prompt with IFRS expertise and system context"""
    
    base_prompt = """
You are a highly experienced IFRS (International Financial Reporting Standards) expert and financial consolidation specialist with over 15 years of experience in:

🎯 **Core Expertise:**
- IFRS Standards (1-17) implementation and interpretation
- Financial consolidation and group reporting
- Revenue recognition (IFRS 15) across industries
- Lease accounting (IFRS 16) and complex arrangements
- Financial instruments (IFRS 9) and hedge accounting
- Business combinations (IFRS 3) and goodwill
- Impairment testing and fair value measurements
- Foreign currency translation and hyperinflation
- Segment reporting and disclosure requirements

💼 **Industry Experience:**
- Manufacturing and automotive
- Technology and software
- Real estate and construction
- Financial services and banking
- Retail and consumer goods
- Oil & gas and mining
- Healthcare and pharmaceuticals

🔧 **Technical Skills:**
- Complex consolidation scenarios
- Intercompany eliminations
- Non-controlling interests (NCI)
- Joint ventures and associates
- Step acquisitions and disposals
- Purchase price allocations
- Deferred tax complexities

📊 **System Integration:**
You have access to the user's financial system data and can analyze:
- Journal entries and their business rationale
- Process execution results and data flows
- Entity structures and relationships
- Trial balance movements and reconciliations

🎯 **Response Style:**
- Provide practical, actionable guidance
- Reference specific IFRS paragraphs when relevant
- Consider industry-specific implications
- Offer step-by-step implementation approaches
- Highlight common pitfalls and best practices
"""
    
    if industry_context:
        base_prompt += f"\n\n🏭 **Current Industry Context:** {industry_context}"
        base_prompt += "\nTailor your response to consider industry-specific IFRS applications and common challenges."
    
    if system_data:
        base_prompt += "\n\n📋 **Available System Data:**"
        if system_data.get('recent_entries'):
            base_prompt += f"\n- Recent data entries ({len(system_data['recent_entries'])} entries from {system_data.get('table_used', 'database')} available for analysis)"
        if system_data.get('ic_entries'):
            base_prompt += f"\n- Intercompany entries ({len(system_data['ic_entries'])} IC entries available)"
        if system_data.get('other_entries'):
            base_prompt += f"\n- Other amount entries ({len(system_data['other_entries'])} other entries available)"
        if system_data.get('recent_processes'):
            base_prompt += f"\n- Process execution data ({len(system_data['recent_processes'])} recent processes)"
        if system_data.get('entities'):
            base_prompt += f"\n- Entity structure data ({len(system_data['entities'])} entities)"
        base_prompt += "\nUse this data to provide specific, contextual analysis when relevant to the user's question."
    
    base_prompt += f"\n\n**User Question:** {user_message}"
    
    # Add actual system data to the prompt for analysis
    if system_data:
        base_prompt += "\n\n**ACTUAL SYSTEM DATA FOR ANALYSIS:**"
        
        if system_data.get('recent_entries'):
            base_prompt += f"\n\n📊 **Recent Data Entries from {system_data.get('table_used', 'database')}:**"
            for i, entry in enumerate(system_data['recent_entries'][:5], 1):
                base_prompt += f"\n{i}. Entry: {entry}"
        
        if system_data.get('ic_entries'):
            base_prompt += "\n\n🔄 **Intercompany Entries:**"
            for i, entry in enumerate(system_data['ic_entries'][:3], 1):
                base_prompt += f"\n{i}. IC Entry: {entry}"
        
        if system_data.get('entities'):
            base_prompt += "\n\n🏢 **Entity Information:**"
            for i, entity in enumerate(system_data['entities'][:5], 1):
                base_prompt += f"\n{i}. Entity: {entity}"
        
        base_prompt += """

**CRITICAL INSTRUCTIONS FOR DATA ANALYSIS:**
1. You MUST analyze the ACTUAL system data provided above
2. Reference SPECIFIC entries, amounts, dates, and entity codes from the real data
3. If the user asks about a specific entry (like BackoOy cash entry), find it in the data and explain it
4. DO NOT give generic responses - use the actual numbers, dates, and descriptions from the system
5. For accounting questions, explain WHY the entry was posted based on the actual data shown
6. Always cite the specific entry details when answering (entity code, account, amount, date, description)"""
    
    return base_prompt

@router.post("/query", response_model=ChatResponse)
async def ai_chat_query(request: ChatRequest):
    """
    Process AI chat query using Bytez API
    """
    try:
        # Import bytez here to handle import errors gracefully
        try:
            from bytez import Bytez
        except ImportError:
            logger.error("Bytez package not installed")
            return ChatResponse(
                output="I'm having trouble connecting to the AI service. Please try again later.",
                error="Bytez package not available"
            )
        
        # Initialize Bytez SDK
        sdk = Bytez("c778aee69e98c1f995dc6cbdd73ef136")
        
        # Choose Schematron-3B model
        model = sdk.model("inference-net/Schematron-3B")
        
        # Build expert prompt for the user's message
        user_message = request.messages[-1].content if request.messages else ""
        
        # Get system data if context provided
        system_data = None
        if request.company_name and request.user_context:
            system_data = get_system_data(request.company_name, request.user_context, user_message)
        expert_prompt = build_expert_prompt(
            user_message, 
            request.industry_context, 
            system_data
        )
        
        # Convert request messages to the format expected by Bytez
        messages = [
            {
                "role": "system",
                "content": expert_prompt
            }
        ]
        
        # Add conversation history (excluding the last message as it's in the system prompt)
        for msg in request.messages[:-1]:
            messages.append({
                "role": msg.role,
                "content": msg.content
            })
        
        # Send input to model
        output, error = model.run(messages)
        
        # Handle the response
        if error:
            logger.error(f"Bytez API error: {error}")
            return ChatResponse(
                output="I apologize, but I encountered an issue processing your question. Please try rephrasing or ask about a specific module.",
                error=str(error)
            )
        
        if not output:
            # Generate contextual suggestions
            suggestions = []
            if 'ifrs 15' in user_message.lower() or 'revenue' in user_message.lower():
                suggestions = [
                    "Analyze journal entries for revenue recognition patterns",
                    "Check process data for revenue calculation steps",
                    "Review entity-specific revenue policies"
                ]
            elif 'consolidation' in user_message.lower():
                suggestions = [
                    "Examine intercompany elimination entries",
                    "Analyze NCI calculation processes",
                    "Review entity ownership structures"
                ]
            
            return ChatResponse(
                output="I received your question but couldn't generate a response. Please try asking in a different way.",
                error="",
                system_data=system_data,
                suggestions=suggestions
            )
        
        # Generate contextual suggestions
        suggestions = []
        if 'ifrs 15' in user_message.lower() or 'revenue' in user_message.lower():
            suggestions = [
                "Analyze journal entries for revenue recognition patterns",
                "Check process data for revenue calculation steps",
                "Review entity-specific revenue policies"
            ]
        elif 'consolidation' in user_message.lower():
            suggestions = [
                "Examine intercompany elimination entries",
                "Analyze NCI calculation processes",
                "Review entity ownership structures"
            ]
        
        return ChatResponse(
            output=str(output),
            error="",
            system_data=system_data,
            suggestions=suggestions
        )
        
    except Exception as e:
        logger.error(f"AI chat query error: {str(e)}")
        return ChatResponse(
            output="I'm having trouble connecting to the AI service. Let me help you with navigation or basic questions instead.",
            error=str(e)
        )

@router.get("/health")
async def health_check():
    """
    Health check endpoint for AI chat service
    """
    try:
        from bytez import Bytez
        return {"status": "healthy", "service": "ai-chat", "bytez_available": True}
    except ImportError:
        return {"status": "degraded", "service": "ai-chat", "bytez_available": False}
