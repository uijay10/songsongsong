from __future__ import annotations

import json
import os
import re
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
from pydantic import BaseModel, Field

from .prompt import WEB3_EXTRACTION_PROMPT

app = FastAPI(title="Web3 Extract API", version="1.0.0")

_origins = os.getenv("CORS_ORIGINS", "http://127.0.0.1:5173,http://localhost:5173,http://127.0.0.1:3000,http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in _origins.split(",") if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ExtractRequest(BaseModel):
    page_content: str = Field(..., description="Page text or HTML converted to plain text")
    source_url: str | None = Field(None, description="Optional canonical URL for this page")


def _strip_code_fence(raw: str) -> str:
    text = raw.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
        text = re.sub(r"\s*```$", "", text)
    return text.strip()


def _parse_events_json(raw: str) -> list[Any]:
    text = _strip_code_fence(raw)
    try:
        data = json.loads(text)
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=502, detail=f"Model output was not valid JSON: {e}") from e
    if not isinstance(data, list):
        raise HTTPException(status_code=502, detail="Model output must be a JSON array")
    return data


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/")
def root() -> dict[str, str]:
    return {"service": "web3-extract-api", "docs": "/docs"}


@app.post("/api/v1/extract", response_model=list[dict[str, Any]])
def extract_events(body: ExtractRequest) -> list[Any]:
    api_key = os.getenv("DEEPSEEK_API_KEY") or os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="Set DEEPSEEK_API_KEY (preferred) or OPENAI_API_KEY for an OpenAI-compatible API.",
        )

    raw_base = os.getenv("DEEPSEEK_BASE_URL") or os.getenv("OPENAI_BASE_URL") or "https://api.deepseek.com"
    base_url = raw_base.rstrip("/")
    if not base_url.endswith("/v1"):
        base_url = f"{base_url}/v1"

    model = os.getenv("DEEPSEEK_MODEL") or os.getenv("OPENAI_MODEL") or "deepseek-chat"

    user_content = WEB3_EXTRACTION_PROMPT.replace("{{PAGE_CONTENT}}", body.page_content)
    if body.source_url:
        user_content += f"\n\n[Canonical source URL for this page: {body.source_url}]"

    client = OpenAI(api_key=api_key, base_url=base_url)
    try:
        completion = client.chat.completions.create(
            model=model,
            messages=[
                {
                    "role": "system",
                    "content": "Follow the user instructions exactly. Output only the JSON array, no markdown.",
                },
                {"role": "user", "content": user_content},
            ],
            temperature=0.2,
            max_tokens=4096,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Upstream LLM error: {e!s}") from e

    choice = completion.choices[0].message.content
    if not choice:
        raise HTTPException(status_code=502, detail="Empty model response")
    return _parse_events_json(choice)
