FROM python:3.12-slim

WORKDIR /app

# Dependências de sistema para pyzmq
RUN apt-get update && apt-get install -y --no-install-recommends gcc && rm -rf /var/lib/apt/lists/*

# Instala dependências Python
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia código
COPY backend/ ./backend/
COPY frontend/ ./frontend/

WORKDIR /app/backend

# Bind em 0.0.0.0 para ser acessível dentro da rede Docker
CMD ["gunicorn", "--config", "gunicorn.conf.py", "--bind", "0.0.0.0:8000", "app:app"]
