require("dotenv").config();

const session = require("express-session");
const SQLiteStore = require("connect-sqlite3")(session);
const bcrypt = require("bcryptjs");
const express = require("express");
const { randomUUID } = require("crypto");
const cors = require("cors");
const db = require("./database");

const app = express();
const PORT = 3000;
app.use(cors(
  { origin: [
    "http://localhost:5500",
    "http://127.0.0.1:5500"
  ],
  credentials: true
}));


if (process.env.NODE_ENV === "production" && !process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET must be configured in production.");
}

const sessionSecret =
  process.env.SESSION_SECRET ||
  (process.env.NODE_ENV !== "production"
    ? "inky-local-development-secret-change-before-deployment"
    : "");

app.use(session({
  name: "inky.sid",
  store: new SQLiteStore({
    db: "sessions.sqlite",
    dir: __dirname,
    table: "sessions"
  }),
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 24
  }
}));


app.use(express.json({ limit: "100kb" }));

// Prepared statements for safe database queries.
const getPublishedArticles = db.prepare(`
  SELECT id, title, content, author, status, createdAt, category, excerpt
  FROM articles
  WHERE status = 'published'
  ORDER BY createdAt DESC
`);

const getPublishedArticleById = db.prepare(`
  SELECT id, title, content, author, status, createdAt, category, excerpt
  FROM articles
  WHERE id = ? AND status = 'published'
`);


const createArticle = db.prepare(`
  INSERT INTO articles (
    id, title, content, author, status, createdAt, authorId
  )
  VALUES (
    @id, @title, @content, @author, @status, @createdAt, @authorId
  )
`);


// API status.
app.get("/api", (req, res) => {
  res.json({
    message: "Welcome to the Inky backend!",
    status: "Server is running",
    database: "SQLite"
  });
});

// Public list: published articles only.
app.get("/api/articles", (req, res) => {
  const articles = getPublishedArticles.all();

  res.json({
    count: articles.length,
    articles
  });
});

// Public detail: published articles only.
app.get("/api/articles/:id", (req, res) => {
  const article = getPublishedArticleById.get(req.params.id);

  if (!article) {
    return res.status(404).json({
      error: "Article not found."
    });
  }

  res.json({ article });
});


function requireLogin(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({
      error: "Please log in to create a draft."
    });
  }

  next();
}


// Create a draft in SQLite.

app.post("/api/articles", requireLogin, (req, res) => {
  console.log("POST /api/articles ROUTE REACHED");
  const { title, content, category, excerpt } = req.body || {};
  console.log("ARTICLE DATA RECEIVED:", {
  title,
  category,
  excerpt
});

  if (
  typeof title !== "string" ||
  typeof content !== "string" ||
  typeof category !== "string" ||
  typeof excerpt !== "string" ||
  !title.trim() ||
  !content.trim() ||
  !category.trim() ||
  !excerpt.trim() ||
  title.trim().length > 200 ||
  excerpt.trim().length > 240
  ) {
    return res.status(400).json({
      error: "Title and content are required."
    });
  }

  if (title.trim().length > 200) {
    return res.status(400).json({
      error: "Title must be 200 characters or fewer."
    });
  }

  if (excerpt.trim().length > 240) {
  return res.status(400).json({
    error: "Excerpt must be 240 characters or fewer."
    });
  }

 const article = {
  id: randomUUID(),
  title: title.trim(),
  content: content.trim(),
  authorId: req.session.userId,
  author: "",
  status: "draft",
  createdAt: new Date().toISOString(),
  category: category.trim(),
  excerpt: excerpt.trim()
};

  try {
    console.log("ABOUT TO SAVE ARTICLE TO DATABASE");
    const createArticle = db.prepare(`INSERT INTO articles (
    id, title, content, author, status, createdAt,
    authorId, category, excerpt
  )
  VALUES (
    @id, @title, @content, @author, @status, @createdAt,
    @authorId, @category, @excerpt
  )`
);
createArticle.run(article);
console.log("ARTICLE SAVED TO DATABASE");
return res.status(201).json({
  message: "Article saved successfully!",
  id: article.id
});

  } catch (error) {
    console.error("Could not save article:", error.message);

    return res.status(500).json({
      error: "Could not save the article."
    });
  }
});


app.get("/api/my-articles", requireLogin, (req, res) => {
  try {
    const articles = db.prepare(`
      SELECT id, title, content, author, status, createdAt, category, excerpt
      FROM articles
      WHERE authorId = ?
      ORDER BY createdAt DESC
    `).all(req.session.userId);

    return res.json({
      count: articles.length,
      articles
    });

  } catch (error) {
    console.error("Get my articles error:", error);

    return res.status(500).json({
      error: "Could not load your articles."
    });
  }
});


app.delete("/api/articles/:id", requireLogin, (req, res) => {
  try {
    const result = db.prepare(`
      DELETE FROM articles
      WHERE id = ? AND authorId = ?
    `).run(req.params.id, req.session.userId);

    if (result.changes === 0) {
      return res.status(404).json({
        error: "Article not found or you do not own this article."
      });
    }

    return res.json({
      message: "Article deleted successfully."
    });

  } catch (error) {
    console.error("Delete article error:", error);

    return res.status(500).json({
      error: "Could not delete article."
    });
  }
});


app.post("/api/articles/:id/comments", requireLogin, (req, res) => {
  try {
    const { content } = req.body;

    if (!content || !content.trim() || content.trim().length > 2000) {
      return res.status(400).json({
        error: "Comment must contain 1–2000 characters."
      });
    }

    const article = db.prepare(`
      SELECT id, status
      FROM articles
      WHERE id = ?
    `).get(req.params.id);

    if (!article || article.status !== "published") {
      return res.status(404).json({
        error: "Published article not found."
      });
    }

    const id = require("crypto").randomUUID();
    const createdAt = new Date().toISOString();

    db.prepare(`
      INSERT INTO comments (id, articleId, userId, content, createdAt)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      id,
      article.id,
      req.session.userId,
      content.trim(),
      createdAt
    );

    return res.status(201).json({
      message: "Comment added successfully.",
      comment: { id, articleId: article.id, content: content.trim(), createdAt }
    });

  } catch (error) {
    console.error("Add comment error:", error);
    return res.status(500).json({
      error: "Could not add comment."
    });
  }
});

app.get("/api/articles/:id/comments", (req, res) => {
  try {
    const comments = db.prepare(`
      SELECT comments.id, comments.content, comments.createdAt,
             users.username AS author
      FROM comments
      JOIN users ON users.id = comments.userId
      WHERE comments.articleId = ?
      ORDER BY comments.createdAt ASC
    `).all(req.params.id);

    return res.json({ comments });

  } catch (error) {
    console.error("Get comments error:", error);
    return res.status(500).json({
      error: "Could not load comments."
    });
  }
});



app.put("/api/articles/:id", requireLogin, (req, res) => {
  try {
    const { title, content, status, category, excerpt } = req.body || {};

    if (
      typeof title !== "string" ||
      typeof content !== "string" ||
      !title.trim() ||
      !content.trim() ||
      title.trim().length > 200
    ) {
      return res.status(400).json({
        error: "Please provide a valid title and content."
      });
    }

    if (!["draft", "published"].includes(status)) {
      return res.status(400).json({
        error: "Status must be draft or published."
      });
    }

    const result = db.prepare(`
      UPDATE articles
      SET title = ?, content = ?, category = ?, excerpt = ?, status = ?
      WHERE id = ? AND authorId = ?
    `).run(
      title.trim(),
      content.trim(),
      category.trim(),
      excerpt.trim(),
      status,
      req.params.id,
      req.session.userId
    );

    if (result.changes === 0) {
      return res.status(404).json({
        error: "Article not found or you do not own it."
      });
    }

    return res.json({
      message: "Article updated successfully.",
      id: req.params.id,
      status
    });
  } catch (error) {
    console.error("Update article error:", error);

    return res.status(500).json({
      error: "Could not update article."
    });
  }
});



const registerUser = db.prepare(`
  INSERT INTO users (id, username, email, passwordHash, createdAt)
  VALUES (@id, @username, @email, @passwordHash, @createdAt)
`);

app.post("/api/auth/register", async (req, res) => {
  const { username, email, password } = req.body || {};

  // Validate input types.
  if (
    typeof username !== "string" ||
    typeof email !== "string" ||
    typeof password !== "string"
  ) {
    return res.status(400).json({
      error: "Username, email, and password are required."
    });
  }

  const cleanUsername = username.trim();
  const cleanEmail = email.trim().toLowerCase();

  // Username: 3–30 letters, numbers, or underscores.
  if (!/^[a-zA-Z0-9_]{3,30}$/.test(cleanUsername)) {
    return res.status(400).json({
      error: "Username must be 3–30 characters using letters, numbers, or underscores."
    });
  }

  // Basic email format check.
  if (
    cleanEmail.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
  ) {
    return res.status(400).json({
      error: "Please enter a valid email address."
    });
  }

  // Require a strong password and avoid bcrypt's 72-byte limit.
  if (
    password.length < 12 ||
    Buffer.byteLength(password, "utf8") > 72
  ) {
    return res.status(400).json({
      error: "Password must be at least 12 characters and no more than 72 UTF-8 bytes."
    });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);

    const user = {
      id: randomUUID(),
      username: cleanUsername,
      email: cleanEmail,
      passwordHash,
      createdAt: new Date().toISOString()
    };

    registerUser.run(user);

    // Never return the password or password hash.
    return res.status(201).json({
      message: "Account created successfully.",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    if (
      error.code === "SQLITE_CONSTRAINT_UNIQUE" ||
      error.code === "SQLITE_CONSTRAINT_PRIMARYKEY"
    ) {
      return res.status(409).json({
        error: "That username or email is already registered."
      });
    }

    console.error("Registration failed:", error.message);

    return res.status(500).json({
      error: "Could not create the account."
    });
  }
});

if (process.env.NODE_ENV === "production" && !process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET must be configured in production.");
};


app.post("/api/auth/login", async (req, res) => {
  try {
    const { login, password } = req.body || {};

    if (
      typeof login !== "string" ||
      typeof password !== "string" ||
      !login.trim() ||
      !password
    ) {
      return res.status(400).json({
        error: "Enter your email or username and password."
      });
    }

    const account = db.prepare(`
      SELECT id, username, email, passwordHash
      FROM users
      WHERE username = ? OR email = ?
    `).get(login.trim(), login.trim());

    const validPassword = account
      ? await bcrypt.compare(password, account.passwordHash)
      : false;

    if (!validPassword) {
      return res.status(401).json({
        error: "Invalid username/email or password."
      });
    }

    req.session.regenerate((sessionError) => {
      if (sessionError) {
        console.error("Session regeneration failed:", sessionError);
        return res.status(500).json({
          error: "Unable to start your session. Please try again."
        });
      }

      req.session.userId = account.id;

      req.session.save((saveError) => {
        if (saveError) {
          console.error("Session save failed:", saveError);
          return res.status(500).json({
            error: "Unable to save your session. Please try again."
          });
        }

        return res.json({
          message: "Login successful.",
          user: {
            id: account.id,
            username: account.username,
            email: account.email
          }
        });
      });
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      error: "An unexpected error occurred during login."
    });
  }
});


app.get("/api/auth/me", (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({
      error: "Not logged in."
    });
  }

  try {
    const user = db.prepare(`
      SELECT id, username, email
      FROM users
      WHERE id = ?
    `).get(req.session.userId);

    if (!user) {
      return req.session.destroy(() => {
        res.status(401).json({
          error: "Session user not found. Please log in again."
        });
      });
    }

    return res.json({ user });
  } catch (error) {
    console.error("Session check error:", error);
    return res.status(500).json({
      error: "Could not check login status."
    });
  }
});

app.post("/api/auth/logout", (req, res) => {
  if (!req.session) {
    return res.status(200).json({
      message: "Logged out successfully."
    });
  }

  req.session.destroy((error) => {
    if (error) {
      console.error("Logout error:", error);
      return res.status(500).json({
        error: "Could not log out. Please try again."
      });
    }

    res.clearCookie("inky.sid", { path: "/" });

    return res.json({
      message: "Logged out successfully."
    });
  });
});


app.listen(PORT, () => {
  console.log(`Inky server running at http://localhost:${PORT}`);
  console.log("SQLite database connected.");
});
