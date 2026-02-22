from TTS.api import TTS
import os
from backend.config import settings

class TTSService:
    def __init__(self):
        self.model_name = settings.TTS_MODEL
        self.tts = TTS(self.model_name)
        
        # Available voices
        self.voices = {
            "default": "de",
            "female_calm": "de",
            "female_energetic": "de",
            "male_calm": "de",
            "male_deep": "de"
        }
    
    def synthesize(
        self,
        text: str,
        output_path: str,
        voice_id: str = "default",
        language: str = "de"
    ) -> str:
        """Convert text to speech"""
        try:
            self.tts.tts_to_file(
                text=text,
                file_path=output_path,
                language=language
            )
            return output_path
            
        except Exception as e:
            print(f"TTS Error: {e}")
            return None
    
    def get_available_voices(self):
        """Get list of available voices"""
        return list(self.voices.keys())

tts_service = TTSService()