from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai-chat", tags=["AI Chat"])

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]

class ChatResponse(BaseModel):
    output: str
    error: str = None

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
        
        # Convert request messages to the format expected by Bytez
        messages = []
        for msg in request.messages:
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
            return ChatResponse(
                output="I received your question but couldn't generate a response. Please try asking in a different way.",
                error=None
            )
        
        return ChatResponse(
            output=str(output),
            error=None
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
