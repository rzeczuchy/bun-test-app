import {
  authenticateBearer,
  getBearerToken,
  issueToken,
  registerUser,
  revokeToken,
  verifyCredentials,
} from "../auth";
import { config } from "../config";
import { createLimiter } from "../rateLimit";
import { error, json, readJson, tooManyRequests } from "../http";

const MIN = 60_000;
const loginByIp = createLimiter(30, 15 * MIN); // all attempts from one IP
const loginByAccount = createLimiter(5, 15 * MIN); // one username from one IP
const registerByIp = createLimiter(5, 60 * MIN);

export async function login(req: Request, ip: string) {
  const ipWait = loginByIp.retryAfter(ip);
  if (ipWait) return tooManyRequests(ipWait);

  const body = (await readJson(req)) as {
    username?: unknown;
    password?: unknown;
  } | null;
  if (
    typeof body?.username !== "string" ||
    typeof body?.password !== "string"
  ) {
    return error("Username and password are required", 400);
  }

  const accountKey = `${ip}|${body.username.toLowerCase()}`;
  const accountWait = loginByAccount.retryAfter(accountKey);
  if (accountWait) return tooManyRequests(accountWait);

  // Count the attempt up front so parallel requests can't race past the check.
  loginByIp.record(ip);
  loginByAccount.record(accountKey);

  const user = await verifyCredentials(body.username, body.password);
  if (!user) return error("Invalid username or password", 401);

  loginByAccount.clear(accountKey); // a successful login resets this account's counter
  const { token, expiresAt } = issueToken(user.id);
  return json({ accessToken: token, tokenType: "Bearer", expiresAt, user });
}

export async function register(req: Request, ip: string) {
  if (!config.allowPublicRegistration)
    return error("Registration is disabled", 403);

  const wait = registerByIp.retryAfter(ip);
  if (wait) return tooManyRequests(wait);
  registerByIp.record(ip); // count every attempt, not just successes

  const result = await registerUser(await readJson(req));
  return "error" in result
    ? error(result.error, result.status)
    : json({ user: result.user }, 201);
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
