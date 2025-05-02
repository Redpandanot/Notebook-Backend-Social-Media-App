const express = require("express");
const userAuth = require("../middlewares/userAuth");
const postsRouter = express.Router();
const Posts = require("../models/posts");
const Groups = require("../models/groups");
const { validatePosts } = require("../utils/validation");

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

module.exports = postsRouter;
