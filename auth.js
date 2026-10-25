
const authForm = document.getElementById("authForm");
const formTitle = document.getElementById("formTitle");
const formSubtitle = document.getElementById("formSubtitle");
const nameField = document.getElementById("nameField");
const fullNameInput = document.getElementById("fullName");
const passwordInput = document.getElementById("password");
const submitButton = document.getElementById("submitButton");
const registerTab = document.getElementById("registerTab");
const loginTab = document.getElementById("loginTab");
const switchText = document.getElementById("switchText");
const switchButton = document.getElementById("switchButton");
const formMessage = document.getElementById("formMessage");

let currentMode = "register";

function setMode(mode) {
  currentMode = mode;

  const isRegister = mode === "register";

  formTitle.textContent = isRegister
    ? "Create your account"
    : "Welcome back";

  formSubtitle.textContent = isRegister
    ? "Join Inky and start sharing your ideas."
    : "Log in to continue to Inky.";

  nameField.hidden = !isRegister;
  fullNameInput.required = isRegister;

  passwordInput.autocomplete = isRegister
    ? "new-password"
    : "current-password";

  submitButton.textContent = isRegister
    ? "Create account"
    : "Login";

  registerTab.classList.toggle("active", isRegister);
  loginTab.classList.toggle("active", !isRegister);

  switchText.firstChild.textContent = isRegister
    ? "Already have an account? "
    : "New to Inky? ";

  switchButton.textContent = isRegister
    ? "Login"
    : "Register";

  formMessage.textContent = "";
  formMessage.className = "form-message";
}

registerTab.addEventListener("click", function () {
  setMode("register");
});

loginTab.addEventListener("click", function () {
  setMode("login");
});

switchButton.addEventListener("click", function () {
  setMode(currentMode === "register" ? "login" : "register");
});

authForm.addEventListener("submit", function (event) {
  event.preventDefault();

  formMessage.className = "form-message";

  if (!authForm.checkValidity()) {
    authForm.reportValidity();
    return;
  }

  formMessage.classList.add("success");

  if (currentMode === "register") {
    formMessage.textContent =
      "Form looks good! Real account creation will be added in a later lesson.";
  } else {
    formMessage.textContent =
      "Form looks good! Real login will be added in a later lesson.";
  }

  // This is a demonstration only.
  // Do not store or transmit passwords from this prototype.
});

setMode("register");
