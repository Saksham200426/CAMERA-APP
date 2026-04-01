const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// 🔥 room users tracking
const roomUsers = {};

app.use(express.static("public"));

// create room
app.get("/create-room", (req, res) => {
  const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
  res.json({ roomId });
});

// join page
app.get("/join/:roomId", (req, res) => {
  res.sendFile(__dirname + "/public/join.html");
});

// viewer page
app.get("/view/:roomId", (req, res) => {
  res.sendFile(__dirname + "/public/view.html");
});

// socket
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-room", (roomId) => {
    if (!roomUsers[roomId]) {
      roomUsers[roomId] = [];
    }

    // ❌ limit 2 users
    if (roomUsers[roomId].length >= 2) {
      socket.emit("room-full");
      return;
    }

    roomUsers[roomId].push(socket.id);
    socket.join(roomId);

    console.log(socket.id, "joined room:", roomId);

    // notify
    socket.to(roomId).emit("user-joined");
  });

  socket.on("offer", (data) => {
    socket.to(data.roomId).emit("offer", data.offer);
  });

  socket.on("answer", (data) => {
    socket.to(data.roomId).emit("answer", data.answer);
  });

  socket.on("ice-candidate", (data) => {
    socket.to(data.roomId).emit("ice-candidate", data.candidate);
  });

  socket.on("disconnect", () => {
    for (let roomId in roomUsers) {
      roomUsers[roomId] = roomUsers[roomId].filter(id => id !== socket.id);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});