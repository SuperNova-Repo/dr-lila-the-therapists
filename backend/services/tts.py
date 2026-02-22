from gtts import gTTS
import os
from backend.config import settings

class TTSService:
    def __init__(self):
        self.voices = {
            "default": "de",
            "female_calm": "de",
            "female_energetic": "en",
            "male_calm": "de",
            "male_deep": "en"
        }
    
    def synthesize(
        self,
        text: str,
        output_path: str,
        voice_id: str = "default",
        language: str = "de"
    ) -> str:
        """Convert text to speech using gTTS"""
        try:
            # Map voice_id to language (gTTS hat nur Sprachen, keine Stimmen)
            lang = self.voices.get(voice_id, language)
            
            tts = gTTS(text=text, lang=lang, slow=False)
            tts.save(output_path)
            
            return output_path
            
        except Exception as e:
            print(f"TTS Error: {e}")
            return None
    
    def get_available_voices(self):
        """Get list of available voices"""
        return list(self.voices.keys())

tts_service = TTSService()