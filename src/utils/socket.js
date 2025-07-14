const socket = require("socket.io");
const cookie = require("cookie");
const jwt = require("jsonwebtoken");
const User = require("../models/user");

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
      const user = await User.findById({ _id });
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
    socket.on("joinChat", ({ toUserId }) => {
      if (!toUserId) return;

      const roomId = [fromUserId, toUserId].sort().join("$");
      console.log(fromUserId + " joined the room : " + roomId);
      socket.join(roomId);
    });

    socket.on("sendMessage", ({ toUserId, text }) => {
      if (!toUserId || !text || text.trim().length === 0) return;

      console.log("message sent by user", text);
      const roomId = [fromUserId, toUserId].sort().join("$");
      io.to(roomId).emit("messageReceived", { fromUserId, text });
    });

    socket.on("disconnect", () => {
      console.log(`User ${fromUserId} disconnected`);
    });
  });
};

module.exports = initializeSocket;
