import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "bun src/index.ts",
      cwd: path.join(__dirname, "backend"),
      port: 3001,
      reuseExistingServer: false,
      env: {
        DB_PATH: path.join(__dirname, "backend", "data", "e2e.db"),
        ALLOW_PUBLIC_REGISTRATION: "true",
      },
    },
    {
      command: "bun serve.ts",
      cwd: path.join(__dirname, "frontend"),
      port: 3000,
      reuseExistingServer: false,
    },
  ],
});
