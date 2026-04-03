# Web3 Extract API (Python)

FastAPI service that calls DeepSeek (or any OpenAI-compatible endpoint) using `WEB3_EXTRACTION_PROMPT` for structured JSON extraction.

## Run locally

```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Set `DEEPSEEK_API_KEY` (see root `.env.example`).
