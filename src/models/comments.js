const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Posts",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    comment: {
      type: String,
      required: true,
      minLength: 3,
      maxLength: 500,
    },
    likeCount: {
      type: Number,
      required: true,
    },
    replyCount: {
      type: Number,
      required: true,
    },
    parentCommentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comments",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

commentSchema.index({ postId: 1, userId: 1 });

const commentModel = mongoose.model("Comments", commentSchema);

module.exports = commentModel;
