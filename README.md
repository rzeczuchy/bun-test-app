# Bun test app

Monorepo with a Bun + SQLite REST API (`backend/`) and a plain HTML/CSS/JS frontend (`frontend/`).

Mostly made to learn Bun runtime, plus some concepts around authentication and authorization.

The app implements:

- login page
- backend API with access token auth
- admin endpoints for user management
- rate limiting for login and registration endpoints

Some shortcuts taken during implementation:

- the backend uses an SQLite database
- no email verification

Mistakes to learn from:

1. The backend and frontend have different origin, and CORS is implemented. For a tiny app like this with only one frontend I should have gone with a single origin, enable same-origin policy and omit CORS.
2. I did not plan out all the API endpoints in advance, and ended up having to make a few awkward decisions later on when it comes to routing.

## Run

```bash
bun install
cd backend && bun run create-admin <username>   # one-time: sets up the admin user
cd .. && bun run dev                            # API on :3001, frontend on :3000
```

Or run `bun run dev:backend` and `bun run dev:frontend` in two terminals. Open <http://localhost:3000>.

Configuration is optional, see `backend/.env.example`.

## Testing

Playwright tests are stored in the `e2e` folder. Run with following:

```bash
bun run test:e2e                 # headless run
bunx playwright test --ui        # interactive UI, handy while writing tests
bunx playwright show-report      # open the HTML report after a run
```

## API

API is documented in `backend/openapi.yaml`. An external script is used to parse the OpenAPI spec into `backend/apidocs.html`.

The `bruno` folder contains a Bruno collection for manually testing the API.
