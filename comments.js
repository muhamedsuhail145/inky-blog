const commentsSection = document.getElementById("commentsSection");
const commentForm = document.getElementById("commentForm");
const commentText = document.getElementById("commentText");
const commentMessage = document.getElementById("commentMessage");
const commentsList = document.getElementById("commentsList");

const commentsParams = new URLSearchParams(window.location.search);
const commentsArticleId = commentsParams.get("id");

const COMMENTS_API_BASE = "http://localhost:3000";

function showMessage(message) {
  commentMessage.textContent = message;
}

function formatDate(value) {
  if (!value) return "Recently";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString();
}

// Load comments from the Inky backend.
async function loadComments() {
  commentsList.replaceChildren();

  try {
    const response = await fetch(
      `${COMMENTS_API_BASE}/api/articles/${encodeURIComponent(commentsArticleId)}/comments`
    );

    if (!response.ok) {
      throw new Error(`Could not load comments: ${response.status}`);
    }

    const data = await response.json();
    const comments = data.comments || [];

    if (comments.length === 0) {
      const empty = document.createElement("p");
      empty.textContent = "No comments yet. Be the first to comment!";
      commentsList.appendChild(empty);
      return;
    }

    comments.forEach(comment => {
      const card = document.createElement("div");
      card.className = "comment-card";

      const name = document.createElement("h3");
      name.textContent = comment.username || "Inky User";

      const date = document.createElement("small");
      date.textContent = formatDate(comment.createdAt);

      const message = document.createElement("p");
      message.textContent = comment.content;

      card.append(name, date, message);
      commentsList.appendChild(card);
    });
  } catch (error) {
    console.error("Comment loading error:", error);

    const errorMessage = document.createElement("p");
    errorMessage.textContent =
      "Could not load comments. Please check your connection.";

    commentsList.appendChild(errorMessage);
  }
}

// Post a comment using the logged-in user's account.
commentForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const content = commentText.value.trim();

  if (!content) {
    showMessage("Please write a comment.");
    return;
  }

  try {
    const response = await fetch(
      `${COMMENTS_API_BASE}/api/articles/${encodeURIComponent(commentsArticleId)}/comments`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ content })
      }
    );

    const data = await response.json().catch(() => ({}));

    if (response.status === 401) {
      showMessage("Please log in before posting a comment.");
      return;
    }

    if (!response.ok) {
      showMessage(data.message || "Could not post your comment.");
      return;
    }

    commentForm.reset();
    showMessage("Comment posted successfully!");

    await loadComments();

  } catch (error) {
    console.error("Comment posting error:", error);
    showMessage("Could not connect to the Inky server.");
  }
});

// Start comments.
if (commentsArticleId && commentsSection && commentForm) {
  commentsSection.hidden = false;
  loadComments();
} else if (!commentsArticleId) {
  console.error("No article ID found for comments.");
}
