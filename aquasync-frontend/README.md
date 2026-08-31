# AquaSync — Frontend

React (Vite) frontend for AquaSync. Built around one rule: **citizens never
log in.** Reporting a water emergency is a single public form; only staff
(field_worker / operator / admin) sign in, and only to reach their dashboard.

## Setup

```bash
npm install
cp .env.example .env   # point VITE_API_URL at your Express API
npm run dev
```

## Routes

| Route | Who | Notes |
|---|---|---|
| `/` | Public | Report an incident, no account |
| `/track`, `/track/:referenceCode` | Public | Check status by reference code |
| `/staff/login` | Public | Staff sign-in |
| `/staff/field-worker` | field_worker | Assigned reports, update status |
| `/staff/operator` | operator | Full queue, assign to field workers |
| `/staff/admin` | admin | Stats + create staff accounts |

## Backend endpoints this expects

Your existing `/auth/login` and `/auth/register` are reused as-is for staff.
The pieces that are new for the incident-reporting flow (not yet in your
backend per the roadmap — you'll need to add an `incidents` table/routes):

- `POST /api/incidents` — **public**, no auth required. Body:
  `{ issueType, location, description, severity, contactPhone, latitude, longitude }`.
  Returns `{ referenceCode, ...incident }`.
- `GET /api/incidents/track/:referenceCode` — **public**, no auth required.
- `GET /api/incidents` — staff (operator/admin), list all.
- `GET /api/incidents/assigned-to-me` — field_worker, filtered by JWT user.
- `PATCH /api/incidents/:id/assign` — operator/admin. Body: `{ fieldWorkerId }`.
- `PATCH /api/incidents/:id/status` — field_worker/operator/admin. Body: `{ status }`.
- `GET /api/incidents/stats` — admin. Returns `{ open, inProgress, resolvedThisWeek, avgResponseTime }`.
- `GET /api/users?role=field_worker` — operator, to populate the assign dropdown.
- `GET /api/users` — admin, full staff list.

Since `POST /api/incidents` and the track-by-code lookup are public, make sure
your rate limiter and CORS config allow them without a token, and add
rate-limiting specifically on that route to prevent spam given it's open.

## Design notes

- Palette and type scale live in `tailwind.config.js` (teal/aqua primary,
  amber for the urgent-report CTA, monospace for reference codes and data
  readouts — reference codes and timestamps use `font-mono` throughout so
  they read like a dispatch log).
- The "no login" flow is intentional: `/` renders the full report form
  immediately, no landing page or extra click, because the audience is
  someone in the middle of an emergency.
