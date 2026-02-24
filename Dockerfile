# --------------------------------------------------
# Stage 1: Frontend Build (Node.js)
# --------------------------------------------------
FROM node:20-alpine AS frontend-build

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci --prefer-offline --no-audit --progress=false

COPY frontend/ ./
RUN npm run build

# --------------------------------------------------
# Stage 2: Backend + Runtime (Python 3.11 slim)
# --------------------------------------------------
FROM python:3.11-slim

# Arbeitsverzeichnis
WORKDIR /app

# System-Abhängigkeiten (ffmpeg für Audio, libsndfile für soundfile, git/curl falls nötig)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libsndfile1 \
    git \
    curl \
    && apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Upgrade pip, setuptools, wheel zuerst (besser für Kompatibilität)
RUN pip install --no-cache-dir --upgrade pip setuptools wheel

# Python-Dependencies (requirements zuerst → gutes Caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Whisper-Modell vorab downloaden (STT – caching im Image)
RUN python -c "from transformers import WhisperProcessor, WhisperForConditionalGeneration; \
    WhisperProcessor.from_pretrained('openai/whisper-small'); \
    WhisperForConditionalGeneration.from_pretrained('openai/whisper-small')"

# Backend-Code, Scripts und Frontend-Dist kopieren
COPY backend/ ./backend/
COPY scripts/ ./scripts/
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# Daten-Verzeichnisse erstellen (persistent in HF Spaces möglich)
RUN mkdir -p \
    /app/data/db \
    /app/data/uploads/profiles \
    /app/data/uploads/audio \
    /app/data/uploads/psychology_docs \
    /app/data/temp \
    /app/data/faiss_index \
    && chmod -R 777 /app/data   # Schreibrechte für sqlite / uploads

# Optional: non-root User (Sicherheit – in HF Spaces oft nicht nötig, aber gut)
# RUN useradd -m appuser
# USER appuser

# Ports & Env
EXPOSE 7860
ENV PYTHONUNBUFFERED=1
ENV PORT=7860

# Init DB + Server-Start (nutzt $PORT von HF oder 7860 fallback)
CMD ["sh", "-c", "python scripts/init_db.py && uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-7860}"]# Copy backend code
COPY backend/ ./backend/
COPY scripts/ ./scripts/

# Copy frontend build
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# Create data directories
RUN mkdir -p \
    /app/data/db \
    /app/data/uploads/profiles \
    /app/data/uploads/audio \
    /app/data/psychology_docs \
    /app/data/temp \
    /app/data/faiss_index

# Expose port
EXPOSE 7860

# Environment variables
ENV PYTHONUNBUFFERED=1
ENV PORT=7860

# Initialize database and start server
CMD python scripts/init_db.py && \
    uvicorn backend.main:app --host 0.0.0.0 --port 7860PY

# ---- Backend‑ und Skript‑Code ---------------------------------------------
COPY backend/ ./backend/
COPY scripts/ ./scripts/

# ---- Frontend‑Build in das Backend‑Image einbinden -----------------------
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# ---- Daten‑Verzeichnisse anlegen (sicherstellen, dass sie existieren) ---
RUN mkdir -p \
    /app/data/db \
    /app/data/uploads/profiles \
    /app/data/uploads/audio \
    /app/data/psychology_docs \
    /app/data/temp \
    /app/data/faiss_index

# ---- Netzwerk‑Einstellungen ------------------------------------------------
EXPOSE 7860
ENV PYTHONUNBUFFERED=1
ENV PORT=7860

# ---- Datenbank‑Initialisierung und Server‑Start ---------------------------
CMD ["sh", "-c", "python scripts/init_db.py && uvicorn backend.main:app --host 0.0.0.0 --port $PORT"]
