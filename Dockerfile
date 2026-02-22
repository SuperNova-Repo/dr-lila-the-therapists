# Stage 1: Frontend Build
FROM node:20-alpine AS frontend-build

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# Stage 2: Backend
FROM python:3.11-slim

WORKDIR /app

# System dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libsndfile1 \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download Whisper model
RUN python -c "from transformers import WhisperProcessor, WhisperForConditionalGeneration; \
    WhisperProcessor.from_pretrained('openai/whisper-small'); \
    WhisperForConditionalGeneration.from_pretrained('openai/whisper-small')"

# Copy backend code
COPY backend/ ./backend/
COPY scripts/ ./scripts/

# Copy frontend build
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# Create data directories (WITHOUT copying)
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
    uvicorn backend.main:app --host 0.0.0.0 --port 7860