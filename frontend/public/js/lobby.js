import { getMe, logout } from "./api.js";
import { clearToken, getToken } from "./session.js";

const errorEl = document.querySelector("#error");

function goToLogin() {
  clearToken();
  location.replace("index.html");
}

// This guard is only for UX. The backend is what actually enforces access to protected data.
async function init() {
  if (!getToken()) return goToLogin();

  try {
    await getMe();
  } catch (err) {
    if (err.status === 401) return goToLogin();
    errorEl.textContent = err.message;
    errorEl.hidden = false;
  }
  document.body.hidden = false;
}

document.querySelector("#logout").addEventListener("click", async () => {
  try {
    await logout(); // revokes the token on the server
  } catch {
    // Offline or server down: the token is still dropped locally below.
  }
  goToLogin();
});

init();
