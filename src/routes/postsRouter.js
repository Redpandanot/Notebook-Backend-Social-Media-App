const express = require("express");
const userAuth = require("../middlewares/userAuth");
const postsRouter = express.Router();
const Posts = require("../models/posts");
const Groups = require("../models/groups");
const Likes = require("../models/likes");
const { validatePosts } = require("../utils/validation");
const { findOneAndDelete } = require("../models/user");
const Connections = require("../models/connections");
const Comments = require("../models/comments");

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
      const unlikePost = await Posts.findByIdAndUpdate(
        postId,
        { $inc: { likeCount: -1 } },
        { new: true }
      );
      res.json({
        status: 200,
        message: "Post unliked",
        likeCount: unlikePost.likeCount,
      });
    } else {
      const like = new Likes({
        userId: userId,
        postId: postId,
      });
      await like.save();
      const likePost = await Posts.findByIdAndUpdate(
        postId,
        { $inc: { likeCount: 1 } },
        { new: true }
      );
      res.json({
        status: 200,
        message: "post liked successfully",
        likeCount: likePost.likeCount,
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

postsRouter.get("/posts/feed", userAuth, async (req, res) => {
  //get self posts
  //get posts from friends
  //  get list of friends
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
        select: "firstName lastName",
      });

    res.send(posts);
  } catch (error) {
    res.send(error.message);
  }
});

postsRouter.post("/posts/comment/:postId", userAuth, async (req, res) => {
  try {
    const user = req.user._id;
    const { postId } = req.params;
    const comment = req.body.comment;
    const parentId = req.body.parentId;
    const addTODb = new Comments({
      postId,
      userId: user,
      comment,
      likeCount: 0,
      replyCount: 0,
      parentCommentId: parentId,
    });
    addTODb.save();
    //upadte comment count
    const updateCommentCount = await Posts.findByIdAndUpdate(postId, {
      $inc: { commentCount: 1 },
    });
    res.send(addTODb);
  } catch (error) {
    res.send(error.message);
  }
});
module.exports = postsRouter;
