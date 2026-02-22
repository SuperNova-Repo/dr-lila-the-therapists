import torch
from transformers import WhisperProcessor, WhisperForConditionalGeneration
import librosa
from backend.config import settings

class STTService:
    def __init__(self):
        self.model_name = settings.WHISPER_MODEL
        self.processor = WhisperProcessor.from_pretrained(self.model_name)
        self.model = WhisperForConditionalGeneration.from_pretrained(self.model_name)
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model.to(self.device)
    
    def transcribe(self, audio_path: str, language: str = "de") -> str:
        """Transcribe audio file to text"""
        try:
            # Load audio
            audio, sr = librosa.load(audio_path, sr=16000)
            
            # Process
            input_features = self.processor(
                audio,
                sampling_rate=16000,
                return_tensors="pt"
            ).input_features.to(self.device)
            
            # Generate
            forced_decoder_ids = self.processor.get_decoder_prompt_ids(
                language=language,
                task="transcribe"
            )
            
            predicted_ids = self.model.generate(
                input_features,
                forced_decoder_ids=forced_decoder_ids
            )
            
            # Decode
            transcription = self.processor.batch_decode(
                predicted_ids,
                skip_special_tokens=True
            )[0]
            
            return transcription.strip()
            
        except Exception as e:
            print(f"STT Error: {e}")
            return ""

stt_service = STTService()