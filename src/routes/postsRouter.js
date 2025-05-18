const express = require("express");
const userAuth = require("../middlewares/userAuth");
const postsRouter = express.Router();
const Posts = require("../models/posts");
const Groups = require("../models/groups");
const Likes = require("../models/likes");
const { validatePosts } = require("../utils/validation");
const { findOneAndDelete } = require("../models/user");

postsRouter.post("/posts/create", userAuth, async (req, res) => {
  try {
    const user = req.user._id;
    const { title, description } = req.body;

    if (!validatePosts(req)) {
      throw new Error("Content is not valid");
    }

    const post = new Posts({
      userId: user,
      title,
      description,
      likeCount: 0,
      commentCount: 0,
    });
    await post.save();
    res.send(post);
  } catch (error) {
    res.status(400).send(error.message);
  }
});

postsRouter.post("/posts/group/create/:groupId", userAuth, async (req, res) => {
  try {
    const user = req.user._id;
    const { group } = req.params;

    const { title, description } = req.body;
    if (!validatePosts(req)) {
      throw new Error("Content is not valid");
    }

    const groupExists = await Groups.findById(group);

    if (!groupExists) {
      throw new Error("Group does not exist");
    }

    const post = new Posts({
      userId: user,
      title,
      description,
      groupId: group,
      likeCount: 0,
      commentCount: 0,
    });

    await post.save();
    res.send(post);
  } catch (error) {
    res.status(400).send(error.message);
  }
});

postsRouter.get("/posts/view", userAuth, async (req, res) => {
  try {
    const user = req.user._id;

    const post = await Posts.find({ userId: user }).populate({
      path: "userId",
      select: "firstName",
    });
    res.send(post);
  } catch (error) {
    res.status(400).send(error.message);
  }
});

postsRouter.post("/posts/like/:postId", userAuth, async (req, res) => {
  try {
    const userId = req.user._id;
    const { postId } = req.params;
    if (typeof postId !== "string") {
      res.json({
        status: 400,
        message: "Invalid postId",
      });
    }
    const post = await Posts.findById(postId);
    if (!post) {
      res.json({
        status: 400,
        message: "Post is not present",
      });
    }
    const doesLikeExist = await Likes.findOneAndDelete({
      userId: userId,
      postId: postId,
    });

    if (doesLikeExist) {
      await Posts.findByIdAndUpdate(postId, { $inc: { likeCount: -1 } });
      res.json({
        status: 200,
        message: "Post unliked",
      });
    } else {
      const like = new Likes({
        userId: userId,
        postId: postId,
      });
      await like.save();
      await Posts.findByIdAndUpdate(postId, { $inc: { likeCount: 1 } });
      res.json({
        status: 200,
        message: "post liked successfully",
      });
    }
  } catch (error) {
    res.json({
      status: 500,
      message: "Something went wrong",
    });
  }
});

postsRouter.get("/posts/view/:userId", userAuth, async (req, res) => {
  try {
    const { userId } = req.params;

    const post = await Posts.find({ userId: userId }).populate({
      path: "userId",
      select: "firstName",
    });
    res.send(post);
  } catch (error) {
    res.status(400).send(error.message);
  }
});

module.exports = postsRouter;
