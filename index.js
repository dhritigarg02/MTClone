const express = require("express");
const socket = require("socket.io");
const port = process.env.PORT || 8080;

const app = express();

let server = app.listen(port, function(){
    console.log("server is running on port " + port);
});

app.use(express.static('public'));

let io = socket(server);

io.on("connection", socket => {
    console.log("User Connected : " + socket.id);

    socket.on("join", roomName => {   
        let rooms = io.sockets.adapter.rooms;
        let room = rooms.get(roomName);

        if(room == undefined){
            socket.join(roomName);
            socket.emit("created");
            console.log("Room Created");
        } else if(room.size == 1){
            socket.join(roomName);
            socket.emit("joined");
            console.log("Room joined");
        } else {
            console.log("Room full for Now");
            socket.emit("full");
        }
        console.log(rooms);
    });
    
    socket.on("ready", roomName => {
        console.log("Ready");
        socket.broadcast.to(roomName).emit("ready");
    });

    socket.on("candidate", (candidate, roomName) => {
        console.log("Candidate");
        socket.broadcast.to(roomName).emit("candidate", candidate);
    });

    socket.on("offer", (offer, roomName) => {
        console.log("Offer");
        socket.broadcast.to(roomName).emit("offer", offer);
    });

    socket.on("answer", (answer, roomName) => {
        console.log("Answer");
        socket.broadcast.to(roomName).emit("answer", answer);
    });

    socket.on("leave", roomName => {
        socket.leave(roomName);
        socket.broadcast.to(roomName).emit("leave");
    });
});

