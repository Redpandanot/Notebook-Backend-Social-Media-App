const express = require("express");
const userAuth = require("../middlewares/userAuth");
const postsRouter = express.Router();
const { upload } = require("../utils/cloudinaryConfig");
const {
  CreatePostController,
  CreateGroupContoller,
  LikeController,
  ViewPostsController,
  ViewDiscussionPostController,
  AddCommentController,
  FeedController,
} = require("../controller/PostsController");

postsRouter.post(
  "/post/create",
  userAuth,
  upload.array("files", 5),
  CreatePostController
);

postsRouter.post(
  "/posts/group/create/:groupId",
  userAuth,
  CreateGroupContoller
);

postsRouter.post("/posts/like/:postId", userAuth, LikeController);

postsRouter.get("/posts/view/:userId", userAuth, ViewPostsController);

postsRouter.get("/posts/feed", userAuth, FeedController);

postsRouter.post("/posts/comment/:postId", userAuth, AddCommentController);

postsRouter.get("/post/view/:postId", userAuth, ViewDiscussionPostController);

module.exports = postsRouter;
