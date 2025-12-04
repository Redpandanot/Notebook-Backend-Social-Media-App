const { cloudinary } = require("../utils/cloudinaryConfig");
const fs = require("fs/promises");
const Posts = require("../models/posts");
const Comments = require("../models/comments");
const Followers = require("../models/followers");
const mongoose = require("mongoose");
const Connections = require("../models/connections");

const createPost = async (userId, req, title, description) => {
  let uploadedImagesData = [];
  let localFilePaths = [];

  try {
    if (req.files && req.files.length > 0) {
      localFilePaths = req.files.map((file) => file.path); // Collect all local paths for cleanup

      console.log("Local file paths (multiple):", localFilePaths);

      const uploadedImagesPromises = req.files.map(async (file) => {
        try {
          const cloudImg = await cloudinary.uploader.upload(file.path, {
            folder: "postsImg",
          });
          return { url: cloudImg.secure_url, public_id: cloudImg.public_id };
        } catch (error) {
          console.error(
            `Cloudinary upload error for file ${file.originalname}:`,
            error.message
          );
          return null;
        }
      });

      uploadedImagesData = (await Promise.all(uploadedImagesPromises)).filter(
        (img) => img !== null
      );

      if (uploadedImagesData.length === 0) {
        throw new Error("No images were successfully uploaded to Cloudinary.");
      }
    }

    const postData = {
      userId: userId,
      title,
      description,
      likeCount: 0,
      commentCount: 0,
    };

    if (uploadedImagesData.length > 0) {
      postData.photos = uploadedImagesData;
    }
    const post = new Posts(postData);
    await post.save();
    console.log("Post saved successfully!");
    return post;
  } catch (error) {
    console.error("Error creating post:", error.message);

    // Delete images from Cloudinary if they were successfully uploaded
    if (uploadedImagesData.length > 0) {
      const publicIdsToDestroy = uploadedImagesData.map((img) => img.public_id);

      await Promise.all(
        publicIdsToDestroy.map(async (public_id) => {
          try {
            await cloudinary.uploader.destroy(public_id);
            console.log(`Cloudinary image deleted (rollback): ${public_id}`);
          } catch (destroyError) {
            console.error(
              `Error deleting Cloudinary image ${public_id} during rollback:`,
              destroyError.message
            );
          }
        })
      );
    }

    throw error;
  } finally {
    //Delete local temporary file
    if (localFilePaths.length > 0) {
      await Promise.all(
        localFilePaths.map(async (path) => {
          try {
            await fs.unlink(path);

            console.log(`Local temporary file deleted: ${path}`);
          } catch (unlinkError) {
            // Ignore "file not found" errors (ENOENT) if file was already deleted or never existed

            if (unlinkError.code !== "ENOENT") {
              console.error(
                `Error deleting local temporary file ${path}:`,
                unlinkError
              );
            }
          }
        })
      );
    }
  }
};

const optimizeImages = (posts) => {
  const optimizedPosts = posts.map((post) => {
    const newPost = { ...post };

    if (newPost.photos && newPost.photos.length > 0) {
      newPost.photos = newPost.photos.map((photo) => {
        const optimizedUrl = optimizedImg(photo.public_id, 400);
        return { url: optimizedUrl };
      });
    }

    if (newPost.userId && newPost.userId.photo && newPost.userId.photo.url) {
      const optimizedProfileImg = optimizedImg(
        newPost.userId.photo.public_id,
        50
      );

      newPost.userId.photo.url = optimizedProfileImg;
    }

    return newPost;
  });
  return optimizedPosts;
};

const optimizedImg = (publicId, width) => {
  try {
    const optimizedUrl = cloudinary.url(publicId, {
      fetch_format: "auto",
      quality: "auto",
      secure: true,
      width: width,
      crop: "limit",
    });
    return optimizedUrl;
  } catch (error) {
    console.error("Cloudinary image optimization failed:", error.message);
    return null;
  }
};

const connectionMapper = (usersList) => {
  const connectionMappedList = usersList.map((user) => isFollowing());
  connectionMappedList = usersList.map((user) => isFriend());
  return connectionMappedList;
};

const isFollowing = async (follower, users) => {
  const followStatuses = await Followers.find({
    follower,
    followee: { $in: users.map((u) => u._id) },
  })
    .select("followee")
    .lean();

  return new Set(followStatuses.map((f) => f.followee.toString()));
};

const connectionStatus = async (user1, user2) => {
  const friendShipStatus = await Connections.findOne({
    $or: [
      { fromUserId: user1, toUserId: user2 },
      { fromUserId: user2, toUserId: user1 },
    ],
  }).lean();
  return friendShipStatus ? friendShipStatus : false;
};

const recursiveNestedComment = (depth = 5) => {
  if (depth === 0) return [];

  return [
    {
      path: "replies",
      populate: [
        {
          path: "userId",
          select: "firstName lastName photo",
        },
        ...recursiveNestedComment(depth - 1),
      ],
    },
  ];
};

module.exports = {
  createPost,
  optimizeImages,
  optimizedImg,
  connectionMapper,
  isFollowing,
  connectionStatus,
  recursiveNestedComment,
};
