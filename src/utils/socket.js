const socket = require("socket.io");
const cookie = require("cookie");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const Chat = require("../models/chat");
const Message = require("../models/message");

const initializeSocket = (server) => {
  const io = socket(server, {
    cors: {
      origin: "http://localhost:5173",
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const cookies = socket.handshake.headers.cookie;
      if (!cookies) return next(new Error("No cookies found"));

      const parsed = cookie.parse(cookies);
      const token = parsed.token;

      if (!token) {
        return next(new Error("Invalid token"));
      }

      const decodedObj = jwt.verify(token, process.env.JWT_SECRET);

      const { _id, iat } = decodedObj;
      const user = await User.findById(_id);
      if (!user) {
        next(new Error("User not found"));
      }

      // Convert iat (seconds) to milliseconds for comparison with passwordChangedAt (Date object)
      const iatMilliseconds = iat * 1000;
      if (user.passwordChangedAt > iatMilliseconds) {
        // Password has been changed after the token was issued
        return next(new Error("Token invalid due to password change"));
      }

      socket.user = {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        emailId: user.emailId,
        age: user.age,
        gender: user.gender,
        college: user.college,
        photo: user.photo,
        about: user.about,
        skills: user.skills,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
      next();
    } catch {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    const fromUserId = socket.user?._id;

    socket.on("joinChat", async ({ toUserId }) => {
      if (!toUserId || toUserId === fromUserId) {
        socket.emit("error", { message: "Incorrect recipient user ID." });
        return;
      }

      try {
        const user = await User.findById(toUserId);
        if (!user) {
          socket.emit("error", { message: "Recipient user not found." });
          return;
        }

        const roomId = [fromUserId, toUserId].sort().join("$");
        console.log(fromUserId + " joined the room : " + roomId);
        socket.join(roomId);

        const chat = await Chat.findOne({
          participants: { $all: [fromUserId, toUserId] },
        });

        if (chat) {
          const messages = await Message.find({
            chatId: chat._id,
          });

          io.to(roomId).emit("messageHistory", messages);
        }
      } catch (error) {
        console.error("Error in joinChat:", error);
        socket.emit("error", { message: "Internal server error." });
      }
    });

    socket.on("sendMessage", async ({ toUserId, text }) => {
      if (
        !toUserId ||
        toUserId === fromUserId ||
        !text ||
        text.trim().length === 0
      )
        return;
      try {
        const toUser = await User.findById(toUserId);
        if (!toUser) {
          socket.emit("error", { message: "Recipient user not found." });
          return;
        }
        console.log("message sent by ", fromUserId);
        const roomId = [fromUserId, toUserId].sort().join("$");

        let chat = await Chat.findOne({
          participants: { $all: [fromUserId, toUserId] },
        });

        if (!chat) {
          chat = new Chat({
            participants: [fromUserId, toUserId].sort(),
            lastMessage: {
              text,
              timestamp: new Date(),
              sender: fromUserId,
            },
          });
          await chat.save();
        } else {
          chat.lastMessage = {
            text,
            timestamp: new Date(),
            sender: fromUserId,
          };
          await chat.save();
        }

        const message = new Message({
          chatId: chat._id,
          fromUserId,
          toUserId,
          text: text,
          seen: false,
        });
        await message.save();

        io.to(roomId).emit("messageReceived", message);
      } catch (error) {
        console.error("sendMessage error:", error);
        socket.emit("error", { message: "Could not send message." });
      }
    });

    socket.on("typing", async ({ toUserId }) => {
      try {
        const toUser = await User.findById(toUserId);
        if (!toUser) {
          socket.emit("error", { message: "Recipient user not found." });
          return;
        }

        console.log("User is typing : ", fromUserId);

        const roomId = [fromUserId, toUserId].sort().join("$");

        let chat = await Chat.findOne({
          participants: { $all: [fromUserId, toUserId] },
        });

        if (!chat) {
          return;
        }
        io.to(roomId).emit("typing", toUserId);
        return;
      } catch (error) {
        console.error("Error sending Istyping indicator: ", error);
        socket.emit("error", { message: "Error sending Istyping indicator." });
      }
    });

    socket.on("stopTyping", async ({ toUserId }) => {
      try {
        const toUser = await User.findById(toUserId);
        if (!toUser) {
          socket.emit("error", { message: "Recipient user not found." });
          return;
        }

        console.log("User stopped typing : ", fromUserId);

        const roomId = [fromUserId, toUserId].sort().join("$");

        let chat = await Chat.findOne({
          participants: { $all: [fromUserId, toUserId] },
        });

        if (!chat) {
          return;
        }
        io.to(roomId).emit("stopTyping", toUserId);
        return;
      } catch (error) {
        console.error("Error sending stopTyping indicator: ", error);
        socket.emit("error", {
          message: "Error sending stopTyping indicator.",
        });
      }
    });

    socket.on("disconnect", () => {
      console.log(`User ${fromUserId} disconnected`);
    });
  });
};

module.exports = initializeSocket;
