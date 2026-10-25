import {
  authenticateBearer,
  getBearerToken,
  issueToken,
  registerUser,
  revokeToken,
  verifyCredentials,
} from "../auth";
import { config } from "../config";
import { error, json, readJson } from "../http";

export async function login(req: Request) {
  const body = (await readJson(req)) as { username?: unknown; password?: unknown } | null;
  if (typeof body?.username !== "string" || typeof body?.password !== "string") {
    return error("Username and password are required", 400);
  }

  const user = await verifyCredentials(body.username, body.password);
  if (!user) return error("Invalid username or password", 401);

  const { token, expiresAt } = issueToken(user.id);
  return json({ accessToken: token, tokenType: "Bearer", expiresAt, user });
}

export async function register(req: Request) {
  if (!config.allowPublicRegistration) return error("Registration is disabled", 403);

  const result = await registerUser(await readJson(req));
  return "error" in result ? error(result.error, result.status) : json({ user: result.user }, 201);
}

export function logout(req: Request) {
  const token = getBearerToken(req);
  if (token) revokeToken(token);
  return new Response(null, { status: 204 });
}

export function me(req: Request) {
  const user = authenticateBearer(req);
  return user ? json({ user }) : error("Unauthorized", 401);
}
