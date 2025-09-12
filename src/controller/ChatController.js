const Chat = require("../models/chat");

const GetAllChats = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    limit = limit > 10 ? 10 : limit;
    const skip = (page - 1) * limit;

    const chats = await Chat.find({
      participants: userId,
    })
      .skip(skip)
      .limit(limit)
      .populate("participants", "-password -passwordChangedAt")
      .sort({ "lastMessage.createdAt": -1 })
      .lean();

    res.status(200).json(chats);
  } catch (error) {
    console.error("Error fetching chats:", error);
    res.status(500).json({ message: "Failed to fetch chats" });
  }
};

module.exports = {
  GetAllChats,
};
