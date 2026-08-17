FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

COPY pyproject.toml README.md ./

# Pre-install dependencies so Docker caches this layer
RUN mkdir -p app && touch app/__init__.py && \
    pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir .

# Copy actual app code and reinstall local package without downloading dependencies
COPY app ./app
RUN pip install --no-cache-dir --no-deps -e .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
