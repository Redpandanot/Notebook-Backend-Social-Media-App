const express = require("express");
const connectionRouter = express.Router();
const userAuth = require("../middlewares/userAuth");
const {
  SendFriendRequestController,
  AcceptFriendRequestController,
  FollowController,
  UnFollowController,
  GetFriendRequestsController,
  GetFriendsListController,
  UnFriendController,
  FindNewFriendsController,
} = require("../controller/ConnectionController");

connectionRouter.post(
  "/friend-request/send/:status/:userId",
  userAuth,
  SendFriendRequestController
);

connectionRouter.post(
  "/friend-requests/review/:status/:requestId",
  userAuth,
  AcceptFriendRequestController
);

connectionRouter.post("/follow/:userId", userAuth, FollowController);

connectionRouter.post("/unfollow/:userId", userAuth, UnFollowController);

connectionRouter.get(
  "/friend-requests/view",
  userAuth,
  GetFriendRequestsController
);

connectionRouter.get("/friends-list", userAuth, GetFriendsListController);

connectionRouter.get("/new-friends", userAuth, FindNewFriendsController);

connectionRouter.post("/unFriend/:friendId", userAuth, UnFriendController);

module.exports = connectionRouter;
