const mongoose = require("mongoose");

const connectionSchema = new mongoose.Schema(
  {
    fromUserId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    toUserId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    status: {
      type: String,
      enum: {
        values: ["requested", "accepted", "rejected"],
        message: "incorrect status value",
      },
    },
  },
  {
    timestamps: true,
  }
);

connectionSchema.index({ fromUserId: 1, toUserId: 1 });

const connectionModel = mongoose.model("Connections", connectionSchema);

module.exports = connectionModel;
