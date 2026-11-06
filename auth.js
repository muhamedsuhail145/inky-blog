
const API_BASE = "http://localhost:3000";

const form = document.getElementById("authForm");
const title = document.getElementById("formTitle");
const subtitle = document.getElementById("formSubtitle");
const registerTab = document.getElementById("registerTab");
const loginTab = document.getElementById("loginTab");
const nameField = document.getElementById("nameField");
const usernameInput = document.getElementById("username");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const message = document.getElementById("formMessage");
const submitButton = document.getElementById("submitButton");
const switchText = document.getElementById("switchText");
const switchButton = document.getElementById("switchButton");

let mode = "register";

function showMessage(text, isError = false) {
  message.textContent = text;
  message.classList.toggle("error", isError);
}

function setMode(nextMode) {
  mode = nextMode;
  const registering = mode === "register";

  title.textContent = registering
    ? "Create your account"
    : "Log in to Inky";

  subtitle.textContent = registering
    ? "Join Inky and start sharing your ideas."
    : "Log in to continue to Inky.";

  submitButton.textContent = registering
    ? "Create account"
    : "Login";

  registerTab.classList.toggle("active", registering);
  loginTab.classList.toggle("active", !registering);

  nameField.hidden = !registering;
  usernameInput.required = registering;
  usernameInput.disabled = !registering;

  passwordInput.minLength = registering ? 12 : 1;
  passwordInput.autocomplete = registering
    ? "new-password"
    : "current-password";

  switchText.firstChild.textContent = registering
    ? "Already have an account? "
    : "New to Inky? ";

  switchButton.textContent = registering ? "Login" : "Register";

  showMessage("");
}

registerTab.addEventListener("click", () => setMode("register"));
loginTab.addEventListener("click", () => setMode("login"));

switchButton.addEventListener("click", () => {
  setMode(mode === "register" ? "login" : "register");
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const registering = mode === "register";

  const payload = {
    password: passwordInput.value
  };

  if (registering) {
    payload.username = usernameInput.value.trim();
    payload.email = emailInput.value.trim();
  } else {
    payload.login = emailInput.value.trim();
  }

  submitButton.disabled = true;
  showMessage(registering ? "Creating account..." : "Logging in...");

  try {
    const response = await fetch(
      `${API_BASE}/api/auth/${registering ? "register" : "login"}`,
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }
    );

    const raw = await response.text();
    let data;

    try {
      data = JSON.parse(raw);
    } catch {
      throw new Error(
        "Unexpected server response. Check that the Inky backend is running."
      );
    }

    if (!response.ok) {
      throw new Error(data.error || "Request failed.");
    }

    if (registering) {
      passwordInput.value = "";
      setMode("login");
      showMessage("Account created successfully! Please log in.");
      emailInput.focus();
    } else {
      showMessage("Login successful! Redirecting...");
      window.location.href = "index.html";
    }
  } catch (error) {
    showMessage(error.message, true);
  } finally {
    submitButton.disabled = false;
    submitButton.textContent =
      mode === "register" ? "Create account" : "Login";
  }
});

setMode("register");
