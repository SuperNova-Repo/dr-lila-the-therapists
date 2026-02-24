# ────────────────────── Stage 1: Frontend build ──────────────────────
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# ────────────────────── Stage 2: Backend (Python) ──────────────────────
FROM python:3.11-slim

# Arbeitsverzeichnis festlegen – absolute Pfade verhindern
WORKDIR /app

# ---- System‑Abhängigkeiten ------------------------------------------------
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libsndfile1 \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# ---- Upgrade pip, setuptools, wheel (wichtig für bcrypt) -----------------
RUN pip install --upgrade pip setuptools wheel

# ---- Python‑Abhängigkeiten -------------------------------------------------
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ---- Whisper‑Modelle (falls benötigt) ------------------------------------
# (optional – kann später lazy‑loaded werden)
RUN python - <<'PY'
from transformers import WhisperProcessor, WhisperForConditionalGeneration
model_id = "openai/whisper-small"
WhisperProcessor.from_pretrained(model_id)
WhisperForConditionalGeneration.from_pretrained(model_id)
PY

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