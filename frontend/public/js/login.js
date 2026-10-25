import { login } from "./api.js";
import { getToken, setToken } from "./session.js";

// Already signed in (the Lobby verifies the token and sends us back if it is stale)
if (getToken()) location.replace("lobby.html");

const form = document.querySelector("#login-form");
const errorEl = document.querySelector("#error");
const submitBtn = form.querySelector("button");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const { username, password } = Object.fromEntries(new FormData(form));

  errorEl.hidden = true;
  submitBtn.disabled = true;

  try {
    const { accessToken } = await login(username.trim(), password);
    setToken(accessToken);
    location.replace("lobby.html");
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.hidden = false;
    submitBtn.disabled = false;
  }
});
