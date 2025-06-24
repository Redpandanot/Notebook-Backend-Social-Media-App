const express = require("express");
const searchRouter = express.Router();
const userAuth = require("../middlewares/userAuth");
const User = require("../models/user");
const Posts = require("../models/posts");
const Comments = require("../models/comments");
const { userSafeData } = require("../utils/constants");

searchRouter.get("/search", userAuth, async (req, res) => {
  try {
    const user = req.user._id;
    const searchQuery = req.query.query;
    if (!searchQuery || typeof searchQuery !== "string") {
      return res.status(400).send({ error: "Invalid or empty search query." });
    }
    const searchRegex = new RegExp(escapeRegex(searchQuery), "i");
    const userList = await User.find({
      $and: [
        {
          $or: [
            { firstName: searchRegex },
            { lastName: searchRegex },
            { college: searchRegex },
            { skills: searchRegex },
          ],
        },
        {
          _id: { $ne: user },
        },
      ],
    }).select(userSafeData);

    res.send(userList);
  } catch (error) {}
});

searchRouter.get("/search/list", userAuth, async (req, res) => {
  try {
    const user = req.user._id;
    const searchQuery = req.query.query;
    if (!searchQuery || typeof searchQuery !== "string") {
      return res.status(400).send({ error: "Invalid or empty search query." });
    }
    const searchRegex = new RegExp(escapeRegex(searchQuery), "i");
    const userList = await User.find({
      $and: [
        {
          $or: [
            { firstName: searchRegex },
            { lastName: searchRegex },
            { college: searchRegex },
            { skills: searchRegex },
          ],
        },
        {
          _id: { $ne: user },
        },
      ],
    })
      .select(userSafeData)
      .lean();

    const postList = await Posts.find({
      $or: [{ title: searchRegex }, { description: searchRegex }],
    })
      .populate({
        path: "userId",
        select: "firstName lastName photo",
      })
      .lean();

    const commentList = await Comments.find({
      comment: searchRegex,
    })
      .populate({
        path: "userId",
        select: "firstName lastName photo",
      })
      .lean();

    res.json({
      userList,
      postList,
      commentList,
    });
  } catch (error) {}
});

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

module.exports = searchRouter;
