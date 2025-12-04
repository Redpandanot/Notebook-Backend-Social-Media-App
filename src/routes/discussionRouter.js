const express = require("express");
const discussionRouter = express.Router();
const userAuth = require("../middlewares/userAuth");

const {
  PostDiscussionController,
} = require("../controller/DiscussionController");

discussionRouter.get("/discussion/:postId", userAuth, PostDiscussionController);

module.exports = discussionRouter;
