const mongoose = require("mongoose");

const groupMemberSchema = mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Groups",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ["requested", "accepted", "rejected"],
        message: "incorrect status value",
      },
    },
    memberCount: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

groupMemberSchema.index({ groupId: 1 });

const groupMemberModel = mongoose.model("GroupMembers", groupMemberSchema);

module.exports = groupMemberModel;
