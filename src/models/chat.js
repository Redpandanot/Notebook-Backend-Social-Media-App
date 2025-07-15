const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    lastMessage: {
      text: String,
      timestamp: Date,
      sender: mongoose.Schema.Types.ObjectId,
    },
    lastMessageAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

chatSchema.index({ participants: 1 }, { unique: true });

module.exports = mongoose.model("Chat", chatSchema);
