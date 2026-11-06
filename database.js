
const Database = require("better-sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "inky.db");
console.log("INKY DATABASE LOCATION:", databasePath);
const db = new Database(databasePath);

// Enable database-level protection against incomplete writes.
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// Create the articles table if it doesn't exist.
db.exec(`
  CREATE TABLE IF NOT EXISTS articles (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL
      CHECK (length(title) BETWEEN 1 AND 200),
    content TEXT NOT NULL
      CHECK (length(trim(content)) > 0),
    author TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'draft'
      CHECK (status IN ('draft', 'published')),
    createdAt TEXT NOT NULL
  );
`);


db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL COLLATE NOCASE UNIQUE,
    email TEXT NOT NULL COLLATE NOCASE UNIQUE,
    passwordHash TEXT NOT NULL,
    createdAt TEXT NOT NULL
  );
`);


// Add category and excerpt support without deleting existing articles.
const existingArticleColumns = db
  .prepare("PRAGMA table_info(articles)")
  .all()
  .map(column => column.name);

if (!existingArticleColumns.includes("category")) {
  db.exec(`
    ALTER TABLE articles
    ADD COLUMN category TEXT NOT NULL DEFAULT 'General'
  `);
}

if (!existingArticleColumns.includes("excerpt")) {
  db.exec(`
    ALTER TABLE articles
    ADD COLUMN excerpt TEXT NOT NULL DEFAULT ''
  `);
}


// Add article ownership support without deleting existing articles.
const articleColumns = db
  .prepare("PRAGMA table_info(articles)")
  .all()
  .map(column => column.name);

if (!articleColumns.includes("authorId")) {
  db.exec(`
    ALTER TABLE articles
    ADD COLUMN authorId TEXT REFERENCES users(id)
  `);
}


db.exec(`
  CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    articleId TEXT NOT NULL,
    userId TEXT NOT NULL,
    content TEXT NOT NULL
      CHECK (length(trim(content)) BETWEEN 1 AND 2000),
    createdAt TEXT NOT NULL,
    FOREIGN KEY (articleId) REFERENCES articles(id) ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
  );
`);


module.exports = db;
