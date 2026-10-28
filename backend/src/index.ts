import { config } from "./config";
import { adminExists, purgeExpiredSessions } from "./db";
import { error } from "./http";
import {
  adminCreateUser,
  adminDeleteUser,
  adminListUsers,
} from "./routes/admin";
import { login, logout, me, register } from "./routes/auth";

type Handler = (req: Request) => Response | Promise<Response>;

const routes: Record<string, Handler> = {
  "POST /api/auth/login": login,
  "POST /api/auth/register": register,
  "POST /api/auth/logout": logout,
  "GET /api/auth/me": me,
  "POST /api/admin/users": adminCreateUser,
  "DELETE /api/admin/users": adminDeleteUser,
  "GET /api/admin/users": adminListUsers,
};

async function handle(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return new Response(null, { status: 204 }); // CORS preflight

  const handler = routes[`${req.method} ${new URL(req.url).pathname}`];
  if (!handler) return error("Not found", 404);

  try {
    return await handler(req);
  } catch (err) {
    console.error(err);
    return error("Internal server error", 500);
  }
}

function withCors(req: Request, res: Response): Response {
  const origin = req.headers.get("origin");
  if (origin && config.corsOrigins.includes(origin)) {
    res.headers.set("Access-Control-Allow-Origin", origin);
    res.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, DELETE, OPTIONS",
    );
    res.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization",
    );
    res.headers.append("Vary", "Origin");
  }
  return res;
}

Bun.serve({
  port: config.port,
  maxRequestBodySize: 16 * 1024,
  async fetch(req) {
    return withCors(req, await handle(req));
  },
});

purgeExpiredSessions();
setInterval(purgeExpiredSessions, 60 * 60 * 1000);

console.log(`API listening on http://localhost:${config.port}`);
if (!adminExists()) {
  console.warn(
    "No admin user yet. Create one with: bun run create-admin <username>",
  );
}
