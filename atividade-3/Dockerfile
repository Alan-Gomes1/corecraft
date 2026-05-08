FROM python:3.12-slim

WORKDIR /app

# Dependências de sistema para pyzmq
RUN apt-get update && apt-get install -y --no-install-recommends gcc && rm -rf /var/lib/apt/lists/*

# Instala dependências Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia todo o código (frontend.html, backend.py, módulos auxiliares)
COPY . .

# Bind em 0.0.0.0 para ser acessível dentro da rede Docker
CMD ["gunicorn", "--config", "gunicorn.conf.py", "--bind", "0.0.0.0:5000", "backend:app"]
