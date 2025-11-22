# 🧾 API List

This document contains all API routes grouped by module, including HTTP method, URL, authentication requirement, and a short description.

---

## 🔐 Auth Routes (`/auth`)

| Method | Route     | Auth | Description                   |
| ------ | --------- | ---- | ----------------------------- |
| POST   | `/signup` | ❌   | Register a new user           |
| POST   | `/login`  | ❌   | Log in and receive auth token |
| GET    | `/logout` | ✔️   | Log out current user          |

---

## 💬 Chat Routes (`/chat`)

| Method | Route    | Auth | Description                          |
| ------ | -------- | ---- | ------------------------------------ |
| GET    | `/chats` | ✔️   | Get all chats for the logged-in user |

---

## 🤝 Connection / Friends Routes (`/connections`)

### Friend Requests

| Method | Route                                 | Auth | Description                                              |
| ------ | ------------------------------------- | ---- | -------------------------------------------------------- |
| POST   | `/friend-request/:status/:userId`     | ✔️   | Send a friend request (`status` = pending, cancel, etc.) |
| POST   | `/friend-requests/:status/:requestId` | ✔️   | Accept or reject a friend request                        |
| GET    | `/friend-requests/view`               | ✔️   | View all incoming friend requests                        |

### Friends List & Suggestions

| Method | Route                 | Auth | Description                   |
| ------ | --------------------- | ---- | ----------------------------- |
| GET    | `/friends-list`       | ✔️   | Get friends list              |
| GET    | `/friend-suggestions` | ✔️   | Suggest potential new friends |
| POST   | `/unfriend/:friendId` | ✔️   | Remove / unfriend a user      |

### Follow System

| Method | Route             | Auth                | Description   |
| ------ | ----------------- | ------------------- | ------------- | ----------------------------------------- | --- |
| POST   | `/follow/:userId` | ✔️                  | Follow a user |
| <!--   | POST              | `/unfollow/:userId` | ✔️            | Unfollow a user (currently commented out) | --> |

---

## 🧵 Discussion Routes (`/discussion`)

| Method | Route                 | Auth | Description                             |
| ------ | --------------------- | ---- | --------------------------------------- |
| GET    | `/discussion/:postId` | ✔️   | Get nested comments for a specific post |

---

## 👥 Followers / Following Routes (`/follow`)

| Method | Route                | Auth | Description                         |
| ------ | -------------------- | ---- | ----------------------------------- |
| GET    | `/followers`         | ✔️   | Get logged-in user's followers      |
| GET    | `/following`         | ✔️   | Get logged-in user's following list |
| GET    | `/followers/:userId` | ✔️   | Get follower list of another user   |
| GET    | `/following/:userId` | ✔️   | Get following list of another user  |

---

## 📝 Posts Routes (`/posts`)

### Post Creation & Interactions

| Method | Route                          | Auth | Description                              |
| ------ | ------------------------------ | ---- | ---------------------------------------- |
| POST   | `/post/create`                 | ✔️   | Create a new post (supports file upload) |
| POST   | `/posts/group/create/:groupId` | ✔️   | Create a post inside a group             |
| POST   | `/posts/like/:postId`          | ✔️   | Like / unlike a post                     |
| POST   | `/posts/comment/:postId`       | ✔️   | Add a comment to a post                  |

### Post Retrieval

| Method | Route            | Auth | Description                   |
| ------ | ---------------- | ---- | ----------------------------- |
| GET    | `/posts/:userId` | ✔️   | View posts by a specific user |
| GET    | `/posts/feed`    | ✔️   | Get feed posts                |
| GET    | `/post/:postId`  | ✔️   | View single post + discussion |

---

## 👤 Profile Routes (`/profile`)

| Method | Route                    | Auth | Description                  |
| ------ | ------------------------ | ---- | ---------------------------- |
| GET    | `/profile`               | ✔️   | Get logged-in user's profile |
| GET    | `/profile/:profileId`    | ✔️   | View another user's profile  |
| POST   | `/profile/edit`          | ✔️   | Edit user profile            |
| POST   | `/profile/edit/password` | ✔️   | Change password              |
| POST   | `/profile/image`         | ✔️   | Upload profile photo         |

---

## 🔍 Search Routes (`/search`)

| Method | Route                | Auth | Description                                           |
| ------ | -------------------- | ---- | ----------------------------------------------------- |
| GET    | `/search?query=`     | ✔️   | Search users (light search)                           |
| GET    | `/search/all?query=` | ✔️   | Search users + posts + comments                       |
| GET    | `search/friends`     | ✔️   | Search friends in chat section (empty implementation) |

---

## 🛠 Helper Functions Used

- `escapeRegex(str)` – Escapes special characters for regex search
- `populateReplies(postId, parentCommentId)` – Recursively fetch nested replies

---
