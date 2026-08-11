FROM python:3.12-slim

WORKDIR /app

# Install system build dependencies for modules if needed
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy and install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt --extra-index-url https://download.pytorch.org/whl/cpu

# Pre-download the Hugging Face NLP embedding model so it's baked into the image and loads instantly
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')"

# Copy the rest of the application files
COPY . .

# Expose server port for Hugging Face Spaces (default is 7860)
EXPOSE 7860

# Start app with Gunicorn on port 7860
CMD ["gunicorn", "-b", "0.0.0.0:7860", "app:app", "--timeout", "120"]
