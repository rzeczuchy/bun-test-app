# Hello there

Monorepo with a Bun + SQLite REST API (`backend/`) and a plain HTML/CSS/JS frontend (`frontend/`).

## Run

```bash
bun install
cd backend && bun run create-admin <username>   # one-time: sets up the admin user
cd .. && bun run dev                            # API on :3001, frontend on :3000
```

Or run `bun run dev:backend` and `bun run dev:frontend` in two terminals. Open <http://localhost:3000>.

Configuration is optional, see `backend/.env.example`.

## API

| Method | Path                 | Auth                            | Purpose                                                            |
| ------ | -------------------- | ------------------------------- | ------------------------------------------------------------------ |
| POST   | `/api/auth/login`    | none                            | `{username, password}` returns `{accessToken, expiresAt, user}`    |
| POST   | `/api/auth/register` | none                            | Self-registration (disable with `ALLOW_PUBLIC_REGISTRATION=false`) |
| GET    | `/api/auth/me`       | Bearer token                    | Current user, used by the Lobby guard                              |
| POST   | `/api/auth/logout`   | Bearer token                    | Revokes the token                                                  |
| POST   | `/api/admin/users`   | Basic (admin username:password) | Admin registers a user, body `{username, password}`                |

Example (admin creating a user):

```bash
curl -u admin:ADMIN_PASSWORD -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"correct-horse"}' \
  http://localhost:3001/api/admin/users
```

## Layout

```bash
backend/
  src/index.ts          server, routing, CORS
  src/routes/           HTTP handlers (auth, admin)
  src/auth.ts           passwords, tokens, Bearer/Basic auth
  src/db.ts             SQLite schema and queries
  src/validation.ts     input rules
  scripts/create-admin.ts
frontend/
  serve.ts              static dev server
  public/               pages, css, js (api.js talks to the backend, session.js stores the token)
```
