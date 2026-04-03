from __future__ import annotations

import json
import logging
import os
import re
from typing import Any

import httpx
from bs4 import BeautifulSoup
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from openai import APIError, APITimeoutError, AuthenticationError, OpenAI, RateLimitError
from pydantic import BaseModel, Field, model_validator
from pydantic.config import ConfigDict

from .prompt import WEB3_EXTRACTION_PROMPT

logger = logging.getLogger(__name__)

app = FastAPI(title="Web3 Extract API", version="1.0.0")

# 添加 CORS 中间件，允许前端调用后端提取功能。
# 注意：浏览器规范不允许在 allow_credentials=True 时使用 allow_origins=["*"]。
# 临时放宽来源请在 Render 环境变量 CORS_ORIGINS 中追加逗号分隔的 Origin，勿使用 "*"。
_cors_base = [
    "https://songsongsong-qian-duan.onrender.com",  # 前端生产地址
    "http://localhost:3000",  # 本地开发
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
_cors_env = os.getenv("CORS_ORIGINS", "").strip()
if _cors_env:
    _extra = [o.strip() for o in _cors_env.split(",") if o.strip()]
    _origins = list(dict.fromkeys(_cors_base + _extra))
else:
    _origins = _cors_base

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DEFAULT_UA = "Mozilla/5.0 (compatible; Web3Extract/1.0; +https://web3release.com)"
FETCH_TIMEOUT_S = 25.0
CONNECT_TIMEOUT_S = 10.0
MAX_PAGE_CHARS = 15_000


class ExtractRequest(BaseModel):
    """Either pass raw text or a URL to fetch (not both required; see validator)."""

    model_config = ConfigDict(populate_by_name=True)

    page_content: str | None = Field(None, description="Plain text from the page")
    source_url: str | None = Field(
        None,
        description="HTTP(S) URL — server fetches page text before extraction",
    )

    @model_validator(mode="after")
    def require_one_input(self) -> ExtractRequest:
        has_text = bool(self.page_content and self.page_content.strip())
        has_url = bool(self.source_url and self.source_url.strip())
        if not has_text and not has_url:
            raise ValueError("Provide non-empty page_content or source_url")
        return self


def _error_json(status: int, code: str, message: str) -> JSONResponse:
    return JSONResponse(
        status_code=status,
        content={"ok": False, "error": code, "message": message},
    )


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
        raise ValueError(f"Model output was not valid JSON: {e}") from e
    if not isinstance(data, list):
        raise ValueError("Model output must be a JSON array")
    return data


def _fetch_page_text_with_httpx(url: str) -> str:
    """Fetch URL with httpx, strip HTML to plain text. Raises ValueError / httpx.HTTPError."""
    u = url.strip()
    if not u.lower().startswith(("http://", "https://")):
        raise ValueError("source_url must start with http:// or https://")

    timeout = httpx.Timeout(FETCH_TIMEOUT_S, connect=CONNECT_TIMEOUT_S)
    headers = {
        "User-Agent": DEFAULT_UA,
        "Accept": "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
    }
    with httpx.Client(timeout=timeout, follow_redirects=True) as client:
        resp = client.get(u, headers=headers)
        resp.raise_for_status()
        html = resp.text

    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(["script", "style", "nav", "footer", "head", "noscript"]):
        tag.decompose()
    text = soup.get_text(separator="\n", strip=True)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text[:MAX_PAGE_CHARS]


def _build_llm_user_content(page_text: str, canonical_url: str | None) -> str:
    user_content = WEB3_EXTRACTION_PROMPT.replace("{{PAGE_CONTENT}}", page_text)
    if canonical_url:
        user_content += f"\n\n[Canonical source URL for this page: {canonical_url}]"
    return user_content


def _call_deepseek(page_text: str, canonical_url: str | None) -> list[Any]:
    api_key = os.getenv("DEEPSEEK_API_KEY") or os.getenv("OPENAI_API_KEY")
    if not api_key or not str(api_key).strip():
        raise PermissionError(
            "Missing API key: set DEEPSEEK_API_KEY (preferred) or OPENAI_API_KEY in the server environment."
        )

    raw_base = os.getenv("DEEPSEEK_BASE_URL") or os.getenv("OPENAI_BASE_URL") or "https://api.deepseek.com"
    base_url = raw_base.rstrip("/")
    if not base_url.endswith("/v1"):
        base_url = f"{base_url}/v1"

    model = os.getenv("DEEPSEEK_MODEL") or os.getenv("OPENAI_MODEL") or "deepseek-chat"
    user_content = _build_llm_user_content(page_text, canonical_url)

    client = OpenAI(api_key=api_key.strip(), base_url=base_url)
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

    choice = completion.choices[0].message.content
    if not choice:
        raise ValueError("Empty model response")
    return _parse_events_json(choice)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/")
def root() -> dict[str, str]:
    return {"service": "web3-extract-api", "docs": "/docs"}


@app.post("/api/v1/extract")
def extract_events(request: Request, body: ExtractRequest) -> Any:
    """
    Extract Web3 events from `page_content` or from a page fetched via `source_url`.
    Always returns JSON (array on success, object with error fields on failure).
    """
    try:
        # Resolve text: URL fetch takes precedence when both are sent (same as typical "refresh" behavior).
        page_text: str
        canonical: str | None

        if body.source_url and body.source_url.strip():
            try:
                page_text = _fetch_page_text_with_httpx(body.source_url.strip())
            except httpx.TimeoutException as e:
                logger.warning("fetch timeout: %s", e)
                return _error_json(
                    504,
                    "fetch_timeout",
                    f"Request to fetch source_url timed out after {FETCH_TIMEOUT_S:.0f}s.",
                )
            except httpx.HTTPStatusError as e:
                logger.warning("fetch http error: %s", e)
                return _error_json(
                    502,
                    "fetch_http_error",
                    f"Failed to fetch URL: HTTP {e.response.status_code} for {body.source_url.strip()!r}.",
                )
            except httpx.RequestError as e:
                logger.warning("fetch request error: %s", e)
                return _error_json(
                    502,
                    "fetch_failed",
                    f"Could not reach source_url: {e!s}",
                )
            except ValueError as e:
                return _error_json(400, "invalid_url", str(e))

            canonical = body.source_url.strip()
            # Optional: if user also sent page_content, we already chose fetched text; ignore duplicate.
        else:
            page_text = (body.page_content or "").strip()
            canonical = None
            if not page_text:
                return _error_json(400, "empty_content", "page_content is empty.")

        try:
            events = _call_deepseek(page_text, canonical)
        except PermissionError as e:
            return _error_json(503, "missing_api_key", str(e))
        except AuthenticationError as e:
            logger.warning("deepseek auth failed: %s", e)
            return _error_json(
                401,
                "deepseek_auth_failed",
                "Invalid or rejected API key. Check DEEPSEEK_API_KEY / OPENAI_API_KEY.",
            )
        except RateLimitError as e:
            return _error_json(429, "deepseek_rate_limit", f"Upstream rate limit: {e!s}")
        except APITimeoutError as e:
            return _error_json(504, "deepseek_timeout", f"DeepSeek API timed out: {e!s}")
        except APIError as e:
            logger.warning("deepseek api error: %s", e)
            return _error_json(502, "deepseek_api_error", f"DeepSeek API error: {e!s}")
        except ValueError as e:
            return _error_json(502, "invalid_model_output", str(e))

        return events

    except Exception as e:
        logger.exception("unexpected error in /api/v1/extract")
        return _error_json(
            500,
            "internal_error",
            "An unexpected error occurred. Check server logs for details.",
        )


@app.exception_handler(RequestValidationError)
async def request_validation_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """Return the same JSON shape as extract failures (Swagger-friendly)."""
    errs = exc.errors()
    if errs:
        e0 = errs[0]
        loc = " -> ".join(str(x) for x in e0.get("loc", ()))
        msg = e0.get("msg", "invalid request")
        detail = f"{loc}: {msg}" if loc else msg
    else:
        detail = "invalid request body"
    return _error_json(422, "validation_error", detail)
