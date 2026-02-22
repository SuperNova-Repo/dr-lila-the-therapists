from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import shutil
import os
from pathlib import Path

from backend.database import get_db
from backend.models.user import User
from backend.services.auth_service import get_current_user
from backend.config import settings

router = APIRouter()

class ProfileUpdate(BaseModel):
    display_name: Optional[str] = None
    persona: Optional[str] = None
    timezone: Optional[str] = None
    app_language: Optional[str] = None
    bot_language: Optional[str] = None
    voice_id: Optional[str] = None

class ProfileResponse(BaseModel):
    display_name: Optional[str]
    profile_picture: Optional[str]
    persona: Optional[str]
    timezone: str
    app_language: str
    bot_language: str
    voice_id: str
    
    class Config:
        from_attributes = True

@router.get("/profile", response_model=ProfileResponse)
async def get_profile(current_user: User = Depends(get_current_user)):
    """Get user profile"""
    return current_user

@router.put("/profile", response_model=ProfileResponse)
async def update_profile(
    profile_data: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user profile"""
    if profile_data.display_name is not None:
        current_user.display_name = profile_data.display_name
    if profile_data.persona is not None:
        current_user.persona = profile_data.persona
    if profile_data.timezone is not None:
        current_user.timezone = profile_data.timezone
    if profile_data.app_language is not None:
        current_user.app_language = profile_data.app_language
    if profile_data.bot_language is not None:
        current_user.bot_language = profile_data.bot_language
    if profile_data.voice_id is not None:
        current_user.voice_id = profile_data.voice_id
    
    db.commit()
    db.refresh(current_user)
    
    return current_user

@router.post("/profile/picture")
async def upload_profile_picture(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload profile picture"""
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid file type")
    
    # Create upload directory
    upload_dir = Path(settings.UPLOAD_DIR) / "profiles"
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    # Save file
    file_extension = file.filename.split(".")[-1]
    filename = f"{current_user.id}.{file_extension}"
    file_path = upload_dir / filename
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Update user
    current_user.profile_picture = f"/uploads/profiles/{filename}"
    db.commit()
    
    return {"profile_picture": current_user.profile_picture}

@router.get("/voices")
async def get_available_voices():
    """Get available TTS voices"""
    from backend.services.tts import tts_service
    return {"voices": tts_service.get_available_voices()}