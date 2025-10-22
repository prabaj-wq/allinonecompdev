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

def get_system_data(company_name: str, context: Dict[str, Any] = None):
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
        
        # Get recent journal entries if requested
        if context.get('analyze_journals'):
            cur.execute("""
                SELECT entry_id, description, debit_account, credit_account, amount, currency, entry_date
                FROM journal_entries 
                ORDER BY entry_date DESC 
                LIMIT 10
            """)
            system_data['recent_journals'] = [dict(row) for row in cur.fetchall()]
        
        # Get process data if on process page
        if context.get('current_page') == 'process':
            cur.execute("""
                SELECT process_name, status, last_run_date, entity_count
                FROM financial_processes 
                ORDER BY last_run_date DESC 
                LIMIT 5
            """)
            system_data['recent_processes'] = [dict(row) for row in cur.fetchall()]
        
        # Get entity data if requested
        if context.get('analyze_entities'):
            cur.execute("""
                SELECT entity_code, entity_name, entity_type, status
                FROM entities 
                ORDER BY entity_code 
                LIMIT 20
            """)
            system_data['entities'] = [dict(row) for row in cur.fetchall()]
        
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
        if system_data.get('recent_journals'):
            base_prompt += f"\n- Recent journal entries ({len(system_data['recent_journals'])} entries available for analysis)"
        if system_data.get('recent_processes'):
            base_prompt += f"\n- Process execution data ({len(system_data['recent_processes'])} recent processes)"
        if system_data.get('entities'):
            base_prompt += f"\n- Entity structure data ({len(system_data['entities'])} entities)"
        base_prompt += "\nUse this data to provide specific, contextual analysis when relevant to the user's question."
    
    base_prompt += f"\n\n**User Question:** {user_message}"
    
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
        
        # Get system data if context provided
        system_data = None
        if request.company_name and request.user_context:
            system_data = get_system_data(request.company_name, request.user_context)
        
        # Build expert prompt for the user's message
        user_message = request.messages[-1].content if request.messages else ""
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
