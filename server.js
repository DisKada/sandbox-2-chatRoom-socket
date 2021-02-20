const path = require("path");
const http = require("http");
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;
const server = http.createServer(app); // server untuk socket io
const socketio = require("socket.io");
const io = socketio(server);
const formatMessage = require("./utils/messages");
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
} = require("./utils/users");

// Set static directory
app.use(express.static(path.join(__dirname, "public")));

const botName = "Chat Bot";

// Run when client connects
io.on("connection", (socket) => {
  // Join room terima dari client
  socket.on("joinRoom", ({ username, room }) => {
    const user = userJoin(socket.id, username, room);

    socket.join(user.room);

    // kirim pesan ke user client
    socket.emit("message", formatMessage(botName, "Welcome To Chat"));

    // kirim pesan ke semua kecuali pengirim
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        formatMessage(botName, `${user.username} has joined the Chat`)
      );

    // Send users and room info
    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUsers(user.room),
    });
  });

  // Terima pesan dari chatMessage
  socket.on("chatMessage", (msg) => {
    const user = getCurrentUser(socket.id);
    io.to(user.room).emit("message", formatMessage(user.username, msg));
  });

  // Runs when client disconnects
  socket.on("disconnect", () => {
    const user = userLeave(socket.id);

    if (user) {
      // kirim ke semua user
      io.to(user.room).emit(
        "message",
        formatMessage(botName, `${user.username} has left the chat`)
      );

      // Send users and room info
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    }
  });
});

server.listen(PORT, () => console.log(`localhost:${PORT}`));
