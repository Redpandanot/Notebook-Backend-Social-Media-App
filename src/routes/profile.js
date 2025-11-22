const express = require("express");
const userAuth = require("../middlewares/userAuth");
const profileRouter = express.Router();
const { upload } = require("../utils/cloudinaryConfig");
const {
  ProfileEditController,
  PasswordEditController,
  UserProfileDetailsController,
  ProfileDetailsController,
  UploadController,
} = require("../controller/ProfileController");

profileRouter.get("/profile", userAuth, UserProfileDetailsController);

profileRouter.post("/profile/edit", userAuth, ProfileEditController);

profileRouter.post("/profile/edit/password", userAuth, PasswordEditController);

profileRouter.get("/profile/:profileId", userAuth, ProfileDetailsController);

profileRouter.post(
  "/profile/image",
  userAuth,
  upload.single("file"),
  UploadController
);

module.exports = profileRouter;
