import { randomUUID } from "node:crypto";
import { expect, test, type APIRequestContext } from "@playwright/test";

const API = "http://localhost:3001";
const password = "correct-horse-battery";

// Keep in sync with loginByAccount in backend/src/routes/auth.ts
const ACCOUNT_LIMIT = 5;
const WINDOW_SECONDS = 15 * 60;

const uniqueName = (prefix: string) => `${prefix}_${randomUUID().slice(0, 8)}`;

const attemptLogin = (request: APIRequestContext, username: string, pass: string) =>
  request.post(`${API}/api/auth/login`, { data: { username, password: pass } });

async function registerUser(request: APIRequestContext, username: string) {
  const res = await request.post(`${API}/api/auth/register`, {
    data: { username, password },
  });
  expect(res.status()).toBe(201);
}

// Sequential on purpose, so the count at each step is deterministic.
async function failLogins(request: APIRequestContext, username: string, count: number) {
  for (let i = 0; i < count; i++) {
    const res = await attemptLogin(request, username, "wrong-password");
    expect(res.status(), `failed attempt ${i + 1} should be a plain 401`).toBe(401);
  }
}

let lockedUser: string;
let otherUser: string;
let resetUser: string;

// Separate users, so each test has its own per-username bucket.
test.beforeAll(async ({ request }) => {
  lockedUser = uniqueName("rl_locked");
  otherUser = uniqueName("rl_other");
  resetUser = uniqueName("rl_reset");
  for (const name of [lockedUser, otherUser, resetUser]) {
    await registerUser(request, name);
  }
});

test("blocks a username after too many failed logins", async ({ request }) => {
  await test.step("the first failures are ordinary 401s", async () => {
    await failLogins(request, lockedUser, ACCOUNT_LIMIT);
  });

  await test.step("the next attempt gets 429 with Retry-After", async () => {
    const res = await attemptLogin(request, lockedUser, "wrong-password");
    expect(res.status()).toBe(429);

    const retryAfter = Number(res.headers()["retry-after"]);
    expect(retryAfter).toBeGreaterThan(0);
    expect(retryAfter).toBeLessThanOrEqual(WINDOW_SECONDS);

    expect(await res.json()).toEqual({
      error: expect.stringMatching(/too many attempts/i),
    });
  });

  await test.step("the correct password is blocked too", async () => {
    const res = await attemptLogin(request, lockedUser, password);
    expect(res.status()).toBe(429);
  });

  await test.step("changing the username's letter case does not bypass the limit", async () => {
    const res = await attemptLogin(request, lockedUser.toUpperCase(), "wrong-password");
    expect(res.status()).toBe(429);
  });

  await test.step("a different user is not affected", async () => {
    const res = await attemptLogin(request, otherUser, password);
    expect(res.status()).toBe(200);
  });
});

test("a successful login resets the failure counter", async ({ request }) => {
  // One failure short of the limit...
  await failLogins(request, resetUser, ACCOUNT_LIMIT - 1);

  // ...then a successful login, which should clear the counter.
  const ok = await attemptLogin(request, resetUser, password);
  expect(ok.status()).toBe(200);

  // Without the reset, the attempts above (4 failures + 1 success) would already
  // have used up the limit and these would be 429.
  await failLogins(request, resetUser, 2);
});

test("the login form shows the rate limit message", async ({ page, request }) => {
  // A username that doesn't exist is limited the same way and needs no registration.
  const username = uniqueName("rl_ui");
  await failLogins(request, username, ACCOUNT_LIMIT);

  await page.goto("/");
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Password").fill("wrong-password");
  await page.getByRole("button", { name: "Log in" }).click();

  await expect(page.getByRole("alert")).toHaveText(/too many attempts/i);
  await expect(page).toHaveURL("/");
});