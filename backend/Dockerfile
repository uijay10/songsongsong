FROM python:3.12-slim-bookworm

WORKDIR /app

RUN pip install --no-cache-dir uv

# Install local package *after* source exists: hatchling needs `app/` + README for metadata.
COPY pyproject.toml uv.lock* README.md ./
COPY app ./app
RUN uv sync --no-dev

ENV PYTHONPATH=/app
ENV PORT=8000
EXPOSE 8000

# Render sets PORT; local default 8000
CMD ["sh", "-c", "exec uv run uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
