# ================================================
# Dr. Lila - The Therapist | Dockerfile – final fix für parse error
# ================================================

# Stage 1: Frontend Build
FROM node:20-alpine AS frontend-build

WORKDIR /app/frontend

COPY frontend/package*.json ./

# npm ci – Voraussetzung: package-lock.json muss committed sein!
RUN npm ci --prefer-offline --no-audit --progress=false

COPY frontend/ ./
RUN npm run build

# Stage 2: Backend (Python + GPU-ready für ZeroGPU)
FROM python:3.11-slim

WORKDIR /app

# System deps für Audio/STT/TTS
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libsndfile1 \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Pip upgraden
RUN pip install --upgrade pip setuptools wheel --no-cache-dir

# Requirements installieren
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# CUDA Torch für ZeroGPU (cu121 – HF ZeroGPU nutzt meist T4)
RUN pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121 \
    --force-reinstall --no-deps --no-cache-dir

# Whisper-small vorab laden – ALLES IN EINER ZEILE (kein Parse-Error mehr!)
RUN python -c "from transformers import WhisperProcessor, WhisperForConditionalGeneration; WhisperProcessor.from_pretrained('openai/whisper-small'); WhisperForConditionalGeneration.from_pretrained('openai/whisper-small')"

# Code kopieren
COPY backend/ ./backend/
COPY scripts/ ./scripts/

# Frontend dist einbinden
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# Data-Ordner erstellen (persistent in HF Spaces)
RUN mkdir -p \
    /app/data/db \
    /app/data/uploads/profiles \
    /app/data/uploads/audio \
    /app/data/uploads/psychology_docs \
    /app/data/temp \
    /app/data/faiss_index

RUN chmod -R 777 /app/data

# Ports & Env
EXPOSE 7860
ENV PYTHONUNBUFFERED=1
ENV PORT=7860
ENV HF_HUB_ENABLE_HF_TRANSFER=1

# Start: DB init + Uvicorn
CMD ["sh", "-c", "python scripts/init_db.py && uvicorn backend.main:app --host 0.0.0.0 --port ${PORT} --log-level info"]# Python Dependencies
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
