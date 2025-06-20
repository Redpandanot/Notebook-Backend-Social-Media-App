const express = require("express");
const followRouter = express.Router();
const userAuth = require("../middlewares/userAuth");
const Followers = require("../models/followers");
const { optimizedImg } = require("../utils/helperFunctions");

followRouter.get("/followers", userAuth, async (req, res) => {
  try {
    const user = req.user;
    const followers = await Followers.find({
      followee: user._id,
    })
      .populate({
        path: "followee",
        select: "firstName lastName",
      })
      .populate({
        path: "follower",
        select: "firstName lastName photo",
      })
      .lean();
    const imgOptimizedFriendsList = followers.map((item) => {
      if (
        !item.follower ||
        !item.follower.photo ||
        !item.follower.photo.public_id
      ) {
        console.log("images not optmizied as needed info was missing");
        return item;
      }

      console.log("begin optmizing images");

      const optimizedProfileImg = optimizedImg(
        item.follower.photo.public_id,
        50
      );

      console.log("Image optimized!");

      return {
        ...item,
        follower: {
          ...item.follower,
          photo: {
            ...item.follower.photo,
            url: optimizedProfileImg,
          },
        },
      };
    });

    res.send(imgOptimizedFriendsList);
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
        select: "firstName lastName",
      })
      .lean();
    const imgOptimizedFriendsList = following.map((item) => {
      if (
        !item.followee ||
        !item.followee.photo ||
        !item.followee.photo.public_id
      ) {
        console.log("images not optmizied as needed info was missing");
        return item;
      }

      console.log("begin optmizing images");

      const optimizedProfileImg = optimizedImg(
        item.followee.photo.public_id,
        50
      );

      console.log("Image optimized!");

      return {
        ...item,
        followee: {
          ...item.followee,
          photo: {
            ...item.followee.photo,
            url: optimizedProfileImg,
          },
        },
      };
    });

    res.send(imgOptimizedFriendsList);
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
        select: "firstName lastName",
      })
      .populate({
        path: "follower",
        select: "firstName lastName photo",
      })
      .lean();

    const imgOptimizedFriendsList = followers.map((item) => {
      if (
        !item.follower ||
        !item.follower.photo ||
        !item.follower.photo.public_id
      ) {
        console.log("images not optmizied as needed info was missing");
        return item;
      }

      console.log("begin optmizing images");

      const optimizedProfileImg = optimizedImg(
        item.follower.photo.public_id,
        50
      );

      console.log("Image optimized!");

      return {
        ...item,
        follower: {
          ...item.follower,
          photo: {
            ...item.follower.photo,
            url: optimizedProfileImg,
          },
        },
      };
    });

    res.send(imgOptimizedFriendsList);
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
        select: "firstName lastName",
      })
      .lean();
    const imgOptimizedFriendsList = following.map((item) => {
      if (
        !item.followee ||
        !item.followee.photo ||
        !item.followee.photo.public_id
      ) {
        console.log("images not optmizied as needed info was missing");
        return item;
      }

      console.log("begin optmizing images");

      const optimizedProfileImg = optimizedImg(
        item.followee.photo.public_id,
        50
      );

      console.log("Image optimized!");

      return {
        ...item,
        followee: {
          ...item.followee,
          photo: {
            ...item.followee.photo,
            url: optimizedProfileImg,
          },
        },
      };
    });

    res.send(imgOptimizedFriendsList);
  } catch (error) {
    console.log("something went wrong : ", error.message);
    res.send("Something went wrong : " + error.message);
  }
});

module.exports = followRouter;
