const { cloudinary } = require("../utils/cloudinaryConfig");
const fs = require("fs/promises");
const Posts = require("../models/posts");
const Comments = require("../models/comments");

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

    return res.status(500).json({
      message: "Unable to create post due to an internal server error.",
      error: error.message,
    });
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
        const optimizedUrl = cloudinary.url(photo.public_id, {
          fetch_format: "auto", // Deliver in optimal format (WebP, AVIF, JPG, etc.)
          quality: "auto", // Adjust quality automatically
          secure: true, // Ensure HTTPS
          width: 400,
          crop: "limit",
        });
        return { url: optimizedUrl };
      });
    }
    if (newPost.userId && newPost.userId.photo && newPost.userId.photo.url) {
      const optimizedProfileImg = cloudinary.url(
        newPost.userId.photo.public_id,
        {
          fetch_format: "auto",
          quality: "auto",
          secure: true,
          width: 50,
          crop: "limit",
        }
      );

      newPost.userId.photo.url = optimizedProfileImg;
    }
    return newPost;
  });
  return optimizedPosts;
};

const populateReplies = async (postId, parentCommentId) => {
  const replies = await Comments.find({
    postId: postId,
    parentCommentId: parentCommentId,
  })
    .populate({
      path: "userId",
      select: "firstName lastName photo",
    })
    .lean()
    .sort({ createdAt: 1 });

  const nestedReplies = await Promise.all(
    replies.map(async (parentComment) => {
      parentComment.replies = await populateReplies(postId, parentComment._id);
      return parentComment;
    })
  );
  return nestedReplies;
};

module.exports = {
  createPost,
  optimizeImages,
  populateReplies,
};
