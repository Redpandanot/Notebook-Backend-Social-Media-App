# Notebook Backend

A Node.js/Express backend for **Notebook**—a social media platform blending features from LinkedIn and Reddit.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
4. [Getting Started](#getting-started)
   - [Prerequisites](#prerequisites)
   - [Installation](#installation)
   - [Environment Variables](#environment-variables)
   - [Running the App](#running-the-app)
5. [API Documentation](#api-documentation)
6. [Contributing](#contributing)
7. [License](#license)
8. [Contact](#contact)

## Project Overview

Notebook Backend powers a social network where users can:

- Register/login with encrypted passwords and JWTs
- Build connections (friends/followers)
- Post, comment, and discuss in public feeds or groups
- Upload images via Cloudinary
- Manage profiles and security settings

Essentially, it’s a mash‑up of LinkedIn’s networking and Reddit’s discussion model.

## Features

From the project plan in **app.md**:

- **User Authentication**
  - Signup with first name, last name, email, password, age, DOB, college, skills
  - Input validation & password hashing
  - JWT generation & cookie storage
- **User Login**
  - Email/password check
  - JWT issuance
- **Profile Management**
  - View/Edit profile
  - Change password
- **Connections**
  - Send/review friend‑requests
  - Follow/unfollow users
  - View friends, followers, suggestions
- **Discussions & Posts**
  - Create/read/update/delete posts
  - Group posts & feeds
  - Like, comment, nested discussions
- **Groups**
  - Create/join groups
  - Moderator assignments
- **Media Uploads**
  - Image uploads via Multer + Cloudinary

and more – see full API list in apiList.md file.

## Tech Stack

- **Runtime & Framework**: Node.js, Express.js
- **Database**: MongoDB (via Mongoose)
- **Authentication**: JWT (jsonwebtoken), bcrypt
- **File Uploads**: Multer + Cloudinary
- **Utilities**: dotenv, cors, cookie-parser, validator

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v16+
- [MongoDB](https://www.mongodb.com/) (cloud or local)
- (Optional) [Cloudinary](https://cloudinary.com/) account for image storage

### Installation

1. **Clone the repo**
   ```bash
   git clone https://github.com/Redpandanot/Notebook-Backend-Social-Media-App.git
   cd Notebook-Backend-Social-Media-App
   ```
2. Install dependencies

```bash
   npm install
```

Environment Variables
Create a .env file in the project root with:

```bash
PORT=5000
MONGODB_URI=<your_mongo_connection_string>
JWT_SECRET=<your_jwt_secret>
CLOUDINARY_CLOUD_NAME=<cloudinary_cloud_name>
CLOUDINARY_API_KEY=<cloudinary_api_key>
CLOUDINARY_API_SECRET=<cloudinary_api_secret>
COOKIE_SECRET=<your_cookie_parser_secret>
```

Running the App
Development (with hot‑reload):

```bash
npm run dev
```

```bash
npm start
```

Server will listen on http://localhost:${PORT}.

API Documentation
Check apiList.md file
