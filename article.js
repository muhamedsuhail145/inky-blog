
const articleContent = document.getElementById("articleContent");
const params = new URLSearchParams(window.location.search);
const articleId = params.get("id");

function showMessage(message) {
  articleContent.replaceChildren();

  const paragraph = document.createElement("p");
  paragraph.textContent = message;

  articleContent.appendChild(paragraph);
}

function loadArticle() {
  if (!articleId) {
    showMessage("No article was selected.");
    return;
  }

  try {
    const savedPosts = JSON.parse(
      localStorage.getItem("inklyPosts") || "[]"
    );

    if (!Array.isArray(savedPosts)) {
      showMessage("Your saved articles could not be loaded.");
      return;
    }

    const post = savedPosts.find(function (item) {
      return (
        String(item.id) === articleId &&
        item.status === "Published"
      );
    });

    if (!post) {
      showMessage(
        "Article not found, or it has not been published."
      );
      return;
    }

    articleContent.replaceChildren();

    const category = document.createElement("p");
    category.className = "article-category";
    category.textContent = post.category;

    const title = document.createElement("h1");
    title.textContent = post.title;

    const excerpt = document.createElement("p");
    excerpt.className = "article-excerpt";
    excerpt.textContent = post.excerpt;

    const meta = document.createElement("p");
    meta.className = "article-meta";
    meta.textContent =
      "Inkly Author · " + (post.updatedAt || "Recently");

    const divider = document.createElement("hr");

    const body = document.createElement("div");
    body.className = "article-body";

    const paragraphs = post.content.split(/\r?\n/);

    paragraphs.forEach(function (paragraphText) {
      if (paragraphText.trim() === "") {
        return;
      }

      const paragraph = document.createElement("p");
      paragraph.textContent = paragraphText;
      body.appendChild(paragraph);
    });

    articleContent.append(
      category,
      title,
      excerpt,
      meta,
      divider,
      body
    );

    document.title = post.title + " | Inkly";
  } catch {
    showMessage(
      "Could not load the article. Please try again."
    );
  }
}

loadArticle();
