require("dotenv").config();

const session = require("express-session");
const PgSession = require("connect-pg-simple")(session);
const bcrypt = require("bcryptjs");
const express = require("express");
const { randomUUID } = require("crypto");
const cors = require("cors");
const { Pool } = require("pg");
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not configured.");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});
const app = express();
const PORT = 3000;

app.use(cors({
  origin: [
    "http://localhost:5500",
    "http://127.0.0.1:5500"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
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
  store: new PgSession({
    pool: pool,
    tableName: "sessions",
    createTableIfMissing: true
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

// API status.
app.get("/api", (req, res) => {
  res.json({
    message: "Welcome to the Inky backend!",
    status: "Server is running",
    database: "PostgreSQL"
  });
});

// Public list: published articles only.
app.get("/api/articles", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        title,
        content,
        author,
        status,
        "createdAt",
        category,
        excerpt
      FROM articles
      WHERE status = 'published'
      ORDER BY "createdAt" DESC
    `);

    return res.json({
      count: result.rows.length,
      articles: result.rows
    });

  } catch (error) {
    console.error("Get articles error:", error);

    return res.status(500).json({
      error: "Could not load articles."
    });
  }
});

// Public detail: published articles only.
app.get("/api/articles/:id", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        title,
        content,
        author,
        status,
        "createdAt",
        category,
        excerpt
      FROM articles
      WHERE id = $1
        AND status = 'published'
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Article not found."
      });
    }

    return res.json({
      article: result.rows[0]
    });

  } catch (error) {
    console.error("Get article error:", error);

    return res.status(500).json({
      error: "Could not load the article."
    });
  }
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
app.post("/api/articles", requireLogin, async (req, res) => {
  const { title, content, category, excerpt } = req.body || {};

  if (
    typeof title !== "string" ||
    typeof content !== "string" ||
    typeof category !== "string" ||
    typeof excerpt !== "string" ||
    !title.trim() ||
    !content.trim() ||
    !category.trim() ||
    !excerpt.trim()
  ) {
    return res.status(400).json({
      error: "Title, content, category, and excerpt are required."
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
    await pool.query(
      `INSERT INTO articles (
        id, title, content, author, status,
        "createdAt", "authorId", category, excerpt
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        article.id,
        article.title,
        article.content,
        article.author,
        article.status,
        article.createdAt,
        article.authorId,
        article.category,
        article.excerpt
      ]
    );

    return res.status(201).json({
      message: "Article saved successfully!",
      id: article.id
    });

  } catch (error) {
    console.error("Could not save article:", error);

    return res.status(500).json({
      error: "Could not save the article."
    });
  }
});


app.get("/api/my-articles", requireLogin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        id, title, content, author, status,
        "createdAt", category, excerpt
       FROM articles
       WHERE "authorId" = $1
       ORDER BY "createdAt" DESC`,
      [req.session.userId]
    );

    return res.json({
      count: result.rows.length,
      articles: result.rows
    });

  } catch (error) {
    console.error("Get my articles error:", error);

    return res.status(500).json({
      error: "Could not load your articles."
    });
  }
});


app.delete("/api/articles/:id", requireLogin, async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM articles
       WHERE id = $1 AND "authorId" = $2`,
      [req.params.id, req.session.userId]
    );

    if (result.rowCount === 0) {
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

app.post("/api/articles/:id/comments", requireLogin, async (req, res) => {
  try {
    const { content } = req.body || {};

    if (
      typeof content !== "string" ||
      !content.trim() ||
      content.trim().length > 2000
    ) {
      return res.status(400).json({
        error: "Comment must contain 1–2000 characters."
      });
    }

    const articleResult = await pool.query(
      `SELECT id, status
       FROM articles
       WHERE id = $1`,
      [req.params.id]
    );

    const article = articleResult.rows[0];

    if (!article || article.status !== "published") {
      return res.status(404).json({
        error: "Published article not found."
      });
    }

    const id = randomUUID();
    const createdAt = new Date().toISOString();
    const cleanContent = content.trim();

    await pool.query(
      `INSERT INTO comments
        (id, "articleId", "userId", content, "createdAt")
       VALUES ($1, $2, $3, $4, $5)`,
      [
        id,
        article.id,
        req.session.userId,
        cleanContent,
        createdAt
      ]
    );

    return res.status(201).json({
      message: "Comment added successfully.",
      comment: {
        id,
        articleId: article.id,
        content: cleanContent,
        createdAt
      }
    });

  } catch (error) {
    console.error("Add comment error:", error);

    return res.status(500).json({
      error: "Could not add comment."
    });
  }
});


app.get("/api/articles/:id/comments", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         comments.id,
         comments.content,
         comments."createdAt",
         users.username AS author
       FROM comments
       JOIN users ON users.id = comments."userId"
       WHERE comments."articleId" = $1
       ORDER BY comments."createdAt" ASC`,
      [req.params.id]
    );

    return res.json({
      comments: result.rows
    });

  } catch (error) {
    console.error("Get comments error:", error);

    return res.status(500).json({
      error: "Could not load comments."
    });
  }
});

app.put("/api/articles/:id", requireLogin, async (req, res) => {
  try {
    const { title, content, status, category, excerpt } = req.body || {};

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
        error: "Please provide a valid title, content, category, and excerpt."
      });
    }

    if (!["draft", "published"].includes(status)) {
      return res.status(400).json({
        error: "Status must be draft or published."
      });
    }

    const result = await pool.query(
      `UPDATE articles
       SET title = $1,
           content = $2,
           category = $3,
           excerpt = $4,
           status = $5
       WHERE id = $6 AND "authorId" = $7`,
      [
        title.trim(),
        content.trim(),
        category.trim(),
        excerpt.trim(),
        status,
        req.params.id,
        req.session.userId
      ]
    );

    if (result.rowCount === 0) {
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

app.post("/api/auth/register", async (req, res) => {
  const { username, email, password } = req.body || {};

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

  if (!/^[a-zA-Z0-9_]{3,30}$/.test(cleanUsername)) {
    return res.status(400).json({
      error: "Username must be 3–30 characters using letters, numbers, or underscores."
    });
  }

  if (
    cleanEmail.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
  ) {
    return res.status(400).json({
      error: "Please enter a valid email address."
    });
  }

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

    await pool.query(
      `INSERT INTO users
        (id, username, email, "passwordHash", "createdAt")
       VALUES ($1, $2, $3, $4, $5)`,
      [
        user.id,
        user.username,
        user.email,
        user.passwordHash,
        user.createdAt
      ]
    );

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
    if (error.code === "23505") {
      return res.status(409).json({
        error: "That username or email is already registered."
      });
    }

    console.error("Registration failed:", error);

    return res.status(500).json({
      error: "Could not create the account."
    });
  }
});


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

    const result = await pool.query(
      `SELECT id, username, email, "passwordHash"
       FROM users
       WHERE LOWER(username) = LOWER($1)
          OR LOWER(email) = LOWER($1)
       LIMIT 1`,
      [login.trim()]
    );

    const account = result.rows[0];

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


app.get("/api/auth/me", async (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({
      error: "Not logged in."
    });
  }

  try {
    const result = await pool.query(
      `SELECT id, username, email
       FROM users
       WHERE id = $1`,
      [req.session.userId]
    );

    const user = result.rows[0];

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
  console.log("PostgreSQL database connected.");
});
