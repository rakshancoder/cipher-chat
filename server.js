const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(express.static("."));

const rooms = {};

const ADMIN_USER = "Rakshan_admin";
const ADMIN_PASS = "rakshan@admin";

io.on("connection", socket => {

let currentRoom="";
let username="";

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

socket.on("create-room",(room,user)=>{

username=user;
currentRoom=room;

if(!rooms[room]){
rooms[room]={
name:room,
creator:user,
users:[],
messages:[],
created:Date.now(),
permanent:false,
typers:new Set()
};
}

if (!rooms[room].users.includes(user)) {
  rooms[room].users.push(user);
}
rooms[room].messages.push({
  user: "SYSTEM",
  text: `⚡ ${username} joined the room`,
  system: true
});
socket.join(room);

sendNotification(room, `⚡ ${username} joined the room`);
sendRoomCount(room);

});

socket.on("join-room",(room,user)=>{

username=user;
currentRoom=room;

if(!rooms[room]){
rooms[room]={
name:room,
creator:user,
users:[],
messages:[],
created:Date.now(),
permanent:false,
typers:new Set()
};
}

if (!rooms[room].users.includes(user)) {
  rooms[room].users.push(user);
}
rooms[room].messages.push({
  user: "SYSTEM",
  text: `⚡ ${username} joined the room`,
  system: true
});
socket.join(room);

sendNotification(room, `⚡ ${username} joined the room`);
sendRoomCount(room);

});

socket.on("send-message",(msg)=>{

if (!currentRoom || !rooms[currentRoom]) return;

rooms[currentRoom].messages.push({
user:username,
text:msg
});

io.to(currentRoom).emit(
"message",
username+": "+msg
);

});

socket.on("send-image",(img)=>{

if (!currentRoom || !rooms[currentRoom]) return;

rooms[currentRoom].messages.push({
user:username,
img:img
});

io.to(currentRoom).emit("image",{
user:username,
img:img
});

});

socket.on("typing", isTyping => {
  if (!currentRoom || !rooms[currentRoom]) return;
  if (isTyping) {
    rooms[currentRoom].typers.add(username);
  } else {
    rooms[currentRoom].typers.delete(username);
  }
  io.to(currentRoom).emit("typing-users", Array.from(rooms[currentRoom].typers));
});

socket.on("leave-room", () => {
  if (!currentRoom || !rooms[currentRoom]) return;
  rooms[currentRoom].messages.push({
    user: "SYSTEM",
    text: `👋 ${username} left the room`,
    system: true
  });
  removeUserFromRoom(currentRoom, username);
  socket.leave(currentRoom);
  sendNotification(currentRoom, `👋 ${username} left the room`);
  if (rooms[currentRoom]) {
    sendRoomCount(currentRoom);
  }
  currentRoom = "";
});

socket.on("disconnect", () => {
  if (!currentRoom || !rooms[currentRoom]) return;
  rooms[currentRoom].messages.push({
    user: "SYSTEM",
    text: `👋 ${username} left the room`,
    system: true
  });
  removeUserFromRoom(currentRoom, username);
  socket.to(currentRoom).emit("notification", `👋 ${username} left the room`);
  if (rooms[currentRoom]) {
    sendRoomCount(currentRoom);
  }
});

socket.on("admin-login",(user,pass)=>{

if(user===ADMIN_USER && pass===ADMIN_PASS){
  socket.emit("rooms-list", rooms);
}else{
  socket.emit("login-error");
}

});

socket.on("admin-create-room", (roomName) => {
  if (!rooms[roomName]) {
    rooms[roomName] = {
      name: roomName,
      creator: "admin",
      users: [],
      messages: [{
        user: "SYSTEM",
        text: `🛠️ Room ${roomName} created by admin`,
        system: true
      }],
      created: Date.now(),
      permanent: true,
      typers: new Set()
    };
  } else {
    rooms[roomName].permanent = true;
  }
  socket.emit("rooms-list", rooms);
});

socket.on("admin-delete-room", (roomName) => {
  if (rooms[roomName]) {
    delete rooms[roomName];
  }
  socket.emit("rooms-list", rooms);
});

socket.on("get-room",(room)=>{
  socket.emit("room-data",rooms[room]);
});

});

const PORT = process.env.PORT || 3000;

http.listen(PORT, '0.0.0.0', ()=>{
console.log("Running on port " + PORT);
});

