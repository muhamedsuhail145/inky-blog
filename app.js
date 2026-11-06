
const sampleBlogs = [
  {
    id: 1,
    title: "How to Start Learning Technology",
    category: "Technology",
    excerpt: "A practical guide to building your digital skills one step at a time.",
    author: "Inky Team",
    date: "Oct 10, 2026"
  },
  {
    id: 2,
    title: "Small Habits, Big Changes",
    category: "Lifestyle",
    excerpt: "Simple daily habits that can help you grow and feel more organized.",
    author: "Inky Team",
    date: "Oct 12, 2026"
  },
  {
    id: 3,
    title: "How to Learn a New Skill",
    category: "Learning",
    excerpt: "Make a realistic plan, practise consistently, and track your progress.",
    author: "Inky Team",
    date: "Oct 15, 2026"
  },
  {
    id: 4,
    title: "Understanding the World of AI",
    category: "Technology",
    excerpt: "Explore artificial intelligence and the ways people use it in everyday life.",
    author: "Inky Team",
    date: "Oct 18, 2026"
  },
  {
    id: 5,
    title: "Finding Time for Creativity",
    category: "Lifestyle",
    excerpt: "Make room for creative projects, even when your schedule is busy.",
    author: "Inky Team",
    date: "Oct 20, 2026"
  },
  {
    id: 6,
    title: "The Power of Daily Practice",
    category: "Learning",
    excerpt: "Why short, regular practice sessions can help you build confidence.",
    author: "Inky Team",
    date: "Oct 22, 2026"
  }
];

const API_BASE = "http://localhost:3000";

const blogGrid = document.getElementById("blogGrid");
const searchInput = document.getElementById("searchInput");
const postCount = document.getElementById("postCount");
const filterButtons = document.querySelectorAll(".filter-button");

let blogs = [...sampleBlogs];
let selectedCategory = "All";

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

async function loadPublishedBlogs() {
  try {
    const response = await fetch(`${API_BASE}/api/articles`);

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data.articles)) {
      throw new Error("Invalid article data received");
    }

    const serverBlogs = data.articles.map(post => ({
      id: post.id,
      title: post.title,
      category: post.category || "General",
      excerpt:
        post.excerpt ||
        (typeof post.content === "string"
          ? post.content.slice(0, 160)
          : ""),
      author: post.author || "Inky Author",
      date: formatDate(post.createdAt || post.updatedAt)
    }));

    // Replace only server-managed articles.
    // Keep the six existing sample stories.
    blogs = [...sampleBlogs, ...serverBlogs];

  } catch (error) {
    console.error("Could not load Inky articles:", error);

    // Keep sample stories visible if the backend is unavailable.
    blogs = [...sampleBlogs];
  }

  renderBlogs();
}

function renderBlogs() {
  const searchTerm = searchInput.value.toLowerCase().trim();

  const filteredBlogs = blogs.filter(blog => {
    const matchesCategory =
      selectedCategory === "All" ||
      blog.category === selectedCategory;

    const matchesSearch =
      blog.title.toLowerCase().includes(searchTerm) ||
      blog.excerpt.toLowerCase().includes(searchTerm) ||
      blog.category.toLowerCase().includes(searchTerm);

    return matchesCategory && matchesSearch;
  });

  postCount.textContent =
    `${filteredBlogs.length} ${
      filteredBlogs.length === 1 ? "story" : "stories"
    }`;

  blogGrid.replaceChildren();

  if (filteredBlogs.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "empty-message";
    emptyMessage.textContent =
      "No stories found. Try another search.";

    blogGrid.appendChild(emptyMessage);
    return;
  }

  filteredBlogs.forEach(blog => {
    const card = document.createElement("a");

    card.className = "blog-card";
    card.href =
      "article.html?id=" + encodeURIComponent(blog.id);
    card.style.textDecoration = "none";
    card.style.color = "inherit";

    const category = document.createElement("span");
    category.className = "card-category";
    category.textContent = blog.category;

    const title = document.createElement("h3");
    title.textContent = blog.title;

    const excerpt = document.createElement("p");
    excerpt.textContent = blog.excerpt;

    const meta = document.createElement("div");
    meta.className = "card-meta";
    meta.textContent = `${blog.author} · ${blog.date}`;

    const readLink = document.createElement("span");
    readLink.className = "read-article-link";
    readLink.textContent = "Read article →";

    card.append(
      category,
      title,
      excerpt,
      meta,
      readLink
    );

    blogGrid.appendChild(card);
  });
}

searchInput.addEventListener("input", renderBlogs);

filterButtons.forEach(button => {
  button.addEventListener("click", () => {
    selectedCategory = button.dataset.category;

    filterButtons.forEach(item => {
      item.classList.remove("active");
    });

    button.classList.add("active");
    renderBlogs();
  });
});

// Render immediately, then load published articles.
renderBlogs();
loadPublishedBlogs();
