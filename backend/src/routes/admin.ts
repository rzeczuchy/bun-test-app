import { authenticateBasic, registerUser } from "../auth";
import { deleteUserByUsername, listUsers } from "../db";
import { error, json, readJson } from "../http";

async function requireAdmin(req: Request): Promise<Response | null> {
  const user = await authenticateBasic(req);
  if (!user) return error("Admin credentials required (HTTP Basic auth)", 401);
  if (user.role !== "admin") return error("Forbidden", 403);
  return null;
}

export async function adminCreateUser(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const result = await registerUser(await readJson(req));
  return "error" in result
    ? error(result.error, result.status)
    : json({ user: result.user }, 201);
}

export async function adminDeleteUser(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const username = new URL(req.url).searchParams.get("username");
  if (!username) return error("Query parameter 'username' is required", 400);

  switch (deleteUserByUsername(username)) {
    case "deleted":
      return new Response(null, { status: 204 });
    case "not_found":
      return error("User not found", 404);
    case "is_admin":
      return error("Admin accounts cannot be deleted", 403);
  }
}

export async function adminListUsers(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  return json({ users: listUsers() });
}
