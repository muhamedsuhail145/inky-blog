# Inky – Full Stack Blog Application

A modern full-stack blogging platform where users can create, publish, manage, and read blog articles.

## Features

- User registration and login
- Secure password hashing
- Session-based authentication
- Create and publish blog articles
- Save articles as drafts
- Edit and delete your own articles
- Browse published articles
- Article categories and short descriptions
- Comment on blog articles
- Personal dashboard to manage articles
- Responsive design for desktop and mobile devices

## Technologies Used

**Frontend**
- HTML5
- CSS3
- JavaScript

**Backend**
- Node.js
- Express.js
- REST API

**Database**
- SQLite
- better-sqlite3

**Security**
- bcryptjs
- express-session
- CORS
- SQLite session storage

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/muhamedsuhail145/inky-blog.git
```

### 2. Open the project

```bash
cd inky-blog
```

### 3. Install dependencies

```bash
npm install
```

### 4. Configure environment variables

Create your local `.env` file using `.env.example` as a reference.

Do not upload your `.env` file or database files containing private data to GitHub.

### 5. Start the backend

```bash
npm run dev
```

The backend runs at:

`http://localhost:3000`

### 6. Open the frontend

Use VS Code Live Server to open the frontend.

Typical local address:

`http://localhost:5500`

## API Endpoints

| Method    | Endpoint        | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Register a user |
| POST | `/api/auth/login`    | Log in |
| GET | `/api/auth/me`        | Check login session |
| GET | `/api/articles`       | Get published articles |
| GET | `/api/articles/:id`   | Get an article |
| POST | `/api/articles`      | Create an article |
| GET | `/api/my-articles`    | Get your articles |
| PUT | `/api/articles/:id`   | Update an article |
| DELETE | `/api/articles/:id`| Delete an article |
| GET | `/api/articles/:id/comments`  | Get comments |
| POST | `/api/articles/:id/comments` | Add a comment |

## Security
- Passwords are hashed before storage.
- Protected routes require authentication.
- Users can manage only their own articles.
- Session authentication is used for logged-in users.
- Environment variables are kept outside version control.

## Project Repository

GitHub: https://github.com/muhamedsuhail145/inky-blog

## Future Improvements

- Deploy the application online.
- Improve the user dashboard.
- Add profile pictures.
- Add article search and filtering.
- Improve image uploads.
- Add more user-friendly features.

## Author

Developed as a full-stack web development project.

**Project Name:** Inky  
**Status:** Finalizing for deployment 🚀