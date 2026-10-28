import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { config } from "./config";

export type Role = "user" | "admin";

export interface User {
  id: number;
  username: string;
  role: Role;
}

export interface UserWithHash extends User {
  password_hash: string;
}

mkdirSync(dirname(config.dbPath), { recursive: true });

const db = new Database(config.dbPath, { create: true });
db.run("PRAGMA journal_mode = WAL");
db.run("PRAGMA foreign_keys = ON");

db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at    INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
  )
`);

// Only a hash of each token is stored, so a leaked database can't be used to log in.
db.run(`
  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL
  )
`);

const now = () => Math.floor(Date.now() / 1000);

// ---- users ----

export function findUserByUsername(username: string): UserWithHash | null {
  const row = db
    .query(
      "SELECT id, username, role, password_hash FROM users WHERE username = ?",
    )
    .get(username);
  return (row as UserWithHash | null) ?? null;
}

export function listUsers(): User[] {
  return db
    .query("SELECT id, username, role FROM users ORDER BY id")
    .all() as User[];
}

export function createUser(
  username: string,
  passwordHash: string,
  role: Role = "user",
): User {
  return db
    .query(
      "INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?) RETURNING id, username, role",
    )
    .get(username, passwordHash, role) as User;
}

export type DeleteUserResult = "deleted" | "not_found" | "is_admin";

export function deleteUserByUsername(username: string): DeleteUserResult {
  const { changes } = db
    .query("DELETE FROM users WHERE username = ? AND role != 'admin'")
    .run(username);

  if (changes > 0) return "deleted";
  return findUserByUsername(username) ? "is_admin" : "not_found";
}

export function upsertAdmin(username: string, passwordHash: string): void {
  db.query(
    `INSERT INTO users (username, password_hash, role) VALUES (?, ?, 'admin')
     ON CONFLICT(username) DO UPDATE SET password_hash = excluded.password_hash, role = 'admin'`,
  ).run(username, passwordHash);
}

export function adminExists(): boolean {
  return Boolean(
    db.query("SELECT 1 FROM users WHERE role = 'admin' LIMIT 1").get(),
  );
}

// ---- sessions ----

export function createSession(
  tokenHash: string,
  userId: number,
  expiresAt: number,
): void {
  db.query(
    "INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)",
  ).run(tokenHash, userId, expiresAt);
}

export function findUserBySession(tokenHash: string): User | null {
  const row = db
    .query(
      `SELECT u.id, u.username, u.role
       FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ? AND s.expires_at > ?`,
    )
    .get(tokenHash, now());
  return (row as User | null) ?? null;
}

export function deleteSession(tokenHash: string): void {
  db.query("DELETE FROM sessions WHERE token_hash = ?").run(tokenHash);
}

export function purgeExpiredSessions(): void {
  db.query("DELETE FROM sessions WHERE expires_at <= ?").run(now());
}
