const Comments = require("../models/comments");
const { recursiveNestedComment } = require("../utils/helperFunctions");

const PostDiscussionController = async (req, res) => {
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
      .populate("replies")
      .populate(recursiveNestedComment(10))
      .lean()
      .sort({ createdAt: 1 });

    res.json(parentComments);
  } catch (error) {
    console.error(
      `Error fetching comments for postId : ${postId} : ${error.message}`
    );
    res.status(500).json({ message: "Failed to fetch Comments" });
  }
};

module.exports = { PostDiscussionController };
