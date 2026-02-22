import os
from typing import List, Dict
import requests
from backend.config import settings

class LLMService:
    def __init__(self):
        self.model = settings.LLM_MODEL
        self.hf_token = settings.HF_TOKEN
        self.api_url = f"https://api-inference.huggingface.co/models/{self.model}"
        self.headers = {"Authorization": f"Bearer {self.hf_token}"} if self.hf_token else {}
    
    def generate_response(
        self,
        messages: List[Dict[str, str]],
        system_prompt: str = None,
        temperature: float = 0.7,
        max_tokens: int = 512
    ) -> str:
        """Generate a response using the LLM"""
        
        # Build prompt
        prompt_messages = []
        
        if system_prompt:
            prompt_messages.append({"role": "system", "content": system_prompt})
        else:
            prompt_messages.append({"role": "system", "content": settings.SYSTEM_PROMPT})
        
        prompt_messages.extend(messages)
        
        # Format for chat models
        formatted_prompt = self._format_chat_prompt(prompt_messages)
        
        payload = {
            "inputs": formatted_prompt,
            "parameters": {
                "temperature": temperature,
                "max_new_tokens": max_tokens,
                "return_full_text": False
            }
        }
        
        try:
            response = requests.post(self.api_url, headers=self.headers, json=payload, timeout=30)
            response.raise_for_status()
            result = response.json()
            
            if isinstance(result, list) and len(result) > 0:
                return result[0].get("generated_text", "").strip()
            
            return "Entschuldigung, ich konnte keine Antwort generieren."
            
        except Exception as e:
            print(f"LLM Error: {e}")
            return f"Entschuldigung, es gab einen technischen Fehler. Bitte versuche es erneut."
    
    def _format_chat_prompt(self, messages: List[Dict[str, str]]) -> str:
        """Format messages for chat completion"""
        formatted = ""
        for msg in messages:
            role = msg["role"]
            content = msg["content"]
            
            if role == "system":
                formatted += f"System: {content}\n\n"
            elif role == "user":
                formatted += f"User: {content}\n\n"
            elif role == "assistant":
                formatted += f"Assistant: {content}\n\n"
        
        formatted += "Assistant:"
        return formatted

llm_service = LLMService()