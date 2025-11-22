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
  "/friend-request/:status/:userId",
  userAuth,
  SendFriendRequestController
);

connectionRouter.post(
  "/friend-requests/:status/:requestId",
  userAuth,
  AcceptFriendRequestController
);

connectionRouter.post("/follow/:userId", userAuth, FollowController);

// connectionRouter.post("/unfollow/:userId", userAuth, UnFollowController);

connectionRouter.get(
  "/friend-requests/view",
  userAuth,
  GetFriendRequestsController
);

connectionRouter.get("/friends-list", userAuth, GetFriendsListController);

connectionRouter.get("/friend-suggestions", userAuth, FindNewFriendsController);

connectionRouter.post("/unfriend/:friendId", userAuth, UnFriendController);

module.exports = connectionRouter;
