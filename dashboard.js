
const STORAGE_KEY = "inklyPosts";

const dashboardList = document.getElementById("dashboardList");
const statusFilter = document.getElementById("statusFilter");
const totalCount = document.getElementById("totalCount");
const publishedCount = document.getElementById("publishedCount");
const draftCount = document.getElementById("draftCount");
const dashboardMessage = document.getElementById("dashboardMessage");

function getPosts() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function savePosts(posts) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
}

function makeElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function renderDashboard() {
  const posts = getPosts();

  totalCount.textContent = posts.length;
  publishedCount.textContent =
    posts.filter(post => post.status === "Published").length;
  draftCount.textContent =
    posts.filter(post => post.status === "Draft").length;

  const selectedStatus = statusFilter.value;
  const visiblePosts = posts.filter(post =>
    selectedStatus === "All" || post.status === selectedStatus
  );

  dashboardList.replaceChildren();

  if (visiblePosts.length === 0) {
    const empty = makeElement(
      "div",
      "dashboard-empty",
      posts.length === 0
        ? "You haven't created any stories yet. Start writing your first one!"
        : "No stories match this filter."
    );
    dashboardList.appendChild(empty);
    return;
  }

  visiblePosts.forEach(post => {
    const card = makeElement("article", "dashboard-post");
    const details = makeElement("div");
    const status = makeElement(
      "span",
      "status-label" + (post.status === "Draft" ? " draft" : ""),
      post.status
    );

    const title = makeElement("h3", "", post.title);
    const description = makeElement("p", "", post.excerpt);
    const meta = makeElement(
      "p",
      "",
      `${post.category} · Updated ${post.updatedAt || "recently"}`
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
    deleteButton.addEventListener("click", function () {
      if (!confirm(`Delete "${post.title}"? This cannot be undone.`)) {
        return;
      }

      const remainingPosts = getPosts().filter(
        item => item.id !== post.id
      );

      savePosts(remainingPosts);
      dashboardMessage.textContent = "Story deleted.";
      dashboardMessage.className = "form-message success";
      renderDashboard();
    });

    actions.append(editButton, deleteButton);
    card.append(details, actions);
    dashboardList.appendChild(card);
  });
}

statusFilter.addEventListener("change", renderDashboard);

renderDashboard();
