
const API_BASE = "http://localhost:3000";

const dashboardList = document.getElementById("dashboardList");
const statusFilter = document.getElementById("statusFilter");
const totalCount = document.getElementById("totalCount");
const publishedCount = document.getElementById("publishedCount");
const draftCount = document.getElementById("draftCount");
const dashboardMessage = document.getElementById("dashboardMessage");

let posts = [];

function makeElement(tag, className, text) {
  const element = document.createElement(tag);

  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;

  return element;
}

async function loadPosts() {
  try {
    const response = await fetch(`${API_BASE}/api/my-articles`, {
      credentials: "include"
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Could not load your articles.");
    }

    posts = data.articles || [];
    renderDashboard();

  } catch (error) {
    dashboardMessage.textContent = error.message;
    dashboardMessage.className = "form-message error";
  }
}

function renderDashboard() {
  totalCount.textContent = posts.length;

  publishedCount.textContent =
    posts.filter(post => post.status === "published").length;

  draftCount.textContent =
    posts.filter(post => post.status === "draft").length;

  const selectedStatus = statusFilter.value.toLowerCase();

  const visiblePosts = posts.filter(post =>
    selectedStatus === "all" || post.status === selectedStatus
  );

  dashboardList.replaceChildren();

  if (visiblePosts.length === 0) {
    dashboardList.appendChild(
      makeElement(
        "div",
        "dashboard-empty",
        posts.length === 0
          ? "You haven't created any stories yet. Start writing your first one!"
          : "No stories match this filter."
      )
    );
    return;
  }

  visiblePosts.forEach(post => {
    const card = makeElement("article", "dashboard-post");
    const details = makeElement("div");

    const status = makeElement(
      "span",
      "status-label" + (post.status === "draft" ? " draft" : ""),
      post.status === "draft" ? "Draft" : "Published"
    );

    const title = makeElement("h3", "", post.title);

    const excerpt = post.content
      ? post.content.slice(0, 150) + (post.content.length > 150 ? "..." : "")
      : "";

    const description = makeElement("p", "", excerpt);

    const meta = makeElement(
      "p",
      "",
      `Updated ${post.createdAt || "recently"}`
    );

    details.append(status, title, description, meta);

    const actions = makeElement("div", "post-actions");

    const editButton = makeElement("button", "", "Edit");
    editButton.type = "button";

    editButton.addEventListener("click", function () {
      window.location.href =
        "create-blog.html?edit=" + encodeURIComponent(post.id);
    });

    const deleteButton = makeElement("button", "delete-button", "Delete");
deleteButton.type = "button";

deleteButton.addEventListener("click", async function () {
  if (!confirm(`Delete "${post.title}"? This cannot be undone.`)) {
    return;
  }

  try {
    const response = await fetch(
      `${API_BASE}/api/articles/${encodeURIComponent(post.id)}`,
      {
        method: "DELETE",
        credentials: "include"
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Could not delete article.");
    }

    dashboardMessage.textContent = "Story deleted successfully.";
    dashboardMessage.className = "form-message success";

    await loadPosts();

  } catch (error) {
    dashboardMessage.textContent = error.message;
    dashboardMessage.className = "form-message error";
  }
});

actions.append(editButton, deleteButton);
    card.append(details, actions);

    dashboardList.appendChild(card);
  });
}

statusFilter.addEventListener("change", renderDashboard);

loadPosts();
