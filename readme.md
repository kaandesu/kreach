# Kreach

Kaan's Outreach app

A monorepo with two independent services:

- **frontend** — Vite React app · port `3000` · [`frontend/`](frontend)
- **backend** — Go API with embedded PocketBase · port `8080` · [`backend/`](backend)

## Quick start (Docker)

```bash
cp .env.example .env
docker compose up --build
```

- Frontend → <http://localhost:3000>
- Backend health → <http://localhost:8080/api/health>
- PocketBase admin → <http://localhost:8080/_/>

This loads `docker-compose.override.yml` for hot-reload dev. For a
production-shaped run and Coolify deployment instructions, see
[`deployment.md`](deployment.md).

## Layout

```
.
├── docker-compose.yml           # orchestrates the services
├── docker-compose.override.yml  # local dev: bind mounts + hot reload
├── .env.example                 # configurable ports / URLs
├── frontend/                    # Vite React app + Dockerfile
└── backend/                     # Go/PocketBase API + Dockerfile
```
