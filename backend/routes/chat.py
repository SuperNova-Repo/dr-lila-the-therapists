from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from backend.database import get_db
from backend.models.user import User
from backend.models.chat import Chat, Message
from backend.services.auth_service import get_current_user
from backend.services.llm import llm_service
from backend.services.rag import rag_service
from backend.config import settings

router = APIRouter()

class ChatCreate(BaseModel):
    title: Optional[str] = "Neue Konversation"

class MessageCreate(BaseModel):
    content: str
    chat_id: int

class MessageResponse(BaseModel):
    id: int
    role: str
    content: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class ChatResponse(BaseModel):
    id: int
    title: str
    created_at: datetime
    updated_at: datetime
    messages: List[MessageResponse] = []
    
    class Config:
        from_attributes = True

@router.post("/create", response_model=ChatResponse)
async def create_chat(
    chat_data: ChatCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new chat"""
    chat = Chat(
        user_id=current_user.id,
        title=chat_data.title
    )
    db.add(chat)
    db.commit()
    db.refresh(chat)
    return chat

@router.get("/list", response_model=List[ChatResponse])
async def list_chats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all chats for current user"""
    chats = db.query(Chat).filter(Chat.user_id == current_user.id).order_by(Chat.updated_at.desc()).all()
    return chats

@router.get("/{chat_id}", response_model=ChatResponse)
async def get_chat(
    chat_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific chat"""
    chat = db.query(Chat).filter(
        Chat.id == chat_id,
        Chat.user_id == current_user.id
    ).first()
    
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    return chat

@router.delete("/{chat_id}")
async def delete_chat(
    chat_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a chat"""
    chat = db.query(Chat).filter(
        Chat.id == chat_id,
        Chat.user_id == current_user.id
    ).first()
    
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    db.delete(chat)
    db.commit()
    return {"status": "deleted"}

@router.post("/message", response_model=MessageResponse)
async def send_message(
    message_data: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send a message and get AI response"""
    # Verify chat ownership
    chat = db.query(Chat).filter(
        Chat.id == message_data.chat_id,
        Chat.user_id == current_user.id
    ).first()
    
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    # Save user message
    user_message = Message(
        chat_id=chat.id,
        role="user",
        content=message_data.content
    )
    db.add(user_message)
    db.commit()
    
    # Get chat history
    messages = db.query(Message).filter(Message.chat_id == chat.id).order_by(Message.created_at).all()
    
    # Format for LLM
    message_history = [
        {"role": msg.role, "content": msg.content}
        for msg in messages
    ]
    
    # Build system prompt with user context
    system_prompt = settings.SYSTEM_PROMPT
    if current_user.display_name:
        system_prompt += f"\n\nDer Name des Benutzers ist {current_user.display_name}."
    if current_user.persona:
        system_prompt += f"\n\nHintergrund des Benutzers: {current_user.persona}"
    
    # RAG: Get relevant context
    if settings.RAG_ENABLED:
        relevant_docs = rag_service.search(message_data.content, top_k=settings.RAG_TOP_K)
        if relevant_docs:
            context = "\n\n".join(relevant_docs)
            system_prompt += f"\n\nRelevante Informationen:\n{context}"
    
    # Generate response
    bot_response = llm_service.generate_response(
        messages=message_history,
        system_prompt=system_prompt
    )
    
    # Save bot message
    bot_message = Message(
        chat_id=chat.id,
        role="assistant",
        content=bot_response
    )
    db.add(bot_message)
    
    # Update chat timestamp
    chat.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(bot_message)
    
    return bot_message

@router.delete("/message/{message_id}")
async def delete_message(
    message_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a message"""
    message = db.query(Message).join(Chat).filter(
        Message.id == message_id,
        Chat.user_id == current_user.id
    ).first()
    
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    db.delete(message)
    db.commit()
    return {"status": "deleted"}

@router.post("/regenerate/{message_id}", response_model=MessageResponse)
async def regenerate_message(
    message_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Regenerate an AI response"""
    message = db.query(Message).join(Chat).filter(
        Message.id == message_id,
        Message.role == "assistant",
        Chat.user_id == current_user.id
    ).first()
    
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    # Get messages up to this point
    messages = db.query(Message).filter(
        Message.chat_id == message.chat_id,
        Message.created_at < message.created_at
    ).order_by(Message.created_at).all()
    
    message_history = [
        {"role": msg.role, "content": msg.content}
        for msg in messages
    ]
    
    # Regenerate
    bot_response = llm_service.generate_response(messages=message_history)
    
    # Update message
    message.content = bot_response
    message.created_at = datetime.utcnow()
    
    db.commit()
    db.refresh(message)
    
    return message