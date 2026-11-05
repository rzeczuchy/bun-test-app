import { authenticateBearer, registerUser } from "../auth";
import { deleteUserByUsername, getUserByUsername, listUsers } from "../db";
import { error, json, readJson } from "../http";

function requireAdmin(req: Request): Response | null {
  const user = authenticateBearer(req);
  if (!user) return error("Unauthorized", 401);
  if (user.role !== "admin") return error("Forbidden", 403);
  return null;
}

export async function adminCreateUser(req: Request) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const result = await registerUser(await readJson(req));
  return "error" in result
    ? error(result.error, result.status)
    : json({ user: result.user }, 201);
}

export async function adminDeleteUser(req: Request) {
  const denied = requireAdmin(req);
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

export async function adminGetUser(req: Request) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const username = new URL(req.url).searchParams.get("username");
  if (!username) return error("Query parameter 'username' is required", 400);

  const user = getUserByUsername(username);
  return user ? json({ user }) : error("User not found", 404);
}

export async function adminListUsers(req: Request) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  return json({ users: listUsers() });
}
