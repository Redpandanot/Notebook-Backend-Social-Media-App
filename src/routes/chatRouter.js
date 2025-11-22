const express = require("express");
const userAuth = require("../middlewares/userAuth");
const { GetAllChats } = require("../controller/ChatController");
const chatRouter = express.Router();

chatRouter.get("/chats", userAuth, GetAllChats);

module.exports = chatRouter;
