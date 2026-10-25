import { resolve } from "node:path";

const int = (value: string | undefined, fallback: number) => {
  const n = Number(value);
  return value && Number.isFinite(n) ? n : fallback;
};

export const config = {
  port: int(process.env.PORT, 3001),
  dbPath: process.env.DB_PATH ?? resolve(import.meta.dir, "../data/app.db"),
  corsOrigins: (process.env.CORS_ORIGINS ?? "http://localhost:3000,http://127.0.0.1:3000")
    .split(",")
    .map((origin) => origin.trim()),
  tokenTtlSeconds: int(process.env.TOKEN_TTL_SECONDS, 60 * 60 * 24 * 7),
  allowPublicRegistration: process.env.ALLOW_PUBLIC_REGISTRATION !== "false",
};
