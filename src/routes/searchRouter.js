const express = require("express");
const searchRouter = express.Router();
const userAuth = require("../middlewares/userAuth");
const User = require("../models/user");
const Posts = require("../models/posts");
const Comments = require("../models/comments");
const Connections = require("../models/connections");
const { userSafeData } = require("../utils/constants");

searchRouter.get("/search", userAuth, async (req, res) => {
  try {
    const user = req.user._id;
    const searchQuery = req.query.query;
    if (
      !searchQuery ||
      typeof searchQuery !== "string" ||
      searchQuery.length === 0 ||
      searchQuery.length > 20
    ) {
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
      .limit(10)
      .lean();

    res.send(userList);
  } catch (error) {}
});

searchRouter.get("/search/all", userAuth, async (req, res) => {
  try {
    const user = req.user._id;
    const searchQuery = req.query.query;
    if (!searchQuery || typeof searchQuery !== "string") {
      return res.status(400).send({ error: "Invalid or empty search query." });
    }
    const searchRegex = new RegExp(escapeRegex(searchQuery), "i");
    const users = User.find({
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

    const posts = Posts.find({
      $or: [{ title: searchRegex }, { description: searchRegex }],
    })
      .populate({
        path: "userId",
        select: "firstName lastName photo",
      })
      .lean();

    const comments = Comments.find({
      comment: searchRegex,
    })
      .populate({
        path: "userId",
        select: "firstName lastName photo",
      })
      .lean();

    const [userList, postList, commentList] = await Promise.all([
      users,
      posts,
      comments,
    ]);

    res.json({
      userList,
      postList,
      commentList,
    });
  } catch (error) {}
});

searchRouter.get("/search/friends", userAuth, async (req, res) => {
  const user = req.user._id;
  const searchQuery = req.query.query;
  if (!searchQuery || typeof searchQuery !== "string") {
    return res.status(400).send({ error: "Invalid or empty search query." });
  }
  const searchRegex = new RegExp(escapeRegex(searchQuery), "i");

  const friends = await Connections.aggregate([
    {
      $match: {
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
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "fromUserId",
        foreignField: "_id",
        as: "fromUserId",
        pipeline: [
          {
            $project: {
              password: 0,
              passwordChangedAt: 0,
            },
          },
        ],
      },
    },
    {
      $unwind: "$fromUserId",
    },
    {
      $lookup: {
        from: "users",
        localField: "toUserId",
        foreignField: "_id",
        as: "toUserId",
        pipeline: [
          {
            $project: {
              password: 0,
              passwordChangedAt: 0,
            },
          },
        ],
      },
    },
    {
      $unwind: "$toUserId",
    },
  ]);

  res.send(friends);
}); //to search friends in chat section

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

module.exports = searchRouter;
