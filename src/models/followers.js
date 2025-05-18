const mongoose = require("mongoose");

const followersSchema = new mongoose.Schema(
  {
    followee: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    follower: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

followersSchema.index({ followee: 1 });

const followerModel = mongoose.model("Followers", followersSchema);

module.exports = followerModel;
