# Kreach — Docker & Deployment

Kreach runs as two containers:

| Service | Path | Port | Healthcheck |
| --- | --- | --- | --- |
| frontend | `./frontend` | 3000 | `GET /` |
| backend | `./backend` | 8080 | `GET /api/health` |

The production compose file exposes container ports only. Let Coolify/Traefik
route public domains to `frontend:3000` and `backend:8080`; host port bindings
are only added by `docker-compose.override.yml` for local development.

The backend embeds PocketBase and persists its SQLite data in the `pb_data`
volume mounted at `/app/pb_data`. The PocketBase admin UI is available from the
backend at `/_/` on the backend domain.

## Running Locally

```bash
cp .env.example .env
docker compose up --build
```

`docker-compose.override.yml` is applied automatically for local development:

- frontend runs Vite with hot reload on `http://localhost:3000`
- backend runs `go run . serve --http=0.0.0.0:8080`

Useful commands:

```bash
docker compose ps
docker compose logs -f backend
docker compose down
```

To also wipe PocketBase data, run `docker compose down -v`.

## Production-Shaped Run

Pass the compose file explicitly so the development override is ignored:

```bash
docker compose -f docker-compose.yml up -d --build
```

Set `VITE_PB_URL` to the public backend URL before building the frontend image,
because Vite embeds `VITE_*` variables at build time.

## Coolify Deployment

1. Create a Docker Compose resource pointed at this repository.
2. Use `docker-compose.yml` as the compose file.
3. Set environment variables:
   - `VITE_PB_URL=https://<backend-domain>`
   - `VITE_SEND_ROUTE=/api/emails/send`
4. Persist the named `pb_data` volume.
5. Expose the frontend on port `3000` and backend on port `8080`.

After the first deploy, create the PocketBase superuser at
`https://<backend-domain>/_/`.
