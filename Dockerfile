# ================================================
# Dr. Lila - The Therapist | Optimierte Dockerfile mit npm ci Fix
# Für Hugging Face Spaces + ZeroGPU (100% kostenfrei)
# ================================================

# ====================== STAGE 1: Frontend Build ======================
FROM node:20-alpine AS frontend-build

WORKDIR /app/frontend

# Kopiere package.json + package-lock.json (Lockfile MUSS existieren!)
COPY frontend/package*.json ./

# WICHTIG: npm ci braucht package-lock.json → stelle sicher, dass es committed ist!
# Alternativ (Fallback): RUN npm install --prefer-offline --no-audit --progress=false
RUN npm ci --prefer-offline --no-audit --progress=false

COPY frontend/ ./
RUN npm run build

# ====================== STAGE 2: Backend (Python + GPU-ready) ======================
FROM python:3.11-slim

WORKDIR /app

# System-Abhängigkeiten (für Audio, STT, TTS)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libsndfile1 \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Pip & Build-Tools upgraden
RUN pip install --upgrade pip setuptools wheel --no-cache-dir

# Python Dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# === CUDA Torch für ZeroGPU (überschreibt CPU-Version aus requirements) ===
RUN pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121 \
    --force-reinstall --no-deps --no-cache-dir

# Whisper-small vorab laden (für STT)
RUN python -c "
from transformers import WhisperProcessor, WhisperForConditionalGeneration
WhisperProcessor.from_pretrained('openai/whisper-small')
WhisperForConditionalGeneration.from_pretrained('openai/whisper-small')
"

# Backend-Code kopieren
COPY backend/ ./backend/
COPY scripts/ ./scripts/

# Frontend-Build einbinden
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# Daten-Verzeichnisse anlegen (persistent in HF Spaces)
RUN mkdir -p \
    /app/data/db \
    /app/data/uploads/profiles \
    /app/data/uploads/audio \
    /app/data/uploads/psychology_docs \
    /app/data/temp \
    /app/data/faiss_index

# Berechtigungen (HF Spaces mag das manchmal)
RUN chmod -R 777 /app/data

# ================================================
# Environment & Start
# ================================================
EXPOSE 7860
ENV PYTHONUNBUFFERED=1
ENV PORT=7860
ENV HF_HUB_ENABLE_HF_TRANSFER=1

# DB init + Server
CMD ["sh", "-c", "python scripts/init_db.py && uvicorn backend.main:app --host 0.0.0.0 --port ${PORT} --log-level info"]
