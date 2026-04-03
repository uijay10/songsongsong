# Web3 Release

A one-stop free Web3 request posting and matching platform ([web3release.com](https://web3release.com/)). This repository is a **pnpm monorepo** with a **React/Vite frontend**, a **FastAPI extraction service** (DeepSeek-compatible), and an optional **Express API** under `artifacts/api-server/`.

## Repository layout

```text
.
├── frontend/                 # React + Vite app (@workspace/frontend)
├── backend/                  # FastAPI + uvicorn (Web3 event extraction API)
│   ├── app/main.py         # POST /api/v1/extract
│   ├── app/prompt.py       # WEB3_EXTRACTION_PROMPT
│   └── pyproject.toml      # Python dependencies (use uv)
├── artifacts/
│   └── api-server/         # Express 5 + PostgreSQL (main product API)
├── lib/                    # Shared TypeScript packages (API client, db, …)
├── docker-compose.yml      # prod / dev profiles (frontend + backend)
├── Dockerfile              # Python API (context: repo root)
├── Dockerfile.frontend     # Static build + Nginx
├── docker/frontend.nginx.conf
└── package.json            # pnpm scripts (dev, backend, build)
```

Legacy folder name **`artifacts/`** holds Node services; treat **`frontend/`** and **`backend/`** as the primary app surfaces for new work.

## Prerequisites

- **Node.js** 24+ and **pnpm**
- **uv** ([install](https://docs.astral.sh/uv/)) for Python
- **Docker** (optional, for compose-based workflows)

## Local development

1. **Clone and install**

   ```bash
   git clone https://github.com/uijay10/songsongsong.git
   cd songsongsong
   pnpm install
   cd backend && uv sync && cd ..
   ```

2. **Environment**

   ```bash
   cp .env.example .env
   ```

   Set **`DEEPSEEK_API_KEY`** for the FastAPI extract API. For the full Node stack, set **`DATABASE_URL`** and other keys as documented in `.env.example`.

3. **Run frontend + Python backend together**

   ```bash
   pnpm dev
   ```

   - Vite: [http://localhost:5173](http://localhost:5173)
   - FastAPI: [http://localhost:8000](http://localhost:8000) (OpenAPI: `/docs`)

4. **Run only the Python API**

   ```bash
   pnpm backend
   ```

5. **Build only the frontend (production assets)**

   ```bash
   pnpm build
   ```

   Output: `frontend/dist/public`.

6. **Optional: frontend + Python + Express**

   ```bash
   pnpm dev:full
   ```

   Requires PostgreSQL and a valid **`DATABASE_URL`**.

### Extract API (FastAPI)

`POST /api/v1/extract` with JSON body:

```json
{
  "page_content": "plain text from the page",
  "source_url": "https://example.com/article"
}
```

Returns a **JSON array** of structured events. The model prompt is **`WEB3_EXTRACTION_PROMPT`** in `backend/app/prompt.py`. Authentication uses **`DEEPSEEK_API_KEY`** (preferred) or **`OPENAI_API_KEY`** for any OpenAI-compatible endpoint.

---

## Docker (one command)

**Production** — Nginx static site + FastAPI (Nginx proxies `/api/v1/` to the backend):

```bash
docker compose --profile prod up --build
```

**Development** — Vite + `uvicorn --reload` with bind mounts:

```bash
docker compose --env-file .env --profile dev up --build
```

Use `.env` for `DEEPSEEK_API_KEY` and optional `FRONTEND_PORT` / `BACKEND_PORT`.

**Build images manually**

```bash
docker build -f Dockerfile -t web3-extract-api .
docker build -f Dockerfile.frontend -t web3-frontend .
```

---

## Deploying to the cloud

### Vercel (frontend)

- **Install:** `pnpm install`
- **Build:** `pnpm --filter @workspace/frontend run build`
- **Output directory:** `frontend/dist/public`
- **Root:** repository root (pnpm workspace)

Configure any **`VITE_*`** variables in the Vercel project settings.

### Render / Railway (FastAPI backend)

- **Root directory:** `backend`
- **Install:** `pip install uv && uv sync --no-dev`
- **Start:** `uv run uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Environment:** `DEEPSEEK_API_KEY`, `CORS_ORIGINS` (include your Vercel URL)

### Render / Railway (Express API)

- **Build:** `pnpm install && pnpm --filter @workspace/api-server run build`
- **Start:** `node artifacts/api-server/dist/index.cjs`
- **Environment:** `DATABASE_URL`, `PORT`, `ADMIN_TOKEN_SECRET`, etc.

---

## Product overview

Web3 Release helps Web3 teams post requests and find contributors, developers, users, or partners. Supported areas include funding rounds, hiring, bug bounties, developer collaboration, and community building.

### Problems addressed

Information fragmentation in Web3 increases search cost and uneven access to opportunities. The platform reduces friction through categorization, search, and (future) notifications.

### Roadmap (high level)

- 0–2 months: improve UX and first matching cases
- 2–4 months: notifications and multi-chain integration
- 4–6 months: impact reporting and efficiency metrics

### Ecosystem impact

Lowering the barrier to collaboration helps smaller teams find resources faster and improves inclusivity across the ecosystem.
