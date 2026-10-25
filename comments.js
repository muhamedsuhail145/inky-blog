
const commentsSection = document.getElementById("commentsSection");
const commentForm = document.getElementById("commentForm");
const commentName = document.getElementById("commentName");
const commentText = document.getElementById("commentText");
const commentMessage = document.getElementById("commentMessage");
const commentsList = document.getElementById("commentsList");

const currentParams = new URLSearchParams(window.location.search);
const currentArticleId = currentParams.get("id");
const COMMENTS_KEY = "inklyComments";

function getComments() {
  try {
    const saved = JSON.parse(
      localStorage.getItem(COMMENTS_KEY) || "{}"
    );

    return saved && typeof saved === "object" && !Array.isArray(saved)
      ? saved
      : {};
  } catch {
    return {};
  }
}

function renderComments() {
  const allComments = getComments();
  const articleComments = allComments[currentArticleId] || [];

  commentsList.replaceChildren();

  if (articleComments.length === 0) {
    const empty = document.createElement("p");
    empty.textContent = "No comments yet. Be the first to comment!";
    commentsList.appendChild(empty);
    return;
  }

  articleComments.forEach(function (comment) {
    const card = document.createElement("div");
    card.className = "comment-card";

    const name = document.createElement("h3");
    name.textContent = comment.name;

    const date = document.createElement("small");
    date.textContent = comment.date;

    const message = document.createElement("p");
    message.textContent = comment.text;

    card.append(name, date, message);
    commentsList.appendChild(card);
  });
}

commentForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const name = commentName.value.trim();
  const message = commentText.value.trim();

  if (!name || !message) {
    commentMessage.textContent = "Please fill in both fields.";
    return;
  }

  try {
    const allComments = getComments();

    if (!Array.isArray(allComments[currentArticleId])) {
      allComments[currentArticleId] = [];
    }

    allComments[currentArticleId].push({
      name: name,
      text: message,
      date: new Date().toLocaleString()
    });

    localStorage.setItem(COMMENTS_KEY, JSON.stringify(allComments));

    commentForm.reset();
    commentMessage.textContent = "Comment posted successfully!";
    renderComments();
  } catch {
    commentMessage.textContent =
      "Could not save your comment. Browser storage may be full.";
  }
});

if (currentArticleId) {
  commentsSection.hidden = false;
  renderComments();
}
