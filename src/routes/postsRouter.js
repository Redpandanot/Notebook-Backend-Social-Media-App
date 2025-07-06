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
const { upload } = require("../utils/cloudinaryConfig");
const fs = require("fs/promises");
const { createPost, optimizeImages } = require("../utils/helperFunctions");

postsRouter.post(
  "/post/create",
  userAuth,
  upload.array("files", 5),
  async (req, res) => {
    try {
      const user = req.user;
      const { title, description } = req.body;
      if (!validatePosts(req)) {
        throw new Error("Content is not valid");
      }

      const post = await createPost(user._id, req, title, description);

      const photoUrls = post.photos.map((photoObject) => {
        return photoObject.url;
      });
      res.json({
        userId: post.userId,
        title: post.title,
        description: post.description,
        photos: photoUrls,
        likeCount: post.likeCount,
        commentCount: post.commentCount,
      });
    } catch (error) {
      console.error("Error creating post:", error.message);
      res.status(400).send(error.message);
    }
  }
);

postsRouter.post("/posts/group/create/:groupId", userAuth, async (req, res) => {
  try {
    const user = req.user._id;
    const { groupId } = req.params;

    const { title, description } = req.body;
    if (!validatePosts(req)) {
      throw new Error("Content is not valid");
    }

    const groupExists = await Groups.findById(groupId);

    if (!groupExists) {
      throw new Error("Group does not exist");
    }

    const post = new Posts({
      userId: user,
      title,
      description,
      groupId: groupId,
      likeCount: 0,
      commentCount: 0,
    });

    await post.save();
    res.send(post);
  } catch (error) {
    res.status(400).send(error.message);
  }
});

//this api is probably not being used
postsRouter.get("/posts/view", userAuth, async (req, res) => {
  try {
    const user = req.user._id;
    const page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    limit = limit > 10 ? 10 : limit;
    const skip = (page - 1) * limit;

    const posts = await Posts.find({ userId: user })
      .populate({
        path: "userId",
        select: "firstName lastName photo",
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const optimizedPosts = optimizeImages(posts);

    res.send(optimizedPosts);
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
    const page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    limit = limit > 10 ? 10 : limit;
    const skip = (page - 1) * limit;

    const posts = await Posts.find({ userId: userId })
      .populate({
        path: "userId",
        select: "firstName lastName photo",
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    const optimizedPosts = optimizeImages(posts);
    res.send(optimizedPosts);
  } catch (error) {
    res.status(400).send(error.message);
  }
});

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

postsRouter.post("/posts/comment/:postId", userAuth, async (req, res) => {
  try {
    const user = req.user._id;
    const { postId } = req.params;
    const comment = req.body.comment;
    const parentId = req.body.parentId;

    const getPost = await Posts.findById({ _id: postId });

    if (!getPost) {
      res.send("Post does not exist");
      return;
    }

    const addTODb = new Comments({
      postId,
      userId: user,
      comment,
      likeCount: 0,
      replyCount: 0,
      parentCommentId: parentId,
    });
    addTODb.save();
    //update comment count
    await Posts.findByIdAndUpdate(postId, {
      $inc: { commentCount: 1 },
    });
    res.send(addTODb);
  } catch (error) {
    res.send(error.message);
  }
});

postsRouter.get("/post/view/:postId", userAuth, async (req, res) => {
  try {
    const { postId } = req.params;
    const getPost = await Posts.findById({ _id: postId })
      .populate({
        path: "userId",
        select: "firstName lastName photo",
      })
      .lean();
    res.send(getPost);
  } catch (error) {
    console.log("error fetching posts", error.message);
    res.send(error.message);
  }
});

module.exports = postsRouter;
