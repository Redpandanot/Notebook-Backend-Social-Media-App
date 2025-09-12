const express = require("express");
const followRouter = express.Router();
const userAuth = require("../middlewares/userAuth");
const {
  FollowersListController,
  FollowingListController,
  GetUsersFollowingListController,
  GetUersFollowersListController,
} = require("../controller/ConnectionController");

followRouter.get("/followers", userAuth, FollowersListController);

followRouter.get("/following", userAuth, FollowingListController);

followRouter.get(
  "/followers/:userId",
  userAuth,
  GetUersFollowersListController
);

followRouter.get(
  "/following/:userId",
  userAuth,
  GetUsersFollowingListController
);

module.exports = followRouter;
