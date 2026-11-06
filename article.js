
const articleContent = document.getElementById("articleContent");
const params = new URLSearchParams(window.location.search);
const articleId = params.get("id");

const API_BASE = "http://localhost:3000";

// Keep existing homepage sample-story links working.
const sampleArticles = [
  {
    id: "1",
    title: "How to Start Learning Technology",
    category: "Technology",
    excerpt: "A practical guide to building your digital skills one step at a time.",
    author: "Inky Team",
    date: "Oct 10, 2026",
    content: [
      "Technology offers many opportunities to learn, create, and solve everyday problems.",
      "Start with one skill, such as programming or web design. Learn the fundamentals and practise with small projects.",
      "Be consistent, learn from mistakes, and gradually build a portfolio that demonstrates your progress."
    ]
  },
  {
    id: "2",
    title: "Small Habits, Big Changes",
    category: "Lifestyle",
    excerpt: "Simple daily habits that can help you grow and feel more organized.",
    author: "Inky Team",
    date: "Oct 12, 2026",
    content: [
      "Small improvements can make everyday life more manageable.",
      "Choose a few realistic habits, such as planning your day, reading regularly, or taking short breaks.",
      "Focus on consistency rather than perfection. Over time, small actions can lead to meaningful progress."
    ]
  },
  {
    id: "3",
    title: "How to Learn a New Skill",
    category: "Learning",
    excerpt: "Make a realistic plan, practise consistently, and track your progress.",
    author: "Inky Team",
    date: "Oct 15, 2026",
    content: [
      "Learning a new skill starts with a clear and achievable goal.",
      "Break the skill into smaller tasks and practise them regularly. Build simple projects to apply what you learn.",
      "Review your progress, identify areas to improve, and adjust your learning plan as needed."
    ]
  },
  {
    id: "4",
    title: "Understanding the World of AI",
    category: "Technology",
    excerpt: "Explore artificial intelligence and the ways people use it in everyday life.",
    author: "Inky Team",
    date: "Oct 18, 2026",
    content: [
      "Artificial intelligence helps computers perform tasks that normally require human-like reasoning or pattern recognition.",
      "AI is used in many areas, including translation, image recognition, education, and productivity tools.",
      "Understanding its strengths and limitations helps people use AI thoughtfully and responsibly."
    ]
  },
  {
    id: "5",
    title: "Finding Time for Creativity",
    category: "Lifestyle",
    excerpt: "Make room for creative projects, even when your schedule is busy.",
    author: "Inky Team",
    date: "Oct 20, 2026",
    content: [
      "Creative projects do not always require long hours or expensive equipment.",
      "Set aside a short period for drawing, writing, photography, or another activity you enjoy.",
      "Experiment, stay curious, and allow yourself to improve through practice."
    ]
  },
  {
    id: "6",
    title: "The Power of Daily Practice",
    category: "Learning",
    excerpt: "Why short, regular practice sessions can help you build confidence.",
    author: "Inky Team",
    date: "Oct 22, 2026",
    content: [
      "Regular practice gives you opportunities to strengthen your skills gradually.",
      "Choose a manageable daily target and focus on one area at a time.",
      "Track your progress and revisit difficult topics. Small improvements can build confidence over time."
    ]
  }
];

function showMessage(message) {
  articleContent.replaceChildren();

  const paragraph = document.createElement("p");
  paragraph.textContent = message;

  articleContent.appendChild(paragraph);
}

function formatDate(value) {
  if (!value) return "Recently";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

// Transitional support for previously published browser-saved posts.
// Never return drafts from this fallback.
function getLegacyPublishedArticle(id) {
  try {
    const savedPosts = JSON.parse(
      localStorage.getItem("inklyPosts") || "[]"
    );

    if (!Array.isArray(savedPosts)) return null;

    const post = savedPosts.find(item =>
      String(item.id) === id &&
      item.status === "Published"
    );

    return post || null;
  } catch {
    return null;
  }
}

function renderArticle(post) {
  articleContent.replaceChildren();

  const category = document.createElement("p");
  category.className = "article-category";
  category.textContent = post.category || "General";

  const title = document.createElement("h1");
  title.textContent = post.title || "Untitled article";

  const excerpt = document.createElement("p");
  excerpt.className = "article-excerpt";
  excerpt.textContent = post.excerpt || "";

  const meta = document.createElement("p");
  meta.className = "article-meta";
  meta.textContent =
    `${post.author || "Inky Author"} · ${
      formatDate(post.date || post.createdAt || post.updatedAt)
    }`;

  const divider = document.createElement("hr");

  const body = document.createElement("div");
  body.className = "article-body";

  const content =
    typeof post.content === "string" ? post.content : "";

  content.split(/\r?\n/).forEach(paragraphText => {
    if (!paragraphText.trim()) return;

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

  document.title = `${post.title || "Article"} | Inky`;
}

async function loadArticle() {
  if (!articleId) {
    showMessage("No article was selected.");
    return;
  }

  try {
    // First try the Express backend.
    const response = await fetch(
      `${API_BASE}/api/articles/${encodeURIComponent(articleId)}`
    );

    if (response.ok) {
      const data = await response.json();

      if (
        data.article &&
        data.article.status === "published"
      ) {
        renderArticle(data.article);
        return;
      }

      showMessage(
        "Article not found, or it has not been published."
      );
      return;
    }

    if (response.status !== 404) {
      throw new Error(`API returned ${response.status}`);
    }

    // Backend has no published article with this ID.
    // Preserve the original sample-story links.
    const sample = sampleArticles.find(
      item => item.id === articleId
    );

    if (sample) {
      renderArticle(sample);
      return;
    }

    // Transitional fallback for existing published posts.
    const legacyPost = getLegacyPublishedArticle(articleId);

    if (legacyPost) {
      renderArticle(legacyPost);
      return;
    }

    showMessage(
      "Article not found, or it has not been published."
    );
  } catch (error) {
    console.error("Could not load article from Inky API:", error);

    // If the backend is offline, keep sample stories readable.
    const sample = sampleArticles.find(
      item => item.id === articleId
    );

    if (sample) {
      renderArticle(sample);
      return;
    }

    const legacyPost = getLegacyPublishedArticle(articleId);

    if (legacyPost) {
      renderArticle(legacyPost);
      return;
    }

    showMessage(
      "Could not load the article. Please check your connection and try again."
    );
  }
}

loadArticle();
