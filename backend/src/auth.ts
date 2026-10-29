import { config } from "./config";
import {
  createSession,
  createUser,
  deleteSession,
  findUserBySession,
  getUserWithHashByUsername,
  type User,
} from "./db";
import { parseNewUser } from "./validation";

const sha256 = (value: string) => new Bun.CryptoHasher("sha256").update(value).digest("hex");

export const hashPassword = (password: string) => Bun.password.hash(password); // argon2id

// Checked against when the username doesn't exist, so response time doesn't reveal valid usernames.
const DUMMY_HASH = await Bun.password.hash("not-a-real-password");

export async function verifyCredentials(username: string, password: string): Promise<User | null> {
  const row = getUserWithHashByUsername(username);
  const valid = await Bun.password.verify(password, row?.password_hash ?? DUMMY_HASH);
  return row && valid ? { id: row.id, username: row.username, role: row.role } : null;
}

// Shared by public registration and the admin endpoint.
export async function registerUser(
  body: unknown,
): Promise<{ user: User } | { error: string; status: 400 | 409 }> {
  const input = parseNewUser(body);
  if ("error" in input) return { error: input.error, status: 400 };
  if (getUserWithHashByUsername(input.username)) return { error: "Username is already taken", status: 409 };

  return { user: createUser(input.username, await hashPassword(input.password), "user") };
}

// ---- access tokens (opaque, stored hashed, revocable) ----

export function issueToken(userId: number) {
  const token = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString("base64url");
  const expiresAt = Math.floor(Date.now() / 1000) + config.tokenTtlSeconds;
  createSession(sha256(token), userId, expiresAt);
  return { token, expiresAt };
}

export const revokeToken = (token: string) => deleteSession(sha256(token));

export function getBearerToken(req: Request): string | null {
  return req.headers.get("authorization")?.match(/^Bearer\s+(\S+)$/i)?.[1] ?? null;
}

export function authenticateBearer(req: Request): User | null {
  const token = getBearerToken(req);
  return token ? findUserBySession(sha256(token)) : null;
}

// ---- HTTP Basic (used only by the admin endpoint) ----

export async function authenticateBasic(req: Request): Promise<User | null> {
  const encoded = req.headers.get("authorization")?.match(/^Basic\s+(\S+)$/i)?.[1];
  if (!encoded) return null;

  const decoded = Buffer.from(encoded, "base64").toString("utf8");
  const separator = decoded.indexOf(":");
  if (separator < 1) return null;

  return verifyCredentials(decoded.slice(0, separator), decoded.slice(separator + 1));
}
