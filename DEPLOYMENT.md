# Deployment guide

## Monorepo layout

```text
.
├── frontend/              # React + Vite (@workspace/frontend)
├── backend/               # FastAPI + DeepSeek (port 8000)
├── artifacts/api-server/  # Express 5 + PostgreSQL (optional)
├── lib/                   # Shared TypeScript packages
├── docker-compose.yml     # prod + dev profiles (frontend + backend)
├── Dockerfile.frontend    # Nginx + static build
└── package.json           # pnpm dev — unified local start
```

## Unified local start (recommended)

Prerequisites: [Node.js 24+](https://nodejs.org/), [pnpm](https://pnpm.io/), [uv](https://docs.astral.sh/uv/).

1. Copy environment file:

   ```bash
   cp .env.example .env
   ```

2. Set **`DEEPSEEK_API_KEY`** in `.env` (or `OPENAI_API_KEY` for another OpenAI-compatible provider).

3. Install JS dependencies and (once) Python deps:

   ```bash
   pnpm install
   cd backend && uv sync && cd ..
   ```

4. Start **frontend (Vite)** and **backend (FastAPI)** together:

   ```bash
   pnpm dev
   ```

This runs:

| Service   | URL / port |
|-----------|------------|
| Vite      | [http://localhost:5173](http://localhost:5173) |
| FastAPI   | [http://localhost:8000](http://localhost:8000) (Swagger: `/docs`) |

Vite dev server proxies:

- **`/api/v1/extract`** → `http://127.0.0.1:8000` (Python extract API; must be listed before `/api` in `vite.config.ts`)
- **`/api`** → `http://127.0.0.1:8080` (Express API, if you run it separately)

### Optional: full stack (frontend + Python + Express)

```bash
pnpm dev:full
```

Requires PostgreSQL and `DATABASE_URL` for the Node API.

---

## Docker Compose (frontend + backend)

### Production profile (Nginx static + uvicorn)

Builds the frontend with `Dockerfile.frontend`, serves files on port **80** (configurable), and proxies **`/api/v1/*`** to the FastAPI container on port **8000**.

```bash
cp .env.example .env
# Set DEEPSEEK_API_KEY in .env

docker compose --profile prod up --build
```

- UI: `http://localhost` (or `http://localhost:${FRONTEND_PORT}` if you set `FRONTEND_PORT` in `.env`, e.g. `8080:80` mapping).
- API docs: `http://localhost/api/v1/` is proxied to the backend; OpenAPI remains at path `/docs` on the backend internally. For browser access to Swagger through Nginx, add a route or hit `http://localhost:8000/docs` if you expose port 8000.

To expose the API directly for debugging, temporarily add port `8000:8000` on the `backend` service or run `docker compose --profile prod run --service-ports backend ...` (adjust as needed).

### Development profile (Vite + uvicorn --reload)

Mounts source for hot reload (Python) and runs Vite inside Node with the repo bind-mounted.

```bash
docker compose --profile dev up --build
```

- Vite: `http://localhost:5173` (or `${FRONTEND_DEV_PORT}`)
- FastAPI: `http://localhost:8000`

The dev container sets **`VITE_EXTRACT_PROXY_TARGET=http://backend-dev:8000`** so `/api/v1/extract` from the browser hits the Python service. **`VITE_API_PROXY_TARGET`** defaults to **`http://host.docker.internal:8080`** so the Express API can run on the host; on Linux, `extra_hosts` with `host-gateway` is included for `host.docker.internal`.

```bash
docker compose --env-file .env --profile dev up --build
```

---

## Single-image builds

**Python API only (monorepo root context):**

```bash
docker build -f Dockerfile -t web3-extract-api .
```

**Frontend static only:**

```bash
docker build -f Dockerfile.frontend -t web3-frontend .
```

---

## Vercel (frontend only)

- **Install command**: `pnpm install`
- **Build command**: `pnpm --filter @workspace/frontend run build`
- **Output directory**: `frontend/dist/public`
- **Root directory**: repository root (or a project that contains the pnpm workspace)

Set any **`VITE_*`** variables required at build time in the Vercel dashboard.

Deploy the **Python API** separately (Render / Railway / Fly.io) and call it from the browser or through your Node API.

---

## Render / Railway

### FastAPI (backend)

- **Root directory**: `backend`
- **Build**: install uv, then `uv sync --no-dev`
- **Start**: `uv run uvicorn app.main:app --host 0.0.0.0 --port $PORT` (platform sets `$PORT`)
- **Env**: `DEEPSEEK_API_KEY`, `CORS_ORIGINS` (your Vercel origin)

### Node API (artifacts/api-server)

- **Build**: `pnpm install && pnpm --filter @workspace/api-server run build`
- **Start**: `node artifacts/api-server/dist/index.cjs`
- **Env**: `DATABASE_URL`, `PORT`, `ADMIN_TOKEN_SECRET`, etc. (see `.env.example`)

---

## FastAPI extract endpoint

**`POST /api/v1/extract`**

Request JSON:

```json
{
  "page_content": "plain text or cleaned HTML text of the page",
  "source_url": "https://example.com/post"
}
```

Response: JSON **array** of event objects (see `backend/app/prompt.py`).

Authentication to DeepSeek uses **`DEEPSEEK_API_KEY`** (preferred) or **`OPENAI_API_KEY`**, with optional **`DEEPSEEK_BASE_URL`** / **`DEEPSEEK_MODEL`**.

---

## Architecture reference

| Layer | Typical hosting |
|-------|-----------------|
| Static frontend | Vercel / Cloudflare Pages / Nginx (Docker) |
| Express API | Render / Railway / Fly.io + PostgreSQL |
| Python extract API | Render / Railway / Fly.io / Docker |
| Database | Neon / Supabase / RDS |
