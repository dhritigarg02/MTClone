let socket = io.connect("http://localhost:8080");

let videoChatLobby = document.getElementById("video-chat-lobby");
let videoChat = document.getElementById("video-chat-room");
let joinButton = document.getElementById("join");
let userVideo = document.getElementById("user-video");
let peerVideo = document.getElementById("peer-video");
let roomInput = document.getElementById("roomName");

let divButtonGroup = document.getElementById("btn-group");
let muteButton = document.getElementById("muteButton");
let leaveRoomButton = document.getElementById("leaveRoomButton");
let hideCameraButton = document.getElementById("hideCameraButton");
let muteFlag = false;
let hideCameraFlag = false;

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

muteButton.addEventListener("click", function(){

    muteFlag = !muteFlag;
    if(muteFlag){
        userStream.getTracks()[0].enabled = false;
        muteButton.textContent = "Unmute";
    } else {
        userStream.getTracks()[0].enabled = false;
        muteButton.textContent = "Mute";
    }
});

hideCameraButton.addEventListener("click", function(){

    hideCameraFlag = !hideCameraFlag;
    if(hideCameraFlag){
        userStream.getTracks()[1].enabled = false;
        hideCameraButton.textContent = "Show Camera";
    } else {
        userStream.getTracks()[1].enabled = true;
        hideCameraButton.textContent = "Hide Camera";
    }
});

leaveRoomButton.addEventListener("click", function(){

    socket.emit("leave", roomName);
    divButtonGroup.style = "display: none";
    videoChatLobby.style = "display: block";

    if(userVideo.srcObject){
        userVideo.srcObject.getTracks().forEach((track) => track.stop());
    }
    if(peerVideo.srcObject){
        peerVideo.srcObject.getTracks().forEach((track) => track.stop());
    }

    if(rtcPeerConnection){
        rtcPeerConnection.ontrack = null;
        rtcPeerConnection.onicecandidate = null;
        rtcPeerConnection.close();
        rtcPeerConnection = null;
    }
});

socket.on("created", function(){
    creator = true;

    navigator.mediaDevices
    .getUserMedia({
        audio : true,
        video : {width : 500, height : 500}
    })
    .then(function(stream){

        userStream = stream;
        videoChatLobby.style = "display:none";
        divButtonGroup.style = "display:flex";
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
        video : {width : 500, height : 500}
    })
    .then(function(stream){

        userStream = stream;
        videoChatLobby.style = "display:none";
        divButtonGroup.style = "display:flex";
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

socket.on("leave", function(){

    console.log("Leave");
    creator = true;

    if(rtcPeerConnection){
        rtcPeerConnection.ontrack = null;
        rtcPeerConnection.onicecandidate = null;
        rtcPeerConnection.close();
        rtcPeerConnection = null;
    }

    if(peerVideo.srcObject){
        peerVideo.srcObject.getTracks().forEach((track) => track.stop());
    }
});

function OnIceCandidateFunc(event) {

    console.log("Candidate");
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

