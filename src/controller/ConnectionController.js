const Connections = require("../models/connections");
const User = require("../models/user");
const Followers = require("../models/followers");
const { optimizedImg } = require("../utils/helperFunctions");

const SendFriendRequestController = async (req, res) => {
  try {
    const fromUserId = req.user._id;
    const { userId: toUserId, status } = req.params;

    //validate the status

    if (!["requested"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    //verify the both to and from users exist in db

    if (!mongoose.Types.ObjectId.isValid(toUserId)) {
      return res.status(400).json({ message: "Invalid requestId" });
    }

    if (fromUserId.equals(toUserId)) {
      //cannot send request to your self
      return res
        .status(400)
        .json({ message: "Cannot send request to yourself" });
    }

    const toUserExists = await User.findById(toUserId);

    if (!toUserExists) {
      return res.status(404).json({ message: "User does not exist" });
    }

    const connectionExists = await Connections.findOne({
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

    if (connectionExists) {
      return res
        .status(400)
        .json({ message: "Connection request already exists" });
    }

    const newRequest = new Connections({
      fromUserId,
      toUserId,
      status,
    });
    const connectionRequest = await newRequest.save();

    res.status(201).json({
      message: "Friend request sent successfully",
      data: connectionRequest,
    });
  } catch (error) {
    console.error("Error sending friend request:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

const AcceptFriendRequestController = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const { status, requestId } = req.params;

    // input validation
    if (!["accepted", "rejected"].includes(status)) {
      throw new Error("status is not valid");
    }

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ message: "Invalid requestId" });
    }

    //check if request exist
    const connectionRequest = await Connections.findOne({
      _id: requestId,
      toUserId: loggedInUserId,
      status: "requested",
    });

    if (!connectionRequest) {
      return res
        .status(404)
        .json({ message: "Request does not exist or is already reviewed" });
    }

    connectionRequest.status = status;

    const updatedRequest = await connectionRequest.save();

    res.status(200).json(updatedRequest);
  } catch (error) {
    console.error("Error reviewing friend request:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

const FollowController = async (req, res) => {
  try {
    const followerId = req.user._id;
    const { userId: followeeId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(followeeId)) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    if (followerId.equals(followeeId)) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    const followeeExists = await User.findById(followeeId);

    if (!followeeExists) {
      return res.status(404).json({ message: "User not found" });
    }

    const followRelation = await Followers.findOne({
      followee: followeeId,
      follower: followerId,
    });

    if (followRelation) {
      return res.status(400).json({ message: "Already following this user" });
    }

    const newFollow = new Followers({
      followee: followeeId,
      follower: followerId,
    });
    await newFollow.save();
    res.status(201).json(newFollow);
  } catch (error) {
    console.error("Error following user:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

const UnFollowController = async (req, res) => {
  try {
    const followerId = req.user._id;
    const { userId: followeeId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(followeeId)) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    if (followerId.equals(followeeId)) {
      return res.status(400).json({ message: "You cannot unfollow yourself" });
    }

    const followeeExists = await User.findById(followeeId);

    if (!followeeExists) {
      return res.status(404).json({ message: "User not found" });
    }

    const deletedFollow = await Followers.findOneAndDelete({
      followee: followeeId,
      follower: followerId,
    });

    if (!deletedFollow) {
      return res
        .status(400)
        .json({ message: "You are not following this user" });
    }

    res.status(200).json(deletedFollow);
  } catch (error) {
    console.error("Error unfollowing user:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

const GetFriendRequestsController = async (req, res) => {
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
      .skip(skip)
      .limit(limit)
      .populate({
        path: "fromUserId",
        select: "firstName lastName photo",
      })
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

    res.status(200).json(urlUpdatedConnectionRequest);
  } catch (error) {
    console.error("Error fetching friend requests:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

const GetFriendsListController = async (req, res) => {
  try {
    const user = req.user._id;
    const page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    limit = limit > 10 ? 10 : limit;
    const skip = (page - 1) * limit;

    const connections = await Connections.find({
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
      .skip(skip)
      .limit(limit)
      .populate({
        path: "fromUserId",
        select: "firstName lastName photo",
      })
      .populate({
        path: "toUserId",
        select: "firstName lastName photo",
      })
      .lean();

    const organisedFriendsList = connections.map((connection) => {
      const friend = connection.fromUserId._id.equals(user)
        ? connection.toUserId
        : connection.fromUserId;

      const optimizedProfileImg = optimizedImg(friend.photo.public_id, 50);
      return {
        _id: friend._id,
        firstName: friend.firstName,
        lastName: friend.lastName,
        photo: {
          ...friend.photo,
          url: optimizedProfileImg,
        },
      };
    });

    res.status(200).json({
      page,
      limit,
      total: organisedFriendsList.length,
      friends: organisedFriendsList,
    });
  } catch (error) {
    console.error("Error fetching friends list:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

const FindNewFriendsController = async (req, res) => {
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
      .skip(skip)
      .limit(limit)
      .select("firstName lastName emailId photo")
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

    res.status(200).json(urlUpdatedConnectionRequest);
  } catch (error) {
    console.error("Error fetching friends list:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

const UnFriendController = async (req, res) => {
  try {
    const user = req.user;
    const { friendId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(friendId)) {
      return res.status(400).json({ message: "Invalid friendId" });
    }

    if (user._id.equals(friendId)) {
      return res.status(400).json({ message: "You cannot unfriend yourself" });
    }

    const connection = await Connections.findOne({
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

    if (!connection || connection.status !== "accepted") {
      return res.status(400).json({ message: "You are not friends" });
    }

    await Connections.findByIdAndDelete(connection._id);

    console.log("Connection removed:", connection._id);

    res.status(200).json({
      message: "Friend removed successfully",
    });
  } catch (error) {
    console.error("Error removing connection:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

const FollowersListController = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    limit = limit > 10 ? 10 : limit;
    const skip = (page - 1) * limit;

    const user = req.user;
    const followers = await Followers.find({
      followee: user._id,
    })
      .skip(skip)
      .limit(limit)
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

      const optimizedProfileImg = optimizedImg(
        item.follower.photo.public_id,
        50
      );

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

    res.status(200).json(imgOptimizedFollowers);
  } catch (error) {
    console.error("Error fetching followers:", error.message);
    res.status(500).json({ message: "Failed to fetch followers" });
  }
};

const FollowingListController = async (req, res) => {
  try {
    const user = req.user;
    const page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    limit = limit > 10 ? 10 : limit;
    const skip = (page - 1) * limit;

    const following = await Followers.find({
      follower: user._id,
    })
      .skip(skip)
      .limit(limit)
      .populate({
        path: "followee",
        select: "firstName lastName photo",
      })
      .lean();

    const imgOptimizedFollowing = following.map((item) => {
      if (
        !item.followee ||
        !item.followee.photo ||
        !item.followee.photo.public_id
      ) {
        console.log("images not optmizied as needed info was missing");
        return item;
      }

      const optimizedProfileImg = optimizedImg(
        item.followee.photo.public_id,
        50
      );

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

    res.status(200).json(imgOptimizedFollowing);
  } catch (error) {
    console.log("something went wrong : ", error.message);
    res.send("Something went wrong : " + error.message);
  }
};

const GetUersFollowersListController = async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    limit = limit > 10 ? 10 : limit;
    const skip = (page - 1) * limit;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    const followers = await Followers.find({
      followee: userId,
    })
      .skip(skip)
      .limit(limit)
      .populate({
        path: "follower",
        select: "firstName lastName photo",
      })
      .lean();

    const imgOptimizedFollowers = followers.map((item) => {
      if (
        !item.follower ||
        !item.follower.photo ||
        !item.follower.photo.public_id
      ) {
        console.log("images not optmizied as needed info was missing");
        return item;
      }

      const optimizedProfileImg = optimizedImg(
        item.follower.photo.public_id,
        50
      );

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
    res.status(200).json(imgOptimizedFollowers);
  } catch (error) {
    console.error("Error fetching followers:", error.message);
    res.status(500).json({ message: "Something went wrong" });
  }
};

const GetUsersFollowingListController = async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    limit = limit > 10 ? 10 : limit;
    const skip = (page - 1) * limit;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    const following = await Followers.find({
      follower: userId,
    })
      .skip(skip)
      .limit(limit)
      .populate({
        path: "followee",
        select: "firstName lastName photo",
      })
      .lean();

    const imgOptimizedFollowing = following.map((item) => {
      if (
        !item.followee ||
        !item.followee.photo ||
        !item.followee.photo.public_id
      ) {
        console.log("images not optmizied as needed info was missing");
        return item;
      }

      const optimizedProfileImg = optimizedImg(
        item.followee.photo.public_id,
        50
      );

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

    res.status(200).send(imgOptimizedFollowing);
  } catch (error) {
    console.error("Error fetching following:", error.message);
    res.status(500).json({ message: "Something went wrong" });
  }
};

module.exports = {
  SendFriendRequestController,
  AcceptFriendRequestController,
  FollowController,
  UnFollowController,
  GetFriendRequestsController,
  GetFriendsListController,
  FindNewFriendsController,
  UnFriendController,
  FollowersListController,
  FollowingListController,
  GetUsersFollowingListController,
  GetUersFollowersListController,
};
