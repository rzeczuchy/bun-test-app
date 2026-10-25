import { hashPassword } from "../src/auth";
import { upsertAdmin } from "../src/db";
import { parseNewUser } from "../src/validation";

const username = process.argv[2];
if (!username) {
  console.error("Usage: bun run create-admin <username>");
  process.exit(1);
}

// Note: input is visible while typing.
const password = prompt("Password:") ?? "";

const input = parseNewUser({ username, password });
if ("error" in input) {
  console.error(input.error);
  process.exit(1);
}

// Creates the admin, or resets the password / promotes the user if the name already exists.
upsertAdmin(input.username, await hashPassword(input.password));
console.log(`Admin "${input.username}" is ready.`);
