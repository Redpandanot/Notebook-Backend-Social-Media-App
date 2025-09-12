const { createPost, optimizeImages } = require("../utils/helperFunctions");
const Posts = require("../models/posts");
const Groups = require("../models/groups");
const Likes = require("../models/likes");
const { validatePosts } = require("../utils/validation");
const mongoose = require("mongoose");
const { findOneAndDelete } = require("../models/user");
const Comments = require("../models/comments");
const Connections = require("../models/connections");

const CreatePostController = async (req, res) => {
  try {
    const user = req.user;
    const { title, description } = req.body;
    if (!validatePosts(req)) {
      return res.status(400).json({ error: "Content is not valid" });
    }

    const post = await createPost(user._id, req, title, description);

    const photoUrls = (post.photos || []).map((photo) => photo.url);

    res.json({
      userId: post.userId,
      title: post.title,
      description: post.description,
      photos: photoUrls,
      likeCount: post.likeCount,
      commentCount: post.commentCount,
    });
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ error: "Failed to create post" });
  }
};

const CreateGroupContoller = async (req, res) => {
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
};

const LikeController = async (req, res) => {
  try {
    const userId = req.user._id;
    const { postId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ message: "Invalid postId" });
    }
    const post = await Posts.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    const existingLike = await Likes.findOneAndDelete({
      userId: userId,
      postId: postId,
    });

    if (existingLike) {
      const unlikePost = await Posts.findByIdAndUpdate(
        postId,
        { $inc: { likeCount: -1 } },
        { new: true }
      );
      return res.status(200).json({
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
      return res.status(200).json({
        message: "post liked successfully",
        likeCount: likePost.likeCount,
      });
    }
  } catch (error) {
    console.error("LikeController error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

const ViewPostsController = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId || typeof userId !== "string") {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    limit = limit > 10 ? 10 : limit;
    const skip = (page - 1) * limit;

    const posts = await Posts.find({ userId: userId })
      .skip(skip)
      .limit(limit)
      .populate({
        path: "userId",
        select: "firstName lastName photo",
      })
      .sort({ createdAt: -1 })
      .lean();
    const optimizedPosts = optimizeImages(posts);
    res.status(200).json({
      page,
      limit,
      total: optimizedPosts.length,
      posts: optimizedPosts,
    });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};

const FeedController = async (req, res) => {
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

    res.status(200).json(optimizedPosts);
  } catch (error) {
    console.error("Error creating feed:", error.message);
    res.status(500).json({ error: "Failed to load feed" });
  }
};

const ViewDiscussionPostController = async (req, res) => {
  try {
    const { postId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ message: "Invalid postId" });
    }

    const post = await Posts.findById({ _id: postId })
      .populate({
        path: "userId",
        select: "firstName lastName photo",
      })
      .lean();

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    res.status(200).json(post);
  } catch (error) {
    console.error("Error fetching post:", error.message);
    res.status(500).json({ error: "Failed to fetch post" });
  }
};

const AddCommentController = async (req, res) => {
  try {
    const user = req.user._id;
    const { postId } = req.params;
    const comment = req.body.comment;
    const parentId = req.body.parentId;

    if (postId && !mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ message: "Invalid postId" });
    }

    if (parentId && !mongoose.Types.ObjectId.isValid(parentId)) {
      return res.status(400).json({ message: "Invalid parentId" });
    }

    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({ message: "Comment cannot be empty" });
    }

    const post = await Posts.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post does not exist" });
    }

    const newComment = new Comments({
      postId,
      userId: user,
      comment,
      likeCount: 0,
      replyCount: 0,
      parentCommentId: parentId || null,
    });
    await newComment.save();
    //update comment count
    await Posts.findByIdAndUpdate(postId, {
      $inc: { commentCount: 1 },
    });
    res.status(200).json({
      message: "Comment added successfully",
      comment: newComment,
    });
  } catch (error) {
    console.error("Error adding comment:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  CreatePostController,
  CreateGroupContoller,
  LikeController,
  ViewPostsController,
  FeedController,
  ViewDiscussionPostController,
  AddCommentController,
};
