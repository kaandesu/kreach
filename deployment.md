# Kreach — Docker & Deployment

The Kreach monorepo runs as three independent containers, each with its own
Dockerfile:

| Service      | Path          | Port | Image             | Healthcheck        |
|--------------|---------------|------|-------------------|--------------------|
| frontend     | `./frontend`  | 3000 | `kreach-frontend` | `GET /`            |
| backend      | `./backend`   | 8080 | `kreach-backend`  | `GET /health`      |
| pocketbase   | `./pocketbase`| 8090 | `kreach-pocketbase` | `GET /api/health`|

Services talk to each other over the internal `kreach` network by service name
(e.g. the backend reaches PocketBase at `http://pocketbase:8090`). The browser
uses the host-facing URLs from `NEXT_PUBLIC_*`.

---

## Running locally

Requires Docker with the Compose plugin (`docker compose`).

```bash
cp .env.example .env          # COMPOSE_PROFILES defaults to `dev`
docker compose up --build     # auto-loads docker-compose.override.yml
```

`docker-compose.override.yml` is applied automatically and adds source
bind-mounts + hot reload:

- **frontend** runs `npm run dev` against `./frontend`
- **backend** runs `go run .` against `./backend`

Then open:

- Frontend: <http://localhost:3000>
- Backend health: <http://localhost:8080/health> → `{"status":"ok"}`
- PocketBase API: <http://localhost:8090/api/health>
- PocketBase admin UI: <http://localhost:8090/_/> (create the first superuser here)

Check status / healthchecks:

```bash
docker compose ps            # all three should report (healthy)
docker compose logs -f backend
```

Tear down (data in the `pb_data` volume is preserved):

```bash
docker compose down
```

To also wipe PocketBase data: `docker compose down -v`.

> **Apple Silicon:** set `PB_ARCH=arm64` in `.env` so the PocketBase image
> fetches the native binary.

---

## Production-shaped run (no dev override)

Pass the compose file explicitly so the override file is ignored, and select
the `prod` profile:

```bash
COMPOSE_PROFILES=prod docker compose -f docker-compose.yml up -d --build
```

This builds the optimized images (Next.js standalone server, static Go binary)
and runs them with `restart: unless-stopped`.

---

## Coolify deployment

Coolify can deploy this repo directly using its **Docker Compose** build pack.

1. **New Resource → Docker Compose**, pointed at this repository.
2. Set the **Compose file** to `docker-compose.yml` (this excludes the dev
   override automatically — Coolify only reads the file you specify).
3. **Environment variables** (Coolify UI → Environment Variables):
   - `COMPOSE_PROFILES=prod`
   - `NEXT_PUBLIC_API_URL` / `NEXT_PUBLIC_POCKETBASE_URL` set to the public
     domains you assign to the backend and PocketBase services.
   - `PB_VERSION`, and `PB_ARCH` matching the server architecture (usually
     `amd64`).
4. **Persistent storage:** the `pb_data` named volume holds all PocketBase
   collections, settings, and uploads. Coolify persists declared named volumes
   across redeploys — confirm `pb_data` is listed as a persistent volume so
   data survives deployments. (Alternatively map it to a host path / bind mount
   in Coolify's storage settings.)
5. **Domains / routing:** assign a domain to each service that should be public
   (typically `frontend` and `pocketbase`; keep `backend` internal or give it
   its own subdomain). Coolify's reverse proxy (Traefik) routes to each
   container's exposed port — 3000, 8080, 8090 respectively.
6. **Healthchecks:** already defined per service in `docker-compose.yml`, so
   Coolify will wait for `healthy` before marking the deployment ready and
   before starting dependents (`depends_on: service_healthy`).

After the first deploy, open `https://<pocketbase-domain>/_/` to create the
PocketBase superuser.

---

## Service reference

### frontend (`frontend/Dockerfile`)
Multi-stage Next.js build using `output: 'standalone'`; the runtime stage ships
only the standalone server and static assets, running as the non-root `node`
user.

### backend (`backend/Dockerfile`)
Multi-stage Go build producing a static `CGO_ENABLED=0` binary, run on a slim
Alpine image as a non-root user. Configurable via `PORT` and `POCKETBASE_URL`.

### pocketbase (`pocketbase/Dockerfile`)
Fetches the pinned PocketBase release binary (`PB_VERSION` / `PB_ARCH`) and
serves on `0.0.0.0:8090` with data under `/pb/pb_data` (mounted from the
`pb_data` volume).
