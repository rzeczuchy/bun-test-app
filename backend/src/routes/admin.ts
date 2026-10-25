import { authenticateBasic, registerUser } from "../auth";
import { error, json, readJson } from "../http";

export async function adminCreateUser(req: Request) {
  const admin = await authenticateBasic(req);
  if (!admin) return error("Admin credentials required (HTTP Basic auth)", 401);
  if (admin.role !== "admin") return error("Forbidden", 403);

  const result = await registerUser(await readJson(req));
  return "error" in result ? error(result.error, result.status) : json({ user: result.user }, 201);
}
