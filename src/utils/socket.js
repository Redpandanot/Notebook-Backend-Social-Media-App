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
      if (!toUserId) {
        socket.emit("error", { message: "Missing recipient user ID." });
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
      } catch (error) {
        console.error("Error in joinChat:", error);
        socket.emit("error", { message: "Internal server error." });
      }
    });

    socket.on("sendMessage", async ({ toUserId, text }) => {
      if (!toUserId || !text || text.trim().length === 0) return;
      console.log(toUserId + " , " + text);
      try {
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
          from: fromUserId,
          to: toUserId,
          text: text,
          seen: false,
        });
        await message.save();

        io.to(roomId).emit("messageReceived", "hi");
      } catch (error) {
        console.error("sendMessage error:", error);
        socket.emit("error", { message: "Could not send message." });
      }
    });

    socket.on("disconnect", () => {
      console.log(`User ${fromUserId} disconnected`);
    });
  });
};

module.exports = initializeSocket;
