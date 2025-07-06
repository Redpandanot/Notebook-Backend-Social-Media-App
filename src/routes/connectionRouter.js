const express = require("express");
const userAuth = require("../middlewares/userAuth");
const connectionRouter = express.Router();
const Connections = require("../models/connections");
const User = require("../models/user");
const Followers = require("../models/followers");
const { cloudinary } = require("../utils/cloudinaryConfig");
const { optimizedImg } = require("../utils/helperFunctions");

connectionRouter.post(
  "/friend-request/send/:status/:userId",
  userAuth,
  async (req, res) => {
    try {
      const fromUserId = req.user._id;
      const { userId: toUserId, status } = req.params;

      //validate the status

      if (!["requested"].includes(status)) {
        throw new Error("Status not valid");
      }
      //verify the both to and from users exist in db

      if (fromUserId.equals(toUserId)) {
        //cannot send request to your self
        throw new Error("Cannot send request to yourself");
      }

      const toUserExists = await User.findById(toUserId);

      if (!toUserExists) {
        throw new Error("ToUser does not exist");
      }

      const connectionExists = await Connections.find({
        $or: [
          {
            fromUserId,
            toUserId,
          },
          {
            fromUserId: toUserId,
            toUserId: fromUserId,
          },
        ],
      });

      if (connectionExists.length !== 0) {
        throw new Error("Request already exists");
      }

      const newRequest = new Connections({
        fromUserId,
        toUserId,
        status,
      });
      const connectionRequest = await newRequest.save();

      res.send(connectionRequest);
    } catch (error) {
      res.status(400).send(error.message);
    }
  }
);

connectionRouter.post(
  "/friend-requests/review/:status/:requestId",
  userAuth,
  async (req, res) => {
    try {
      const loggedInUserId = req.user._id;
      const { status, requestId } = req.params;

      // input validation
      if (!["accepted", "rejected"].includes(status)) {
        throw new Error("status is not valid");
      }

      //check if request exist
      const connectionRequest = await Connections.findOne({
        _id: requestId,
        toUserId: loggedInUserId,
        status: "requested",
      });

      if (!connectionRequest) {
        throw new Error("Request does not exist");
      }

      connectionRequest.status = status;

      const updatedRequest = await connectionRequest.save();

      res.send(updatedRequest);
    } catch (error) {
      res.status(400).send(error.message);
    }
  }
);

connectionRouter.post("/follow/:userId", userAuth, async (req, res) => {
  try {
    const followerId = req.user._id;
    const { userId: followeeId } = req.params;

    const followeeExists = await User.findById(followeeId);

    if (!followeeExists) {
      throw new Error("The user you are trying to follow does not exist");
    }

    const followRelation = await Followers.findOne({
      followee: followeeId,
      follower: followerId,
    });

    if (followRelation) {
      throw new Error("Already follows this user");
    }

    const data = new Followers({
      followee: followeeId,
      follower: followerId,
    });
    await data.save();
    res.send(data);
  } catch (error) {
    res.status(400).send(error.message);
  }
});

connectionRouter.post("/unfollow/:userId", userAuth, async (req, res) => {
  try {
    const followerId = req.user._id;
    const { userId: followeeId } = req.params;

    const followeeExists = await User.findById(followeeId);

    if (!followeeExists) {
      throw new Error("User you are trying to unfollow does not exist");
    }

    const data = await Followers.findOneAndDelete({
      followee: followeeId,
      follower: followerId,
    });
    if (!data) {
      throw new Error("this relationship does not exist");
    }
    res.send(data);
  } catch (error) {
    res.status(400).send(error.message);
  }
});

connectionRouter.get("/friend-requests/view", userAuth, async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    limit = limit > 10 ? 10 : limit;
    const skip = (page - 1) * limit;

    const connectionRequest = await Connections.find({
      $and: [
        {
          toUserId: loggedInUserId,
        },
        { status: { $ne: "accepted" } },
        { status: { $ne: "rejected" } },
      ],
    })
      .populate({
        path: "fromUserId",
        select: "firstName lastName photo",
      })
      .skip(skip)
      .limit(limit)
      .lean();

    const urlUpdatedConnectionRequest = connectionRequest.map((request) => {
      if (
        !request.fromUserId ||
        !request.fromUserId.photo ||
        !request.fromUserId.photo.public_id
      ) {
        return request;
      }
      const optimizedProfileImg = optimizedImg(
        request.fromUserId.photo.public_id,
        50
      );

      return {
        ...request,
        fromUserId: {
          ...request.fromUserId,
          photo: {
            ...request.fromUserId.photo,
            url: optimizedProfileImg,
          },
        },
      };
    });

    res.send(urlUpdatedConnectionRequest);
  } catch (error) {
    res.status(400).send(error.message);
  }
});

connectionRouter.get("/friends-list", userAuth, async (req, res) => {
  try {
    const user = req.user._id;
    const page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
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
    })
      .populate({
        path: "fromUserId",
        select: "firstName lastName photo",
      })
      .populate({
        path: "toUserId",
        select: "firstName lastName photo",
      })
      .skip(skip)
      .limit(limit)
      .lean();

    const organisedFriendsList = friends.map((connection) => {
      const friend = connection.fromUserId._id.equals(user)
        ? connection.toUserId
        : connection.fromUserId;
      return {
        _id: friend._id,
        firstName: friend.firstName,
        lastName: friend.lastName,
        photo: friend.photo,
      };
    });

    const imgOptimizedFriendsList = organisedFriendsList.map((item) => {
      if (!item.photo || !item.photo.public_id) return item;
      const optimizedProfileImg = optimizedImg(item.photo.public_id, 50);
      return {
        ...item,
        photo: {
          ...item.photo,
          url: optimizedProfileImg,
        },
      };
    });

    res.send(imgOptimizedFriendsList);
  } catch (error) {
    res.json({
      status: 400,
      message: error.message,
    });
  }
});

connectionRouter.get("/new-friends", userAuth, async (req, res) => {
  try {
    const user = req.user._id;
    const page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 2;
    limit = limit > 10 ? 10 : limit;
    const skip = (page - 1) * limit;

    const existingConnections = await Connections.find({
      $or: [
        {
          fromUserId: user,
        },
        {
          toUserId: user,
        },
      ],
    })
      .select("fromUserId toUserId")
      .lean();

    const hideExisitingRequests = new Set();
    existingConnections.forEach((connection) => {
      hideExisitingRequests.add(connection.fromUserId.toString());
      hideExisitingRequests.add(connection.toUserId.toString());
    });

    const users = await User.find({
      $and: [
        {
          _id: { $nin: Array.from(hideExisitingRequests) },
        },
        { _id: { $ne: user } },
      ],
    })
      .select("firstName lastName emailId photo")
      .skip(skip)
      .limit(limit)
      .lean();

    const urlUpdatedConnectionRequest = users.map((request) => {
      if (!request.photo || !request.photo.public_id) return request;
      const optimizedProfileImg = optimizedImg(request.photo.public_id, 50);
      return {
        ...request,
        photo: {
          ...request.photo,
          url: optimizedProfileImg,
        },
      };
    });
    res.send(urlUpdatedConnectionRequest);
  } catch (error) {
    res.send(error.message);
  }
});

connectionRouter.post("/unFriend/:friendId", userAuth, async (req, res) => {
  try {
    const user = req.user;
    const { friendId } = req.params;
    const doesConnectionExist = await Connections.findOne({
      $or: [
        {
          fromUserId: user._id,
          toUserId: friendId,
        },
        {
          fromUserId: friendId,
          toUserId: user._id,
        },
      ],
    }).lean();

    if (!doesConnectionExist || doesConnectionExist.status !== "accepted") {
      console.log("Not a friend , connection : ", doesConnectionExist);

      throw new Error("Not a friend");
    }

    const removeFriend = await Connections.findByIdAndDelete({
      _id: doesConnectionExist._id,
    });

    console.log("Connection removed");
    res.send("Connection removed" + removeFriend);
  } catch (error) {
    console.log("Connection could not be removed");
    res.send("Connection could not be removed " + error.message);
  }
});

module.exports = connectionRouter;
