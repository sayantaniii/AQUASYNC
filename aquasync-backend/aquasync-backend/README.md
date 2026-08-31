# AquaSync — Backend Base (Phase 1–2)

This is the very first working slice of AquaSync: a secure Express + PostgreSQL
backend with registration, login, JWT auth, and role-based access control.
Everything else in the roadmap (sensors, dashboard, ML, simulation) plugs into
this foundation.

## What's in here

```
aquasync-backend/
├── db/schema.sql              → roles + users tables, seeded with 4 roles
├── src/
│   ├── config/db.js           → PostgreSQL connection pool
│   ├── controllers/authController.js → register/login logic
│   ├── middleware/authMiddleware.js  → JWT check + role check
│   ├── middleware/errorHandler.js
│   ├── routes/authRoutes.js
│   ├── routes/userRoutes.js   → example protected + role-restricted routes
│   └── server.js              → app entrypoint
├── .env.example
└── package.json
```

## 1. Install prerequisites (one-time, on your machine)

- **VS Code**: https://code.visualstudio.com
- **Node.js LTS** (v20+): https://nodejs.org — confirm with `node -v` in a terminal
- **PostgreSQL** (v15+): https://www.postgresql.org/download — confirm with `psql --version`
- **Git**: https://git-scm.com

## 2. VS Code extensions worth installing

Open VS Code → Extensions panel (`Ctrl+Shift+X` / `Cmd+Shift+X`) → install:

- **ESLint**
- **Prettier - Code formatter**
- **PostgreSQL** (by Chris Kolkman) — lets you browse tables inside VS Code
- **Thunder Client** or **REST Client** — to test your API without leaving the editor
- **DotENV** — syntax highlighting for `.env`

## 3. Open the project in VS Code

- Unzip the project, then in VS Code: `File → Open Folder...` → select `aquasync-backend`
- Open the integrated terminal: `` Ctrl+` `` (backtick)

## 4. Install dependencies

In the VS Code terminal:

```bash
npm install
```

## 5. Create the database

Still in the terminal:

```bash
psql -U postgres
```

Inside the `psql` prompt:

```sql
CREATE DATABASE aquasync;
\q
```

Then load the schema:

```bash
psql -U postgres -d aquasync -f db/schema.sql
```

## 6. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` in VS Code and fill in:

- `DATABASE_URL` — use the password you set for your local `postgres` user
- `JWT_SECRET` — generate a real random value, e.g. run:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
  and paste the output in as `JWT_SECRET`

## 7. Run the server

```bash
npm run dev
```

You should see:

```
AquaSync backend running on http://localhost:5000
```

## 8. Test it

With Thunder Client / REST Client, or `curl`:

**Health check**
```bash
curl http://localhost:5000/health
```

**Register**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
```

**Login**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

Copy the `token` from the login response, then:

**Access a protected route**
```bash
curl http://localhost:5000/api/users/me \
  -H "Authorization: Bearer PASTE_TOKEN_HERE"
```

If that returns your user info, your auth + RBAC base is fully working.

## 9. Push to GitHub

```bash
git init
git add .
git commit -m "AquaSync base: auth, RBAC, PostgreSQL"
```

Create a repo on GitHub, then:

```bash
git remote add origin YOUR_REPO_URL
git branch -M main
git push -u origin main
```

`.env` is already in `.gitignore` — double check it never gets committed.

## 10. What comes next (Week 3+ from the roadmap)

Once this base runs cleanly:

1. Scaffold the React frontend (`npm create vite@latest aquasync-frontend`) and
   build a login page that talks to `/api/auth/login`.
2. Add the `sensors` and `sensor_readings` tables to `schema.sql`, then build
   the sensor simulator (Phase 5).
3. Add an `incidents` table + routes, reusing the same `requireAuth` /
   `requireRole` pattern used here.

Every later phase in the roadmap follows this same pattern: a table in
`schema.sql`, a controller, a route, and — if it needs restricting — a role
check.
