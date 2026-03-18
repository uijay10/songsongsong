# Workspace

## Overview

Web3Hub – A Web3 project demand publishing and matching platform. One-stop platform connecting Web3 project teams, KOLs, and developers.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite + Tailwind CSS
- **Routing**: Wouter
- **State**: TanStack React Query
- **Web3**: Wagmi + WalletConnect v2 (@web3modal/wagmi)
- **Forms**: React Hook Form + Zod

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server
│   └── web3hub/            # React + Vite frontend (preview path: /)
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Web3Hub Features

### Pages
- **/** – Homepage with pinned projects grid + regular projects grid + empty state
- **/showcase** – Project Showcase (Twitter-style timeline)
- **/kol** – KOL Zone (leaderboard + timeline, gold/purple borders)
- **/developer** – Developer Column (timeline, green borders)
- **/community** – Community Chat (timeline with KOL/project tags)
- **/profile** – User profile (check-in, points, energy, social links, invite code)
- **/apply** – Apply for Space form (KOL / Project Team / Developer)
- **/project/:id** – Project detail page

### Key UI Elements
- Sticky top navbar with 19 navigation section links
- Pink buttons (#FF69B4), green neon countdown (#00FF9F) for pinned items
- Connect Wallet button (MetaMask, OKX, WalletConnect via @web3modal)
- After wallet connect: shows avatar gradient + truncated address

### Database Tables
- `users` – wallet, points, energy, space status, invite code
- `projects` – name, logo, owner wallet, pinned status, status
- `posts` – title, content, section, author info, likes, comments
- `space_applications` – wallet, type (kol/project/developer), links

### Energy System
- KOL: 1000 energy on activation, 20 posts/day max
- Project team: 50 energy on activation, unlimited daily posts
- Developer: 0 energy, 10 posts/day, only visible in developer column

### Payment (Energy Recharge)
- 150 USDT = 10 energy
- 200 USDT = 100 energy
- 300 USDT = 9,999,999 energy
- EVM address: 0xbe4548c1458be01838f1faafd69d335f0567399a
