const express = require("express");
const followRouter = express.Router();
const userAuth = require("../middlewares/userAuth");
const Followers = require("../models/followers");

followRouter.get("/followers", userAuth, async (req, res) => {
  try {
    const user = req.user;
    const followers = await Followers.find({
      followee: user._id,
    })
      .populate({
        path: "followee",
        select: "firstName lastName photo",
      })
      .populate({
        path: "follower",
        select: "firstName lastName photo",
      })
      .lean();
    res.send(followers);
  } catch (error) {
    console.log("something went wrong : ", error.message);
    res.send("Something went wrong : " + error.message);
  }
});

followRouter.get("/following", userAuth, async (req, res) => {
  try {
    const user = req.user;
    const following = await Followers.find({
      follower: user._id,
    })
      .populate({
        path: "followee",
        select: "firstName lastName photo",
      })
      .populate({
        path: "follower",
        select: "firstName lastName photo",
      })
      .lean();
    res.send(following);
  } catch (error) {
    console.log("something went wrong : ", error.message);
    res.send("Something went wrong : " + error.message);
  }
});

followRouter.get("/followers/:userId", userAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const followers = await Followers.find({
      followee: userId,
    })
      .populate({
        path: "followee",
        select: "firstName lastName photo",
      })
      .populate({
        path: "follower",
        select: "firstName lastName photo",
      })
      .lean();
    res.send(followers);
  } catch (error) {
    console.log("something went wrong : ", error.message);
    res.send("Something went wrong : " + error.message);
  }
});

followRouter.get("/following/:userId", userAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const following = await Followers.find({
      follower: userId,
    })
      .populate({
        path: "followee",
        select: "firstName lastName photo",
      })
      .populate({
        path: "follower",
        select: "firstName lastName photo",
      })
      .lean();
    res.send(following);
  } catch (error) {
    console.log("something went wrong : ", error.message);
    res.send("Something went wrong : " + error.message);
  }
});

module.exports = followRouter;
