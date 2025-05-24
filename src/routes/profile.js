const express = require("express");
const userAuth = require("../middlewares/userAuth");
const { validationProfileEdit } = require("../utils/validation");
const validator = require("validator");
const profileRouter = express.Router();
const User = require("../models/user");
const bcrypt = require("bcrypt");
const Connections = require("../models/connections");
const multer = require("multer");
const { upload, cloudinary } = require("../utils/cloudinaryConfig");
const fs = require("fs/promises");

profileRouter.get("/profile/view", userAuth, (req, res) => {
  try {
    const user = req.user;
    res.send(user);
  } catch (error) {
    res.status(400).send("cannot fetch user, please login");
  }
});

profileRouter.post("/profile/edit", userAuth, async (req, res) => {
  try {
    if (!validationProfileEdit(req)) {
      throw new Error("Invalid edit request");
    }

    const currentUser = req.user;
    Object.keys(req.body).forEach((field) => {
      currentUser[field] = req.body[field];
    });

    await currentUser.save();

    res.send(currentUser);
  } catch (error) {
    res.send(error.message);
  }
});

profileRouter.post("/profile/edit/password", userAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!validator.isStrongPassword(newPassword)) {
      throw new Error("Password is not strong");
    }

    const verifyCurrentPassword = await bcrypt.compare(
      currentPassword,
      req.user.password
    );

    if (!verifyCurrentPassword) {
      res.send("Incorrect Password");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    console.log(hashedPassword);

    const user = await User.findByIdAndUpdate(
      { _id: req.user._id },
      {
        password: hashedPassword,
        passwordChangedAt: new Date(),
      },
      {
        runValidators: true,
        new: true,
      }
    );

    res.cookie("token", null, {
      expires: new Date(Date.now()),
    });

    res.status(200).send(user);
  } catch (error) {
    res.send(error.message);
  }
});

profileRouter.get("/profile/view/:profileId", userAuth, async (req, res) => {
  try {
    const { profileId } = req.params;
    if (typeof profileId !== "string") {
      res.send("Invalid Profile");
    } else {
      const profileDetail = await User.findById({
        _id: profileId,
      });
      if (!profileDetail) {
        res.send("User does not exist");
      } else {
        res.send(profileDetail);
      }
    }
  } catch (error) {
    res.send(error.message);
  }
});

profileRouter.post(
  "/profile/addImage",
  userAuth,
  upload.single("file"),
  async (req, res) => {
    const user = req.user;
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded." });
    }

    const localFilePath = req.file.path;
    console.log("here 1 - Local file path:", localFilePath);
    try {
      const cloudImg = await cloudinary.uploader.upload(localFilePath, {
        folder: "profileImg",
      });

      console.log("Current image id", user.photo.public_id);

      const hasImage = user.photo.public_id !== "default_placeholder";

      if (hasImage) {
        const deleteImageFromCloudinary = await cloudinary.uploader.destroy(
          user.photo.public_id
        );
        console.log(
          "Existing user image deleted from cloudinary",
          deleteImageFromCloudinary
        );
      }

      const updatedUser = await User.findByIdAndUpdate(
        { _id: user._id },
        {
          photo: {
            url: cloudImg.secure_url,
            public_id: cloudImg.public_id,
          },
        },
        { new: true, runValidators: true }
      );

      if (!updatedUser) {
        await cloudinary.uploader.destroy(cloudImg.public_id);
        await User.findByIdAndUpdate(
          { _id: user._id },
          {
            photo: {
              url: "https://res.cloudinary.com/doknrbhso/image/upload/v1746265741/samples/animals/cat.jpg",
              public_id: "default_placeholder",
            },
          }
        );
        return res.status(404).json({ message: "Unable to update." });
      }

      await fs.unlink(localFilePath);

      console.log(`Local file deleted: ${localFilePath}`);

      res.status(200).json({
        message: "Image uploaded and profile updated successfully!",
        updatedUser: updatedUser,
        imageUrl: cloudImg.secure_url,
      });
    } catch (error) {
      console.error("Error during image upload or processing:", error);

      if (localFilePath) {
        try {
          await fs.unlink(localFilePath);
          console.log(
            `Error occurred, but local file deleted: ${localFilePath}`
          );
        } catch (unlinkError) {
          console.error(
            `Failed to delete local file ${localFilePath} during error handling:`,
            unlinkError
          );
        }
      }

      res.status(500).json({
        message: "Server error during image upload or profile update",
        error: error.message,
      });
    }
  }
);

module.exports = profileRouter;
