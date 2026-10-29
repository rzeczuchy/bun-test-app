# Bun test app

Monorepo with a Bun + SQLite REST API (`backend/`) and a plain HTML/CSS/JS frontend (`frontend/`).

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
