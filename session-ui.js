
const SESSION_API_BASE = "http://localhost:3000";

const guestLinks = document.getElementById("guestLinks");
const userLinks = document.getElementById("userLinks");
const welcomeUser = document.getElementById("welcomeUser");
const logoutButton = document.getElementById("logoutButton");

async function checkLoginSession() {
  try {
    const response = await fetch(`${SESSION_API_BASE}/api/auth/me`, {
      method: "GET",
      credentials: "include"
    });

    if (!response.ok) {
      showGuestLinks();
      return;
    }

    const data = await response.json();

    if (data.user && data.user.username) {
      welcomeUser.textContent = `Welcome, ${data.user.username}`;
      guestLinks.hidden = true;
      userLinks.hidden = false;
    } else {
      showGuestLinks();
    }
  } catch (error) {
    console.error("Could not check login session:", error);
    showGuestLinks();
  }
}

function showGuestLinks() {
  guestLinks.hidden = false;
  userLinks.hidden = true;
  welcomeUser.textContent = "";
}

logoutButton.addEventListener("click", async () => {
  logoutButton.disabled = true;

  try {
    const response = await fetch(`${SESSION_API_BASE}/api/auth/logout`, {
      method: "POST",
      credentials: "include"
    });

    if (!response.ok) {
      alert("Logout failed. Please try again.");
      return;
    }

    showGuestLinks();
  } catch (error) {
    console.error("Logout failed:", error);
    alert("Could not contact the server. Please try again.");
  } finally {
    logoutButton.disabled = false;
  }
});

checkLoginSession();
