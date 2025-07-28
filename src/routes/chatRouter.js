const express = require("express");
const Chat = require("../models/chat");
const userAuth = require("../middlewares/userAuth");
const chatRouter = express.Router();

chatRouter.get("/allChats", userAuth, async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    limit = limit > 10 ? 10 : limit;
    const skip = (page - 1) * limit;

    const chats = await Chat.find({
      participants: userId,
    })
      .populate("participants", "-password -passwordChangedAt")
      .sort({ "lastMessage.createdAt": -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.status(200).json(chats);
  } catch (error) {
    console.error("Error fetching chats:", error);
    res.status(500).json({ message: "Failed to fetch chats" });
  }
});

module.exports = chatRouter;
