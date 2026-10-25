// Minimal static file server for local development.
import { join } from "node:path";

const root = join(import.meta.dir, "public");
const port = Number(process.env.PORT ?? 3000);

Bun.serve({
  port,
  async fetch(req) {
    let path: string;
    try {
      path = decodeURIComponent(new URL(req.url).pathname);
    } catch {
      return new Response("Bad request", { status: 400 });
    }
    if (path === "/") path = "/index.html";

    const fullPath = join(root, path);
    if (!fullPath.startsWith(root)) return new Response("Forbidden", { status: 403 });

    const file = Bun.file(fullPath);
    if (!(await file.exists())) return new Response("Not found", { status: 404 });
    return new Response(file);
  },
});

console.log(`Frontend on http://localhost:${port}`);
