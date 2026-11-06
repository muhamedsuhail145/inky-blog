
const API_BASE = "http://localhost:3000";

const editPostId = new URLSearchParams(window.location.search).get("edit");
let editingPost = null;

const blogForm = document.getElementById("blogForm");
const titleInput = document.getElementById("blogTitle");
const categoryInput = document.getElementById("blogCategory");
const excerptInput = document.getElementById("blogExcerpt");
const contentInput = document.getElementById("blogContent");

const wordCount = document.getElementById("wordCount");
const previewButton = document.getElementById("previewButton");
const previewPanel = document.getElementById("previewPanel");
const editorMessage = document.getElementById("editorMessage");
const draftButton = document.getElementById("draftButton");
const publishButton = document.getElementById("publishButton");

function updateWordCount() {
  const text = contentInput.value.trim();
  const words = text === "" ? [] : text.split(/\s+/);

  wordCount.textContent =
    words.length + (words.length === 1 ? " word" : " words");
}

function updatePreview() {
  document.getElementById("previewCategory").textContent = categoryInput.value;
  document.getElementById("previewTitle").textContent = titleInput.value;
  document.getElementById("previewExcerpt").textContent = excerptInput.value;
  document.getElementById("previewContent").textContent = contentInput.value;

  previewPanel.hidden = false;
}

contentInput.addEventListener("input", updateWordCount);

previewButton.addEventListener("click", function () {
  if (!blogForm.reportValidity()) return;

  updatePreview();

  editorMessage.textContent = "Preview updated. Review your article below.";
  editorMessage.className = "form-message success";
});

async function saveArticle(status) {
if (!blogForm.reportValidity()) return;
const article = {
  title: titleInput.value.trim(),
  content: contentInput.value.trim(),
  category: categoryInput.value.trim(),
  excerpt: excerptInput.value.trim(),
  status: status
};


  try {
    const url = editingPost
      ? `${API_BASE}/api/articles/${encodeURIComponent(editingPost.id)}`
      : `${API_BASE}/api/articles`;

    const response = await fetch(url, {
      method: editingPost ? "PUT" : "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(article)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Could not save article.");
    }

    if (!editingPost) {
      editingPost = { id: data.id };
    }

    const pageUrl = new URL(window.location.href);
    pageUrl.searchParams.set("edit", editingPost.id);
    window.history.replaceState({}, "", pageUrl);

    publishButton.textContent =
      status === "published" ? "Update and publish" : "Publish article";

    draftButton.textContent = "Update draft";

    editorMessage.textContent =
      status === "published"
        ? "Article published successfully!"
        : "Draft saved successfully!";

    editorMessage.className = "form-message success";
  } catch (error) {
    editorMessage.textContent = error.message;
    editorMessage.className = "form-message error";
  }
}

draftButton.addEventListener("click", function () {
  saveArticle("draft");
});

blogForm.addEventListener("submit", function (event) {
  event.preventDefault();
  saveArticle("published");
});

async function loadArticleForEditing() {
  if (!editPostId) return;

  try {
    const response = await fetch(
      `${API_BASE}/api/my-articles`,
      { credentials: "include" }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Could not load your articles.");
    }

    const post = data.articles.find(item => item.id === editPostId);

    if (!post) {
      throw new Error("That article could not be found.");
    }

    editingPost = post;

    titleInput.value = post.title;
    categoryInput.value = post.category || "Technology";
    excerptInput.value = post.excerpt || "";
    contentInput.value = post.content;

    updateWordCount();

    document.querySelector(".editor-heading h1").textContent =
      "Edit your blog post";

    publishButton.textContent =
      post.status === "published" ? "Update and publish" : "Publish article";

    draftButton.textContent = "Update draft";

    editorMessage.textContent = "Editing: " + post.title;
  } catch (error) {
    editorMessage.textContent = error.message;
    editorMessage.className = "form-message error";
  }
}

loadArticleForEditing();
