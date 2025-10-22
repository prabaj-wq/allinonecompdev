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
        
        # Get targeted data based on user query
        if context.get('analyze_journals') or 'entry' in user_message.lower() or 'posted' in user_message.lower():
            # Build smart query based on user message
            query_conditions = []
            query_params = []
            
            # Extract specific entity mentions
            entity_keywords = ['backo', 'backooy', 'parent', 'subsidiary']
            mentioned_entity = None
            for keyword in entity_keywords:
                if keyword in user_message.lower():
                    mentioned_entity = keyword.upper()
                    if keyword in ['backo', 'backooy']:
                        mentioned_entity = 'BACKO'
                    break
            
            # Extract specific account mentions
            account_keywords = ['cash', 'revenue', 'expense', 'asset', 'liability', 'receivable', 'payable', 'inventory', 'equipment', 'goodwill', 'depreciation', 'amortization']
            mentioned_account = None
            for keyword in account_keywords:
                if keyword in user_message.lower():
                    mentioned_account = keyword.lower()
                    break
            
            # Extract specific period mentions
            period_keywords = ['january', 'february', 'march', 'april', 'may', 'june', 
                             'july', 'august', 'september', 'october', 'november', 'december',
                             '2024', '2025', '2026']
            mentioned_period = None
            for keyword in period_keywords:
                if keyword in user_message.lower():
                    mentioned_period = keyword.lower()
                    break
            
            # Extract specific amount mentions (for precise targeting)
            import re
            amount_pattern = r'(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)'
            mentioned_amounts = re.findall(amount_pattern, user_message)
            mentioned_amount = mentioned_amounts[0] if mentioned_amounts else None
            
            # Try multiple possible table names for data input
            tables_to_try = [
                'actuals_entity_amounts_entries',
                'entity_amounts', 
                'data_input_entity_amounts', 
                'journal_entries'
            ]
            
            for table_name in tables_to_try:
                try:
                    # Build targeted query
                    base_query = f"SELECT * FROM {table_name} WHERE 1=1"
                    
                    # Add entity filter if mentioned
                    if mentioned_entity:
                        base_query += " AND (entity_code ILIKE %s OR entity_name ILIKE %s)"
                        query_params.extend([f"%{mentioned_entity}%", f"%{mentioned_entity}%"])
                    
                    # Add account filter if mentioned
                    if mentioned_account:
                        base_query += " AND (account_code ILIKE %s OR account_name ILIKE %s)"
                        query_params.extend([f"%{mentioned_account}%", f"%{mentioned_account}%"])
                    
                    # Add period filter if mentioned
                    if mentioned_period:
                        base_query += " AND (period_name ILIKE %s OR fiscal_year ILIKE %s)"
                        query_params.extend([f"%{mentioned_period}%", f"%{mentioned_period}%"])
                    
                    # Add amount filter if mentioned (approximate match)
                    if mentioned_amount:
                        clean_amount = mentioned_amount.replace(',', '')
                        base_query += " AND ABS(amount::numeric - %s) < 100"  # Within 100 units
                        query_params.append(float(clean_amount))
                    
                    # Order and limit
                    base_query += " ORDER BY created_at DESC LIMIT 5"
                    
                    cur.execute(base_query, query_params)
                    entries = [dict(row) for row in cur.fetchall()]
                    
                    if entries:
                        system_data['recent_entries'] = entries
                        system_data['table_used'] = table_name
                        system_data['query_filters'] = {
                            'entity': mentioned_entity,
                            'account': mentioned_account,
                            'period': mentioned_period,
                            'amount': mentioned_amount
                        }
                        logger.info(f"✅ Found {len(entries)} targeted entries in table {table_name} with filters: entity={mentioned_entity}, account={mentioned_account}, period={mentioned_period}")
                        break
                    else:
                        # Fallback to general query if no targeted results
                        cur.execute(f"""
                            SELECT * FROM {table_name} 
                            ORDER BY created_at DESC 
                            LIMIT 3
                        """)
                        entries = [dict(row) for row in cur.fetchall()]
                        if entries:
                            system_data['recent_entries'] = entries
                            system_data['table_used'] = table_name
                            logger.info(f"✅ Found {len(entries)} general entries in table {table_name}")
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
- Revenue recognition (IFRS 15) and complex contracts
- **IFRS 16 Lease Accounting**: Right-of-use assets, lease liabilities, transition adjustments
- **IFRS 9 Financial Instruments**: Expected credit losses, classification, hedge accounting
- Business combinations (IFRS 3) and goodwill
- Foreign currency translation and hedging
- Non-controlling interests and equity accounting
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
            filters_applied = system_data.get('query_filters', {})
            filter_info = ""
            if any(filters_applied.values()):
                applied_filters = [f"{k}={v}" for k, v in filters_applied.items() if v]
                filter_info = f" (Filtered by: {', '.join(applied_filters)})"
            
            base_prompt += f"\n📊 **Targeted Data Entries from {system_data.get('table_used', 'database')}{filter_info}:**"
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
        
        # Choose Schematron-3B model (3 billion parameter IFRS-trained model)
        model = sdk.model("inference-net/Schematron-3B")
        logger.info("Using Schematron-3B model for IFRS expertise")
        
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
        
        # Send input to model with timeout handling
        try:
            import signal
            
            def timeout_handler(signum, frame):
                raise TimeoutError("AI model timeout")
            
            # Set timeout to 30 seconds
            signal.signal(signal.SIGALRM, timeout_handler)
            signal.alarm(30)
            
            output, error = model.run(messages)
            
            # Clear timeout
            signal.alarm(0)
            
        except TimeoutError:
            logger.error("AI model timeout after 30 seconds")
            return ChatResponse(
                output="I'm taking longer than usual to process your request. Please try a simpler question or try again later.",
                error="Request timeout"
            )
        except Exception as model_error:
            logger.error(f"AI model error: {model_error}")
            return ChatResponse(
                output="I'm having trouble with the AI service right now. Please try again in a moment.",
                error=str(model_error)
            )
        
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
        elif 'ifrs 16' in user_message.lower() or 'lease' in user_message.lower():
            suggestions = [
                "Analyze right-of-use asset calculations",
                "Review lease liability measurement entries",
                "Check lease modification and termination entries"
            ]
        elif 'ifrs 9' in user_message.lower() or 'financial instrument' in user_message.lower() or 'credit loss' in user_message.lower():
            suggestions = [
                "Review expected credit loss calculations",
                "Analyze financial instrument classification entries",
                "Check hedge accounting effectiveness entries"
            ]
        elif 'consolidation' in user_message.lower():
            suggestions = [
                "Examine intercompany elimination entries",
                "Analyze NCI calculation processes",
                "Review entity ownership structures"
            ]
        
        # Extract clean text content from AI response
        clean_output = output
        if isinstance(output, dict):
            clean_output = output.get('content', str(output))
        elif hasattr(output, 'content'):
            clean_output = output.content
        else:
            clean_output = str(output)
        
        # Remove any JSON formatting or raw response artifacts
        clean_output = str(clean_output).strip()
        if clean_output.startswith("{'role':") or clean_output.startswith('{"role":'):
            # Extract content from JSON-like response
            try:
                import json
                if clean_output.startswith("{'role':"):
                    clean_output = clean_output.replace("'", '"')
                parsed = json.loads(clean_output)
                clean_output = parsed.get('content', clean_output)
            except:
                pass
        
        return ChatResponse(
            output=clean_output,
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
