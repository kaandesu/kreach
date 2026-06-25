# Kreach Backend

A single-binary Go REST API for Kreach. It embeds **PocketBase as a Go library**
(not a separate service) for **all** persistence and authentication — users,
projects, email templates, send logs, and audit trails — backed by PocketBase's
embedded SQLite. There is **no PostgreSQL**.

Outbound email is delivered through [Resend](https://resend.com) using a
**user-provided API key supplied per request**. The key is used only for the
outbound call and is **never stored** in the database or any log.

## Architecture

```
main.go                       bootstrap PocketBase, register migrations + routes
migrations/1718000000_init.go schema: projects, templates, send_logs, audit_logs (+ lockdown rules)
internal/
  collections/   collection & field name constants (single source of truth)
  routes/        mounts all /api/* routes on PocketBase's native router
  handlers/      auth, projects, templates, emails, logs (+ audit helper)
  email/         minimal Resend HTTP client (key passed in, never persisted)
  ratelimit/     per-user 600ms throttle + 100/day cap helpers
```

**Router:** the API is registered on PocketBase's own router via `OnServe`
(`se.Router.Group("/api")`). One server, no extra HTTP framework.

**Data access is locked down.** Every custom collection's list/view rule is
owner-scoped (`owner = @request.auth.id`) and create/update/delete are
superuser-only. The only way to read or mutate data is through the authenticated
custom endpoints below — PocketBase's auto-generated CRUD API never exposes
another user's data. The superuser dashboard remains available at `/_/`.

## Requirements

- Go 1.24+
- (optional) `RESEND_FROM` — verified sender address. Defaults to
  `onboarding@resend.dev`.

## Run

```bash
cd backend
go mod tidy
go run . serve --http=127.0.0.1:8090
```

On first boot the migration provisions the four collections automatically.
- REST API: `http://127.0.0.1:8090/api/`
- Superuser dashboard: `http://127.0.0.1:8090/_/`

Build a binary: `go build -o kreach . && ./kreach serve`.

## Authentication

Auth uses PocketBase's built-in `users` auth collection. `register` and `login`
return a JWT in the `token` field. Send it on every protected request:

```
Authorization: Bearer <token>
```

## Data models

| Collection  | Fields |
|-------------|--------|
| `users` (built-in auth) | `email`, `password` (hashed), `name`, `verified`, … |
| `projects`  | `name`*, `description`, `owner`* (→users), `created`, `updated` |
| `templates` | `name`*, `subject`, `body`* (html), `owner`* (→users), `project` (→projects), `created`, `updated` |
| `send_logs` | `owner`* (→users), `recipient`* (email), `subject`, `template` (→templates), `project` (→projects), `status` (queued/sent/failed), `error`, `provider_id`, `created` |
| `audit_logs`| `user`* (→users), `action`*, `resource`, `recipient`, `ip`, `details` (json), `created` |

`*` = required. `owner`/`user` are always set server-side to the caller.

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | – | Create account, return token + record |
| POST | `/api/auth/login` | – | Authenticate, return token + record |
| GET  | `/api/auth/me` | ✓ | Current user profile |
| GET  | `/api/projects` | ✓ | List own projects |
| POST | `/api/projects` | ✓ | Create project |
| GET  | `/api/projects/{id}` | ✓ | Get own project |
| PATCH| `/api/projects/{id}` | ✓ | Update own project |
| DELETE| `/api/projects/{id}` | ✓ | Delete own project |
| GET  | `/api/templates` | ✓ | List own templates |
| POST | `/api/templates` | ✓ | Create/store template |
| GET  | `/api/templates/{id}` | ✓ | Get own template |
| PATCH| `/api/templates/{id}` | ✓ | Update own template |
| DELETE| `/api/templates/{id}` | ✓ | Delete own template |
| POST | `/api/emails/send` | ✓ | Send email via Resend (rate-limited) |
| GET  | `/api/logs/sends` | ✓ | Own send logs; `?recipient=` filter |
| GET  | `/api/logs/audit` | ✓ | Own audit trail; `?recipient=` filter |

Unauthenticated calls to any `✓` endpoint return `401`. Accessing another user's
record returns `404` (existence is not leaked).

## Rate limiting (email sends)

Enforced per authenticated user in `POST /api/emails/send`:

- **≥ 600 ms between sends.** A second send inside the window returns
  `429 Too Many Requests` with a `Retry-After` header.
- **≤ 100 sends per day.** Counted authoritatively from `send_logs` (survives
  restarts). Exceeding it returns `429`.

## Request/response examples

### Register

```bash
curl -X POST http://127.0.0.1:8090/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"alice@example.com","password":"supersecret123","name":"Alice"}'
```

```json
{
  "token": "eyJhbGciOiJIUzI1NiI...",
  "record": { "id": "jxfziabmvmen5bj", "email": "alice@example.com", "name": "Alice", "verified": false }
}
```

### Login

```bash
curl -X POST http://127.0.0.1:8090/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"alice@example.com","password":"supersecret123"}'
```

Returns the same `{ token, record }` shape.

### Create a project

```bash
curl -X POST http://127.0.0.1:8090/api/projects \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"name":"Launch","description":"Q3 outreach"}'
```

```json
{ "id": "q4kackahy9wdb29", "name": "Launch", "description": "Q3 outreach", "owner": "jxfziabmvmen5bj" }
```

### Store a template

```bash
curl -X POST http://127.0.0.1:8090/api/templates \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"name":"Welcome","subject":"Hi there","body":"<p>Hello {{name}}</p>","project":"q4kackahy9wdb29"}'
```

### Send an email

The Resend key is provided here and never stored.

```bash
curl -X POST http://127.0.0.1:8090/api/emails/send \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{
        "to": "bob@example.com",
        "subject": "Hey",
        "html": "<p>Hello!</p>",
        "resend_api_key": "re_your_key_here",
        "template": "optional_template_id",
        "project": "optional_project_id"
      }'
```

Success:

```json
{ "status": "sent", "provider_id": "a1b2c3...", "send_log": "ta14atifsw7aukh" }
```

A failed delivery still records a `failed` send_log and returns `500` with the
provider error; a throttled call returns `429`.

### List send logs for a recipient

```bash
curl "http://127.0.0.1:8090/api/logs/sends?recipient=bob@example.com" \
  -H "Authorization: Bearer $TOKEN"
```

## OpenAPI

A complete OpenAPI 3.0 spec is in [`openapi.yaml`](./openapi.yaml).
