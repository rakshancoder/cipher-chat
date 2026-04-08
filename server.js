const express = require("express");
const path = require("path");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

// Serve all static files from root
app.use(express.static(__dirname));

// Serve index.html at root
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// ... all your existing socket.io code ...
const rooms = {};

const ADMIN_USER = "Rakshan_admin";
const ADMIN_PASS = "rakshan@admin";

io.on("connection", socket => {
  let currentRoom = "";
  let username = "";

  function sendRoomCount(room) {
    if (!rooms[room]) return;
    const roomSockets = io.sockets.adapter.rooms.get(room);
    const count = roomSockets ? roomSockets.size : 0;
    io.to(room).emit("room-count", count);
  }

  function sendNotification(room, text) {
    if (!room || !rooms[room]) return;
    io.to(room).emit("notification", text);
  }

  function removeUserFromRoom(room, user) {
    if (!rooms[room]) return;
    rooms[room].users = rooms[room].users.filter(u => u !== user);
    rooms[room].typers.delete(user);
  }

  // ... all your socket.on handlers as-is ...
});

// Use port from environment (Render/Fly.io)
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
