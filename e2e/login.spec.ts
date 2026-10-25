import { randomUUID } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";

const API = "http://localhost:3001";
const password = "correct-horse-battery";
let username: string;

// A fresh user for each run, created through the API, so tests never depend on leftover data
test.beforeAll(async ({ request }) => {
  username = `e2e_${randomUUID().slice(0, 8)}`;
  const res = await request.post(`${API}/api/auth/register`, {
    data: { username, password },
  });
  expect(res.status()).toBe(201);
});

async function logIn(page: Page, pass = password) {
  await page.goto("/");
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Password").fill(pass);
  await page.getByRole("button", { name: "Log in" }).click();
}

test("shows the login form", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Hello there" }),
  ).toBeVisible();
  await expect(page.getByLabel("Username")).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();
  await expect(page.getByRole("button", { name: "Log in" })).toBeVisible();
});

test("logs in and lands in the lobby", async ({ page }) => {
  await logIn(page);
  await expect(page).toHaveURL(/lobby\.html$/);
  await expect(page.getByRole("button", { name: "Log out" })).toBeVisible();
});

test("rejects a wrong password", async ({ page }) => {
  await logIn(page, "wrong-password");
  await expect(page.getByRole("alert")).toHaveText(
    "Invalid username or password",
  );
  await expect(page).toHaveURL("/");
});

test("redirects visitors who are not logged in away from the lobby", async ({
  page,
}) => {
  await page.goto("/lobby.html");
  await expect(page).toHaveURL(/index\.html$/);
});

test("log out ends the session on the server", async ({ page, request }) => {
  await logIn(page);
  await expect(page).toHaveURL(/lobby\.html$/);
  const token = await page.evaluate(() => localStorage.getItem("accessToken"));

  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL(/index\.html$/);

  // The old token must no longer work against the API
  const res = await request.get(`${API}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(res.status()).toBe(401);
});
