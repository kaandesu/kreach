# Kreach

A monorepo with three independent services, each in its own container:

- **frontend** — Next.js (React) · port `3000` · [`frontend/`](frontend)
- **backend** — Go HTTP API · port `8080` · [`backend/`](backend)
- **pocketbase** — PocketBase (BaaS) · port `8090` · [`pocketbase/`](pocketbase)

## Quick start (Docker)

```bash
cp .env.example .env
docker compose up --build
```

- Frontend → <http://localhost:3000>
- Backend health → <http://localhost:8080/health>
- PocketBase admin → <http://localhost:8090/_/>

This loads `docker-compose.override.yml` for hot-reload dev. For a
production-shaped run and Coolify deployment instructions, see
[`deployment.md`](deployment.md).

## Layout

```
.
├── docker-compose.yml           # orchestrates the three services
├── docker-compose.override.yml  # local dev: bind mounts + hot reload
├── .env.example                 # configurable ports / URLs / versions
├── frontend/                    # Next.js app + Dockerfile
├── backend/                     # Go API + Dockerfile
└── pocketbase/                  # PocketBase Dockerfile
```
