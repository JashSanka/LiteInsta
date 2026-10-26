# LiteInsta

LiteInsta is a lightweight Instagram-like RESTful backend API built with **Express.js**, **Prisma ORM**, and **PostgreSQL** using **CommonJS**. It implements user and post management, relations, likes with an explicit join model, pagination, sorting, filtering, and cascading deletes.

---

## Features

- **Users**: Complete CRUD with validation, unique constraints, and relation counts (`posts`, `likes`).
- **Posts**: Complete CRUD with required author relations, user summaries (omitting sensitive fields like email), and like counts.
- **Likes**: Many-to-many relation via an explicit `Like` model with composite primary key `(userId, postId)` preventing duplicates at the database level.
- **Pagination**: Reusable pagination utility supporting `page` and `limit` with limits capped at 50, returning `{ data, meta }`.
- **Sorting & Filtering**:
  - Users: filter by `isPrivate`, `search` (case-insensitive substring across username or fullname), `hasPosts`, and sort by `createdAt`, `username`, `fullname` (`asc`/`desc`).
  - Posts: filter by `location` (case-insensitive equality), `search` (case-insensitive caption match), `from` and `to` date boundaries, and sort by `createdAt`, `updatedAt`, `likes` (with newer posts as tie-breaker).
- **User Posts & Liked Posts**: Retrieve a user's authored posts or liked posts paginated in a single database transaction.
- **Cascading Deletes**: Deleting a user cascades to delete their authored posts and likes they gave or received.
- **Seeding**: Deterministic seed script populating 12 users, 24 posts, and 29 likes.

---

## Tech Stack & Architecture

- **Runtime**: Node.js (v20+ or v26+)
- **Framework**: Express 5
- **ORM**: Prisma 7 with `@prisma/adapter-pg`
- **Database**: PostgreSQL
- **Module System**: CommonJS (`require` / `module.exports`)
- **Structure**:
  ```txt
  prisma/
    schema.prisma         # Models (User, Post, Like)
    migrations/           # Migration SQL history
    seed-data.js          # Seed dataset
    seed.js               # Relational seed execution script
  src/
    index.js              # Express app entrypoint
    db.js                 # Shared Prisma Client instance
    utils/
      pagination.js       # Reusable pagination parser & formatter
    routes/
      users.routes.js     # User routes
      posts.routes.js     # Post and Like routes
    controllers/
      users.controller.js # User request handling
      posts.controller.js # Post request handling
      likes.controller.js # Like request handling
    services/
      users.service.js    # User Prisma queries
      posts.service.js    # Post Prisma queries
      likes.service.js    # Like Prisma queries
  test/
    api.test.js           # Integration test suite
  ```

---

## Setup & Installation

### 1. Prerequisites

- **Node.js**: v20 or higher
- **PostgreSQL**: A running PostgreSQL instance (or local Prisma Postgres server)

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Configure your database connection string in `.env`:

```env
DATABASE_URL="postgres://postgres:postgres@localhost:5432/liteinsta"
PORT=3000
```

> **Note**: Never commit `.env` or sensitive credentials to version control.

### 4. Database Migrations

Generate Prisma Client and apply migrations to your database:

```bash
npx prisma generate
npx prisma migrate dev
```

### 5. Seed the Database

Populate initial users, posts, and likes:

```bash
npm run seed
# or: npx prisma db seed
# or: node prisma/seed.js
```

> **Warning**: Reseeding deletes all existing rows from `Like`, `Post`, and `User` tables before inserting the seed data.

---

## Running the Application

### Start Server

```bash
npm start
```

Default port is `3000`. The server logs:

```txt
Server started on port 3000
```

### Run Automated Tests

To run the complete end-to-end integration test suite:

```bash
npm test
```

---

## API Endpoints

### Health

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Server health check (`{"status": "OK"}`) |

---

### Users

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/users` | Create user |
| `GET` | `/users` | List users (paginated, sorted, filtered) |
| `GET` | `/users/:id` | Get user by ID (includes post and like counts) |
| `GET` | `/users/:id/posts` | Get user's authored posts (paginated) |
| `GET` | `/users/:id/liked-posts` | Get posts liked by user (paginated) |
| `PATCH` | `/users/:id` | Update user (`fullname`, `bio`, `isPrivate`) |
| `DELETE` | `/users/:id` | Delete user (cascades to posts and likes) |

#### `POST /users`

**Request Body:**
```json
{
  "username": "riya_travels",
  "email": "riya@example.com",
  "fullname": "Riya Sharma",
  "bio": "Chasing sunsets 🌅"
}
```

- Required: `username`, `email`, `fullname`
- Optional: `bio`
- Status codes: `201` on success, `400` if missing required fields, `409` if username/email already taken.

#### `GET /users`

**Query Parameters:**
- `page`: positive integer (default: `1`)
- `limit`: positive integer, max 50 (default: `10`)
- `sortBy`: `createdAt` (default), `username`, `fullname`
- `order`: `desc` (default), `asc`
- `isPrivate`: `true` or `false`
- `hasPosts`: `true` or `false`
- `search`: case-insensitive search matching `username` or `fullname`

**Response Format:**
```json
{
  "data": [
    {
      "id": 1,
      "username": "riya_travels",
      "email": "riya@example.com",
      "fullname": "Riya Sharma",
      "bio": "Chasing sunsets 🌅",
      "isPrivate": false,
      "createdAt": "2026-01-03T09:00:00.000Z",
      "updatedAt": "2026-01-03T09:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 12,
    "totalPages": 2
  }
}
```

---

### Posts

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/posts` | Create post with author |
| `GET` | `/posts` | List posts (paginated, sorted, filtered) |
| `GET` | `/posts/:id` | Get post by ID with author summary and like count |
| `PATCH` | `/posts/:id` | Update post (`caption`, `location`) |
| `DELETE` | `/posts/:id` | Delete post (cascades to likes) |

#### `POST /posts`

**Request Body:**
```json
{
  "imageUrl": "https://picsum.photos/seed/insta01/600/600",
  "authorId": 1,
  "caption": "Sunset at Baga beach 🌅",
  "location": "Goa"
}
```

- Required: `imageUrl`, `authorId`
- Optional: `caption`, `location`
- Status codes: `201` on success, `400` if `imageUrl` or `authorId` missing, `404` if author user does not exist.

#### `GET /posts`

**Query Parameters:**
- `page`: positive integer (default: `1`)
- `limit`: positive integer, max 50 (default: `10`)
- `sortBy`: `createdAt` (default), `updatedAt`, `likes`
- `order`: `desc` (default), `asc`
- `location`: exact case-insensitive match (e.g. `goa`, `Goa`)
- `search`: case-insensitive substring match on `caption`
- `from`: valid ISO date (posts created on or after)
- `to`: valid ISO date (posts created strictly before)

**Response Format:**
```json
{
  "data": [
    {
      "id": 1,
      "imageUrl": "https://picsum.photos/seed/insta01/600/600",
      "caption": "Sunset at Baga beach 🌅",
      "location": "Goa",
      "authorId": 1,
      "createdAt": "2026-02-01T18:30:00.000Z",
      "updatedAt": "2026-02-01T18:30:00.000Z",
      "author": {
        "id": 1,
        "username": "riya_travels",
        "fullname": "Riya Sharma"
      },
      "_count": {
        "likes": 5
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 24,
    "totalPages": 3
  }
}
```

---

### Likes

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/posts/:id/likes` | List user summaries who liked the post (sorted by username asc) |
| `POST` | `/posts/:id/likes` | Like a post |
| `DELETE` | `/posts/:id/likes/:userId` | Unlike a post |

#### `POST /posts/:id/likes`

**Request Body:**
```json
{
  "userId": 2
}
```

- Status codes:
  - `201`: Liked successfully (`{ "userId": 2, "postId": 1, "createdAt": "..." }`)
  - `400`: Missing `userId` (`{ "error": "userId is required" }`)
  - `404`: Post not found (`{ "error": "Post not found" }`)
  - `404`: User not found (`{ "error": "User not found" }`)
  - `409`: Already liked (`{ "error": "Already liked" }`)

#### `DELETE /posts/:id/likes/:userId`

- Status codes:
  - `204`: Empty response body on successful unlike
  - `404`: Like not found (`{ "error": "Like not found" }`)

---

## Error Handling

Standardized JSON error responses are returned for client errors:

| Status Code | Scenario | Response Body |
| :--- | :--- | :--- |
| `400` | Missing user required fields | `{"error": "username, email and fullname are required"}` |
| `400` | Missing post required fields | `{"error": "imageUrl and authorId are required"}` |
| `400` | Missing userId on like | `{"error": "userId is required"}` |
| `400` | Invalid pagination | `{"error": "page and limit must be positive integers"}` |
| `400` | Invalid user sort field | `{"error": "sortBy must be one of: createdAt, username, fullname"}` |
| `400` | Invalid post sort field | `{"error": "sortBy must be one of: createdAt, updatedAt, likes"}` |
| `400` | Invalid sort order | `{"error": "order must be asc or desc"}` |
| `400` | Invalid isPrivate query | `{"error": "isPrivate must be true or false"}` |
| `400` | Invalid hasPosts query | `{"error": "hasPosts must be true or false"}` |
| `400` | Invalid date query | `{"error": "from and to must be valid dates"}` |
| `404` | Non-existent user | `{"error": "User not found"}` |
| `404` | Non-existent post | `{"error": "Post not found"}` |
| `404` | Non-existent like | `{"error": "Like not found"}` |
| `409` | Duplicate user username or email | `{"error": "username or email already taken"}` |
| `409` | Duplicate post like | `{"error": "Already liked"}` |
