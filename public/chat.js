let socket = io.connect("http://localhost:8080");

let videoChatLobby = document.getElementById("video-chat-lobby");
let videoChat = document.getElementById("video-chat-room");
let joinButton = document.getElementById("join");
let userVideo = document.getElementById("user-video");
let peerVideo = document.getElementById("peer-video");
let roomInput = document.getElementById("roomName");

let roomName;
let creator = false;
let userStream;
let rtcPeerConnection;

let iceServers = {
    iceServers:[
        { urls: "stun:stun.services.mozilla.com"},
        { urls: "stun:stun.l.google.com:19302"},
    ],
};

joinButton.addEventListener("click", function(){

    if(roomInput.value == "") {
        alert("Please enter a room name");
    } else {
        roomName = roomInput.value;
        socket.emit("join", roomName);
    }
});

socket.on("created", function(){
    creator = true;

    navigator.mediaDevices
    .getUserMedia({
        audio : true,
        video : {width : 1280, height : 720}
    })
    .then(function(stream){

        userStream = stream;
        videoChatLobby.style = "display:none";
        userVideo.srcObject = stream;
        userVideo.onloadedmetadata = function(e) {
            userVideo.play();
        };
    })
    .catch(function(err){
        alert("couldn't access user media");
    });
});

socket.on("joined", function(){
    creator = false;

    navigator.mediaDevices
    .getUserMedia({
        audio : true,
        video : {width : 1280, height : 720}
    })
    .then(function(stream){

        userStream = stream;
        videoChatLobby.style = "display:none";
        userVideo.srcObject = stream;
        userVideo.onloadedmetadata = function(e) {
            userVideo.play();
        };
        socket.emit("ready", roomName);
    })
    .catch(function(){
        alert("couldn't access user media");
    });
});

socket.on("full", function(){
    alert("room is full, can't join!");
});

socket.on("ready", function(){
    if(creator){
        rtcPeerConnection = new RTCPeerConnection(iceServers);
        rtcPeerConnection.onicecandidate = OnIceCandidateFunc;
        rtcPeerConnection.ontrack = OnTrackFunc;
        rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream);
        rtcPeerConnection.addTrack(userStream.getTracks()[1], userStream);
        rtcPeerConnection.createOffer()
        .then((offer) => {
            rtcPeerConnection.setLocalDescription(offer);
            socket.emit("offer", offer, roomName);
        })
        .catch((error) => {
            console.log(error);
        });
    }
});

socket.on("candidate", function(candidate){
    
    let icecandidate = new RTCIceCandidate(candidate);
    rtcPeerConnection.addIceCandidate(icecandidate);
});

socket.on("offer", function(offer){

    if(!creator){
        rtcPeerConnection = new RTCPeerConnection(iceServers);
        rtcPeerConnection.onicecandidate = OnIceCandidateFunc;
        rtcPeerConnection.ontrack = OnTrackFunc;
        rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream);
        rtcPeerConnection.addTrack(userStream.getTracks()[1], userStream);
        rtcPeerConnection.setRemoteDescription(offer);
        rtcPeerConnection.createAnswer()
            .then((answer) => {
            rtcPeerConnection.setLocalDescription(answer);
            socket.emit("answer", answer, roomName);
            })
            .catch((error) => {
            console.log(error);
        });
    }

});

socket.on("answer", function(answer){
    rtcPeerConnection.setRemoteDescription(answer);
});

function OnIceCandidateFunc(event) {

    if(event.candidate){
        socket.emit("candidate", event.candidate, roomName);
    }
}

function OnTrackFunc(event){

    peerVideo.srcObject = event.streams[0];
    peerVideo.onloadedmetadata = function(e) {
        peerVideo.play();
    };

}