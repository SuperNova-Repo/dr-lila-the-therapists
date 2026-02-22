# Stage 1: Frontend Build
FROM node:18-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Backend
FROM python:3.11-slim
WORKDIR /app

# System-Dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libsndfile1 \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Python-Dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# App-Code
COPY backend/ ./backend/
COPY data/ ./data/
COPY --from=frontend /app/frontend/build ./frontend/build

# Umgebungsvariablen
ENV PYTHONUNBUFFERED=1
ENV PORT=7860

# Startup
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "7860"]