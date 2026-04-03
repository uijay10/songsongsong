# Monorepo root: Python extraction API (same as backend/Dockerfile with context .)
FROM python:3.12-slim-bookworm

WORKDIR /app

RUN pip install --no-cache-dir uv

COPY backend/pyproject.toml backend/uv.lock* ./
RUN uv sync --no-dev

COPY backend/app ./app

ENV PYTHONPATH=/app
ENV PORT=8000
EXPOSE 8000

CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
