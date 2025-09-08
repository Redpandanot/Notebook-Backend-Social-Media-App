const express = require("express");
const userAuth = require("../middlewares/userAuth");
const postsRouter = express.Router();
const Posts = require("../models/posts");
const Connections = require("../models/connections");
const { upload } = require("../utils/cloudinaryConfig");
const fs = require("fs/promises");
const { optimizeImages } = require("../utils/helperFunctions");
const {
  CreatePostController,
  CreateGroupContoller,
  LikeController,
  ViewPostsController,
  ViewDiscussionPostController,
  AddCommentController,
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

postsRouter.get("/posts/feed", userAuth, async (req, res) => {
  try {
    const user = req.user._id;
    const page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 2;
    limit = limit > 10 ? 10 : limit;
    const skip = (page - 1) * limit;

    const friends = await Connections.find({
      $or: [
        {
          fromUserId: user,
          status: "accepted",
        },
        {
          toUserId: user,
          status: "accepted",
        },
      ],
    });
    const organisedFriendsList = friends.map((connection) => {
      const friend = connection.fromUserId._id.equals(user)
        ? connection.toUserId
        : connection.fromUserId;
      return friend._id;
    });

    const userIdsToFetch = [user, ...organisedFriendsList];

    const posts = await Posts.find({
      userId: { $in: userIdsToFetch },
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: "userId",
        select: "firstName lastName photo",
      })
      .lean();

    const optimizedPosts = optimizeImages(posts);

    res.send(optimizedPosts);
  } catch (error) {
    console.log("Error creating feed", error);

    res.send(error.message);
  }
});

postsRouter.post("/posts/comment/:postId", userAuth, AddCommentController);

postsRouter.get("/post/view/:postId", userAuth, ViewDiscussionPostController);

module.exports = postsRouter;
