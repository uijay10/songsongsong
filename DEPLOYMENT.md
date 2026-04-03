# Deployment & local development

## Monorepo layout (what stays at repo root)

| Path | Role |
|------|------|
| `frontend/` | React + Vite app |
| `backend/` | FastAPI (`app/main.py`), `uv` + `pyproject.toml` / `uv.lock` |
| `lib/` | **Shared TypeScript** packages (`api-client-react`, `db`, …) used by **both** frontend and `artifacts/api-server` — keep at root |
| `artifacts/api-server/` | Express API (optional for full product) |
| `scripts/` | Small workspace tooling (`@workspace/scripts`), not the web UI |

There is **no** root `public/` in this layout; static assets live under `frontend/public/`.

---

## One-command local dev (`pnpm dev`)

Prerequisites: **Node 24+**, **pnpm**, **uv** ([install](https://docs.astral.sh/uv/)).

```bash
pnpm install
cd backend && uv sync && cd ..
cp .env.example .env
# Set DEEPSEEK_API_KEY in .env
pnpm dev
```

This runs **Vite** (default [http://localhost:5173](http://localhost:5173)) and **FastAPI** ([http://localhost:8000](http://localhost:8000), `/docs`).

Individual processes:

```bash
pnpm frontend    # Vite only
pnpm backend     # uvicorn --reload on :8000
pnpm build       # production build of frontend → frontend/dist/public
```

After changing `backend/pyproject.toml`, run **`cd backend && uv lock`** (or `uv sync`) so `uv.lock` stays in sync for Docker/CI.

---

## FastAPI extract API

`POST /api/v1/extract`

JSON body (provide **either** `page_content` **or** `url`):

```json
{
  "page_content": "optional plain text if you already scraped the page"
}
```

```json
{
  "url": "https://example.com/news",
  "source_url": "optional canonical URL override"
}
```

If `url` is set, the server **fetches** the page (HTTP GET), strips HTML to text, then calls DeepSeek with `WEB3_EXTRACTION_PROMPT` from `backend/app/prompt.py`.

Auth: **`DEEPSEEK_API_KEY`** (preferred) or **`OPENAI_API_KEY`**; base URL defaults to `https://api.deepseek.com/v1`.

---

## Docker Compose

Copy env file:

```bash
cp .env.example .env
```

**Production** (Nginx static + FastAPI; Nginx proxies `/api/v1/` to the backend):

```bash
docker compose --profile prod up --build
```

**Development** (bind-mounted Vite + reloadable FastAPI):

```bash
docker compose --profile dev up --build
```

Compose reads **`env_file: .env`** for backend services. Create `.env` from `.env.example` first (Compose also substitutes `${VAR}` from a project `.env` when present).

---

## Vercel (frontend)

- **Install:** `pnpm install`
- **Build:** `pnpm --filter @workspace/frontend run build`
- **Output directory:** `frontend/dist/public`
- **Root directory:** repository root (pnpm workspace)

Configure any `VITE_*` variables in the Vercel dashboard.

Host the **FastAPI** service separately (Render / Railway / Fly.io / Docker).

---

## Render / Railway (FastAPI backend)

- **Root directory:** `backend`
- **Build:** `pip install uv && uv sync --no-dev`
- **Start:** `uv run uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Environment:** `DEEPSEEK_API_KEY`, `CORS_ORIGINS` (your Vercel origin)

---

## `uv.lock` in Git

**Commit `backend/uv.lock`** for reproducible installs and Docker builds. Do **not** add `uv.lock` to `.gitignore` unless you intentionally want floating versions (not recommended).

---

## Files to ignore locally (see `.gitignore`)

- `.env`, `.env.local`, `.env.*` (except `.env.example`)
- `backend/tmp/`, `extraction_result.json` (local scratch output)
- `__pycache__`, `.venv`
- `.local/`, `.cache/`
