const express = require("express");
const discussionRouter = express.Router();
const userAuth = require("../middlewares/userAuth");
const Comments = require("../models/comments");
const { populateReplies } = require("../utils/helperFunctions");

discussionRouter.get("/discussion/:postId", userAuth, async (req, res) => {
  try {
    const { postId } = req.params;

    const parentComments = await Comments.find({
      postId: postId,
      parentCommentId: null,
    })
      .populate({
        path: "userId",
        select: "firstName lastName photo",
      })
      .lean()
      .sort({ createdAt: 1 });

    const nestedComments = await Promise.all(
      parentComments.map(async (parentComment) => {
        parentComment.replies = await populateReplies(
          postId,
          parentComment._id
        );
        return parentComment;
      })
    );
    res.json(nestedComments);
  } catch (error) {
    console.log(error.message);
    res.send(error.message);
  }
});

module.exports = discussionRouter;
