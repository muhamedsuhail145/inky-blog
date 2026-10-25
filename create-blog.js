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

function updateWordCount() {
  const text = contentInput.value.trim();

  const words = text === ""
    ? []
    : text.split(/\s+/);

  wordCount.textContent =
    words.length + (words.length === 1 ? " word" : " words");
}

function updatePreview() {
  document.getElementById("previewCategory").textContent =
    categoryInput.value;

  document.getElementById("previewTitle").textContent =
    titleInput.value;

  document.getElementById("previewExcerpt").textContent =
    excerptInput.value;

  document.getElementById("previewContent").textContent =
    contentInput.value;

  previewPanel.hidden = false;
}

contentInput.addEventListener("input", updateWordCount);

previewButton.addEventListener("click", function () {
  if (!blogForm.reportValidity()) {
    return;
  }

  updatePreview();

  editorMessage.textContent =
    "Preview updated. Review your article below.";

  editorMessage.className = "form-message success";
});


const draftButton = document.getElementById("draftButton");

const STORAGE_KEY = "inklyPosts";

function getSavedPosts() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}


function saveArticle(status) {
  if (!blogForm.reportValidity()) {
    return;
  }

  const posts = getSavedPosts();

  const article = {
    id: editingPost ? editingPost.id : String(Date.now()),
    title: titleInput.value.trim(),
    category: categoryInput.value,
    excerpt: excerptInput.value.trim(),
    content: contentInput.value.trim(),
    status: status,
    updatedAt: new Date().toLocaleDateString()
  };

  try {
    let updatedPosts;

    if (editingPost) {
      updatedPosts = posts.map(function (post) {
        return post.id === editingPost.id ? article : post;
      });
    } else {
      updatedPosts = [article, ...posts];
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPosts));

    editingPost = article;

    const url = new URL(window.location.href);
    url.searchParams.set("edit", article.id);
    window.history.replaceState({}, "", url);

    document.getElementById("publishButton").textContent =
      "Update and publish";

    draftButton.textContent = "Update draft";

    editorMessage.textContent =
      status === "Draft"
        ? "Draft saved successfully!"
        : "Article updated and published!";

    editorMessage.className = "form-message success";
  } catch {
    editorMessage.textContent =
      "Could not save. Browser storage may be unavailable or full.";

    editorMessage.className = "form-message error";
  }
}


draftButton.addEventListener("click", function () {
  saveArticle("Draft");
});

blogForm.addEventListener("submit", function (event) {
  event.preventDefault();
  saveArticle("Published");
});

function loadArticleForEditing() {
  if (!editPostId) {
    return;
  }

  const post = getSavedPosts().find(function (item) {
    return item.id === editPostId;
  });

  if (!post) {
    editorMessage.textContent = "That article could not be found.";
    editorMessage.className = "form-message error";
    return;
  }

  editingPost = post;

  titleInput.value = post.title;
  categoryInput.value = post.category;
  excerptInput.value = post.excerpt;
  contentInput.value = post.content;

  updateWordCount();

  document.querySelector(".editor-heading h1").textContent =
    "Edit your blog post";

  document.getElementById("publishButton").textContent =
    post.status === "Published" ? "Update and publish" : "Publish article";

  draftButton.textContent = "Save draft";

  editorMessage.textContent = "Editing: " + post.title;
}

loadArticleForEditing();


