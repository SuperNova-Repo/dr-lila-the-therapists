from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
import os
import uuid
from pathlib import Path

from backend.database import get_db
from backend.models.user import User
from backend.services.auth_service import get_current_user
from backend.services.stt import stt_service
from backend.services.tts import tts_service
from backend.config import settings

router = APIRouter()

class TTSRequest(BaseModel):
    text: str
    voice_id: str = "default"
    language: str = "de"

@router.post("/stt")
async def speech_to_text(
    audio: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Convert speech to text"""
    # Validate file
    if not audio.content_type.startswith("audio/"):
        raise HTTPException(status_code=400, detail="Invalid file type")
    
    # Save temporary file
    temp_dir = Path("data/temp")
    temp_dir.mkdir(parents=True, exist_ok=True)
    
    temp_file = temp_dir / f"{uuid.uuid4()}.wav"
    
    try:
        with open(temp_file, "wb") as f:
            content = await audio.read()
            f.write(content)
        
        # Transcribe
        language = current_user.bot_language or "de"
        text = stt_service.transcribe(str(temp_file), language=language)
        
        return {"text": text}
        
    finally:
        # Cleanup
        if temp_file.exists():
            temp_file.unlink()

@router.post("/tts")
async def text_to_speech(
    request: TTSRequest,
    current_user: User = Depends(get_current_user)
):
    """Convert text to speech"""
    # Create output directory
    output_dir = Path(settings.UPLOAD_DIR) / "audio"
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate unique filename
    filename = f"{uuid.uuid4()}.wav"
    output_path = output_dir / filename
    
    # Synthesize
    voice_id = request.voice_id or current_user.voice_id or "default"
    language = request.language or current_user.bot_language or "de"
    
    result = tts_service.synthesize(
        text=request.text,
        output_path=str(output_path),
        voice_id=voice_id,
        language=language
    )
    
    if not result:
        raise HTTPException(status_code=500, detail="TTS synthesis failed")
    
    return {"audio_url": f"/uploads/audio/{filename}"}