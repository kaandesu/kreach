# Kreach — Frontend

The client-facing app for Kreach, an AI cold-email outreach tool. Covers the full
journey: auth → project management → AI template generation → preview → send → logs.

## Stack

- **Vite + React 18 + TypeScript**
- **Tailwind CSS + shadcn/ui** for all forms, modals, tables, and surfaces
- **reactbits.dev**-style animated surfaces (`src/components/reactbits`)
- **React Router v6** with auth-protected routes
- **PocketBase JS SDK** for authentication and all data
- **TanStack Query** for fetching/caching/mutations
- **OpenAI JS SDK** (in-browser) for template generation
- **react-hook-form + zod** for forms

## Getting started

```bash
npm install
cp .env.example .env      # point VITE_PB_URL at your PocketBase instance
npm run dev               # http://localhost:5173
```

Scripts: `npm run dev`, `npm run build`, `npm run typecheck`, `npm run preview`.

## Environment

| Var | Default | Purpose |
| --- | --- | --- |
| `VITE_PB_URL` | `http://127.0.0.1:8090` | PocketBase base URL (auth + data) |
| `VITE_SEND_ROUTE` | `/api/kreach/send` | Backend custom route that performs delivery |

## API keys are client-only

The user's **OpenAI** and **Resend** keys are held only in `sessionStorage`
(`src/hooks/useApiKeys.ts`) and are **never** sent to or stored on the Kreach
backend:

- The **OpenAI** key is used directly from the browser to generate templates.
- The **Resend** key is forwarded to the backend send route *only at send time*
  (not persisted server-side).

## Architecture

```
src/
  lib/         pocketbase singleton, in-browser OpenAI generation, utils
  types/       domain types mirroring the PocketBase collections
  api/         thin PB wrappers: projects, templates, logs, send
  hooks/       TanStack Query hooks + useApiKeys
  context/     AuthContext (wraps pb.authStore)
  routes/      ProtectedRoute guard
  components/
    ui/        shadcn primitives
    layout/    AppShell (topbar + user menu)
    stepper/   Stepper + the 7 wizard steps
    templates/ TemplateCard, candidate card, email preview (iframe), logs table
    reactbits/ animated aurora background + gradient text
  pages/       auth/{Login,Register}, Dashboard, ProjectWizard, ProjectLogs
```

Data access always flows through `api/*` → TanStack Query hooks; components never
call `pb` directly. UI is built exclusively from shadcn primitives in
`components/ui`. The backend send route is isolated in `src/api/send.ts` — the
single place to reconcile if the backend's path/shape changes.

## Assumed backend contract (for the backend slice)

Built against PocketBase collections (the backend agent owns the migrations):

- **`users`** — PocketBase auth collection (email/password).
- **`projects`** — `user` (relation, owner), `name`, `description`, `emails`
  (text blob), `branding_notes` (text), `resend_configured` (bool), `status`
  (`draft|generating|ready|sending|sent`). List/view rules scoped to `user`.
- **`templates`** — `project` (relation), `name`, `subject`, `html` (text),
  `model`, `prompt`, `selected` (bool).
- **`logs`** — `project` (relation), `template` (relation), `recipient`,
  `status` (`sent|failed|queued`), `error`, `sent_at`.

Custom send route — `POST {VITE_SEND_ROUTE}`:

```jsonc
// request
{ "projectId": "...", "templateId": "...", "resendApiKey": "re_...",
  "recipients": ["a@x.com"], "fromName": "...", "fromEmail": "..." }
// response
{ "results": [{ "recipient": "a@x.com", "status": "sent" }],
  "sent": 1, "failed": 0 }
```

The backend uses the supplied Resend key to deliver and writes a `logs` row per
recipient; the key is not persisted. Realtime subscriptions on `logs` drive the
live logs view.
