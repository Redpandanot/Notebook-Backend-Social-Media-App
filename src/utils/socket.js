const socket = require("socket.io");

const initializeSocket = (server) => {
  const io = socket(server, {
    cors: {
      origin: "http://localhost:5173",
    },
  });

  io.on("connection", (socket) => {
    socket.on("joinChat", ({ fromuserId, toUserId }) => {
      const roomId = [fromuserId, toUserId].sort().join("$");
      console.log(fromuserId + " joined the room : " + roomId);
      socket.join(roomId);
    });

    socket.on("sendMessage", ({ fromuserId, toUserId, text }) => {
      console.log("message sent by user", text);
      const roomId = [fromuserId, toUserId].sort().join("$");
      io.to(roomId).emit("messageReceived", { fromuserId, text });
    });

    socket.on("disconnect", () => {});
  });
};

module.exports = initializeSocket;
