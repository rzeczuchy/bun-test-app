export type NewUserInput = { username: string; password: string };

export function parseNewUser(body: unknown): NewUserInput | { error: string } {
  if (typeof body !== "object" || body === null) {
    return { error: "Request body must be a JSON object" };
  }
  const { username, password } = body as Record<string, unknown>;

  if (typeof username !== "string" || !/^[A-Za-z0-9_.-]{3,32}$/.test(username)) {
    return { error: "Username must be 3-32 characters: letters, numbers, dot, dash or underscore" };
  }
  if (typeof password !== "string" || password.length < 8 || password.length > 128) {
    return { error: "Password must be 8-128 characters" };
  }
  return { username, password };
}
