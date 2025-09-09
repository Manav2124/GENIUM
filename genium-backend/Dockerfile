FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user
RUN useradd -m -u 1000 flask && chown -R flask:flask /app
USER flask

# Expose port
EXPOSE 5001

# Health check (optional for Flask, but good practice)
# HEALTHCHECK CMD curl --fail http://localhost:5001/api/health

CMD ["python", "app.py"]
