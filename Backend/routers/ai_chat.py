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

def get_fallback_response(user_message: str, system_data: Dict = None):
    """Provide fallback IFRS guidance when AI service is unavailable"""
    user_lower = user_message.lower()
    
    # Analyze actual data if available
    if system_data and system_data.get('recent_entries'):
        entries = system_data['recent_entries']
        if entries:
            entry = entries[0]  # Get first entry for analysis
            
            # Specific analysis for IFRS 16 questions
            if 'ifrs 16' in user_lower or 'lease' in user_lower or 'right of use' in user_lower:
                if 'right' in str(entry.get('account_name', '')).lower() or 'lease' in str(entry.get('account_name', '')).lower():
                    return ChatResponse(
                        output=f"""**IFRS 16 Lease Accounting Analysis**

Based on your data, I can see an entry in {entry.get('entity_name', 'the entity')} for {entry.get('account_name', 'the account')} with amount {entry.get('currency', '')} {entry.get('amount', '')}.

**IFRS 16 requires these key entries for lease recognition:**

1. **Initial Recognition:**
   - Dr. Right-of-Use Asset
   - Cr. Lease Liability

2. **Subsequent Measurement:**
   - Dr. Depreciation Expense (ROU Asset)
   - Cr. Accumulated Depreciation - ROU Asset
   - Dr. Interest Expense
   - Cr. Lease Liability

**Your entry appears to be:** {entry.get('description', 'A lease-related transaction')}

**Common IFRS 16 entries you should consider:**
- Lease commencement recognition
- Monthly depreciation of ROU asset
- Interest expense on lease liability
- Lease payments reducing liability""",
                        error="",
                        system_data=system_data,
                        suggestions=[
                            "Review lease liability calculation",
                            "Check ROU asset depreciation schedule",
                            "Analyze lease payment allocations"
                        ]
                    )
            
            # General entry analysis
            return ChatResponse(
                output=f"""**Entry Analysis for {entry.get('entity_name', 'Entity')}**

I can see an entry with the following details:
- **Entity:** {entry.get('entity_name', 'N/A')} ({entry.get('entity_code', 'N/A')})
- **Account:** {entry.get('account_name', 'N/A')} ({entry.get('account_code', 'N/A')})
- **Amount:** {entry.get('currency', '')} {entry.get('amount', '')}
- **Period:** {entry.get('period_name', 'N/A')}
- **Date:** {entry.get('transaction_date', 'N/A')}
- **Description:** {entry.get('description', 'N/A')}

**Possible reasons for this entry:**
1. **Opening Balance:** If this is a period opening entry
2. **Operational Transaction:** Regular business activity
3. **Adjustment Entry:** Correction or reclassification
4. **IFRS Compliance:** Meeting specific reporting requirements

**To better understand this entry, consider:**
- The business context and transaction nature
- Whether it's part of a larger transaction set
- Compliance with relevant IFRS standards""",
                error="",
                system_data=system_data,
                suggestions=[
                    "Review related journal entries",
                    "Check supporting documentation",
                    "Verify IFRS compliance"
                ]
            )
    
    # General IFRS guidance when no specific data
    if 'ifrs 16' in user_lower or 'lease' in user_lower:
        return ChatResponse(
            output="""**IFRS 16 Lease Accounting Overview**

IFRS 16 requires lessees to recognize most leases on the balance sheet:

**Key Recognition Requirements:**
1. **Right-of-Use Asset** = Lease liability + prepaid lease payments + initial direct costs
2. **Lease Liability** = Present value of unpaid lease payments

**Common Journal Entries:**
```
Initial Recognition:
Dr. Right-of-Use Asset          XXX
    Cr. Lease Liability             XXX

Monthly Depreciation:
Dr. Depreciation Expense        XXX
    Cr. Accumulated Depreciation    XXX

Interest Expense:
Dr. Interest Expense            XXX
    Cr. Lease Liability             XXX
```

**Implementation Steps:**
1. Identify lease contracts
2. Calculate lease liability (PV of payments)
3. Measure ROU asset
4. Set up depreciation schedule
5. Calculate interest expense""",
            error="AI service temporarily unavailable",
            suggestions=[
                "Review your lease contracts",
                "Calculate present value of lease payments",
                "Set up ROU asset depreciation schedule"
            ]
        )
    
    elif 'ifrs 9' in user_lower or 'financial instrument' in user_lower:
        return ChatResponse(
            output="""**IFRS 9 Financial Instruments Overview**

IFRS 9 covers classification, measurement, and impairment of financial instruments:

**Classification Categories:**
1. **Amortized Cost** - Hold to collect contractual cash flows
2. **FVOCI** - Hold to collect and sell
3. **FVTPL** - All others

**Expected Credit Loss Model:**
- **12-month ECL** - Stage 1 (no significant increase in credit risk)
- **Lifetime ECL** - Stage 2 (significant increase) & Stage 3 (credit-impaired)

**Key Implementation Areas:**
1. Business model assessment
2. Contractual cash flow characteristics (SPPI test)
3. ECL calculation and measurement
4. Hedge accounting (if applicable)""",
            error="AI service temporarily unavailable",
            suggestions=[
                "Assess your business model for financial instruments",
                "Perform SPPI test on contractual cash flows",
                "Calculate expected credit losses"
            ]
        )
    
    # Default fallback
    return ChatResponse(
        output="""**IFRS Consolidation Assistant**

I'm currently experiencing technical difficulties with the AI service, but I can still help with basic IFRS guidance:

**Common IFRS Areas:**
- **IFRS 15**: Revenue Recognition
- **IFRS 16**: Lease Accounting  
- **IFRS 9**: Financial Instruments
- **IFRS 3**: Business Combinations
- **IAS 1**: Presentation of Financial Statements

**For specific questions about your data entries, please try:**
1. Refreshing the page
2. Asking about specific IFRS standards
3. Checking your internet connection

I'll be back to full functionality shortly!""",
        error="AI service temporarily unavailable",
        suggestions=[
            "Ask about specific IFRS standards",
            "Review your journal entries manually", 
            "Check system connectivity"
        ]
    )

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
        
        # Send input to model with better error handling
        try:
            logger.info("Sending request to AI model...")
            output, error = model.run(messages)
            logger.info(f"AI model response received. Output length: {len(str(output)) if output else 0}")
            
        except Exception as model_error:
            logger.error(f"AI model error: {model_error}")
            # Check if it's a timeout or connection error
            error_str = str(model_error).lower()
            if 'timeout' in error_str or 'time out' in error_str:
                return ChatResponse(
                    output="I'm taking longer than usual to process your request. Please try a simpler question or try again later.",
                    error="Request timeout"
                )
            elif 'connection' in error_str or 'network' in error_str:
                return ChatResponse(
                    output="I'm having trouble connecting to the AI service. Please check your internet connection and try again.",
                    error="Connection error"
                )
            else:
                return ChatResponse(
                    output="I'm experiencing technical difficulties. Please try again in a moment.",
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
            # Provide fallback IFRS guidance when AI service is unavailable
            fallback_response = get_fallback_response(user_message, system_data)
            return fallback_response
        
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
