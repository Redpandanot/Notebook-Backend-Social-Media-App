const { cloudinary } = require("../utils/cloudinaryConfig");
const {
  optimizedImg,
  isFollowing,
  connectionStatus,
} = require("../utils/helperFunctions");
const User = require("../models/user");
const { validationProfileEdit } = require("../utils/validation");
const validator = require("validator");
const bcrypt = require("bcrypt");
const multer = require("multer");
const fs = require("fs/promises");

const UserProfileDetailsController = (req, res) => {
  try {
    const user = req.user;

    const optimizedProfileImg = optimizedImg(user.photo.public_id, 400);

    const photoUrl = optimizedProfileImg || req.user.photo?.url;

    res.json({
      ...req.user,
      photo: { url: photoUrl },
    });
  } catch (error) {
    res.status(500).json({ error: "Cannot fetch user profile" });
  }
};

const ProfileEditController = async (req, res) => {
  try {
    if (!validationProfileEdit(req)) {
      throw new Error("Invalid edit request");
    }

    const user = await User.findByIdAndUpdate(
      { _id: req.user._id },
      {
        ...req.body,
      },
      {
        runValidators: true,
        new: true,
      }
    );

    res.send("Profile Updated successfully :)");
  } catch (error) {
    res.send(error.message);
  }
};

const PasswordEditController = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!validator.isStrongPassword(newPassword)) {
      throw new Error("Password is not strong");
    }

    console.log("input validated");

    const verifyCurrentPassword = await bcrypt.compare(
      currentPassword,
      req.user.password
    );

    if (!verifyCurrentPassword) {
      res.send("Incorrect Password");
    }

    console.log("current password validated");

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
};

const ProfileDetailsController = async (req, res) => {
  try {
    const user = req.user._id;
    const { profileId } = req.params;

    if (!profileId || typeof profileId !== "string") {
      return res.status(400).json({ error: "Invalid Profile ID" });
    }

    const profileDetail = await User.findById({
      _id: profileId,
    });
    if (!profileDetail) {
      return res.status(404).json({ error: "User does not exist" });
    }
    const optimizedProfileImg = optimizedImg(
      profileDetail.photo.public_id,
      400
    );

    let responseProfile = profileDetail.toObject();
    responseProfile.photo = { url: optimizedProfileImg };

    const followSet = await isFollowing(user, [profileDetail]);
    const connection = await connectionStatus(user, profileId);

    responseProfile = !user.equals(profileId)
      ? {
          ...responseProfile,
          isFollowing: followSet.has(profileId),
          connectionStatus: connection,
        }
      : responseProfile;

    res.status(200).json(responseProfile);
  } catch (error) {
    console.error("Profile fetch error:", error);
    res.status(500).json({ error: "Server error while fetching profile" });
  }
};

const UploadController = async (req, res) => {
  const user = req.user;
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded." });
  }

  const localFilePath = req.file.path;
  console.log("Local file path:", localFilePath);
  try {
    const DEFAULT_IMAGE_URL = process.env.DEFAULT_PROFILE_IMG_URL;
    const DEFAULT_IMAGE_ID = process.env.DEFAULT_PROFILE_IMG_ID;
    console.log("Current image id", user.photo.public_id);

    const hasImage = user.photo.public_id !== DEFAULT_IMAGE_ID;

    if (hasImage) {
      const deleteImageFromCloudinary = await cloudinary.uploader.destroy(
        user.photo.public_id
      );
      console.log(
        "Existing user image deleted from cloudinary",
        deleteImageFromCloudinary
      );
    }

    const cloudImg = await cloudinary.uploader.upload(localFilePath, {
      folder: "profileImg",
    });

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

    await fs.unlink(localFilePath);

    if (!updatedUser) {
      await cloudinary.uploader.destroy(cloudImg.public_id);
      await User.findByIdAndUpdate(
        { _id: user._id },
        {
          photo: {
            url: DEFAULT_IMAGE_URL,
            public_id: DEFAULT_IMAGE_ID,
          },
        },
        {
          runValidators: true,
        }
      );
      return res.status(404).json({ message: "Unable to update." });
    }

    console.log("Local file deleted");

    res.status(200).json({
      message: "Image uploaded and profile updated successfully!",
      updatedUser,
      imageUrl: cloudImg.secure_url,
    });
  } catch (error) {
    console.error("Error during image upload or processing:", error);

    try {
      if (localFilePath) {
        await fs.unlink(localFilePath);
      }
    } catch (unlinkError) {
      console.error(`Failed to delete local file:`, unlinkError);
    }

    res.status(500).json({
      message: "Server error during image upload or profile update",
      error: error.message,
    });
  }
};

module.exports = {
  UserProfileDetailsController,
  ProfileEditController,
  PasswordEditController,
  ProfileDetailsController,
  UploadController,
};
