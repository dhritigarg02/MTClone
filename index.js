const express = require("express");
const socket = require("socket.io");

const app = express();

let server = app.listen(8080, function(){
    console.log("server is running!");
});

app.use(express.static("public"));

let io = socket(server);

io.on("connection", function(socket){
    console.log("User Connected : " + socket.id);

    socket.on("join", function(roomName){
        
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
    
    socket.on("ready", function(roomName){
        console.log("Ready");
        socket.broadcast.to(roomName).emit("ready");
    });

    socket.on("candidate", function(candidate, roomName){
        console.log("Candidate");
        socket.broadcast.to(roomName).emit("candidate", candidate);
    });

    socket.on("offer", function(offer, roomName){
        console.log("Offer");
        socket.broadcast.to(roomName).emit("offer", offer);
    });

    socket.on("answer", function(answer, roomName){
        console.log("Answer");
        socket.broadcast.to(roomName).emit("answer", answer);
    });
});

