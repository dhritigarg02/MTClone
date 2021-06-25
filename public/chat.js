let socket = io();

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
let shareScreenButton = document.getElementById("shareScreenButton");
let msgInput = document.getElementById("msgInput");
let sendMsgButton = document.getElementById("sendMsgButton");
let divChatArea = document.getElementById("chat-area");
let divChatCard = document.getElementById("chat-wrap-card");

let muteFlag = false;
let hideCameraFlag = false;
let shareScreenFlag = false;

let roomName;
let creator = false;
let userStream;
let camVideoTrack, camAudioTrack, screenVideoTrack;
let videoSender, audioSender;
let rtcPeerConnection;
let chatChannel;


//RTCPeerConnection uses ICE to work out the best path between peers
//working with STUN and TURN servers as necessary
let iceServers = {
    iceServers:[
        { urls: "stun:stun.services.mozilla.com"},
        { urls: "stun:stun.l.google.com:19302"},
        {
            url: 'turn:numb.viagenie.ca',
            credential: 'muazkh',
            username: 'webrtc@live.com'
        },
        {
            url: 'turn:192.158.29.39:3478?transport=udp',
            credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
            username: '28224511:1379330808'
        }
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
        userStream.getTracks()[0].enabled = true;
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

shareScreenButton.addEventListener("click", function(){

    shareScreenButton.disabled = true;

    navigator.mediaDevices.getDisplayMedia({
        cursor: true
    })
    .then(stream => {

        screenVideoTrack = stream.getTracks()[0];
        userVideo.style = "transform: none";
        userVideo.srcObject = stream;
        videoSender.replaceTrack(screenVideoTrack);

        // demonstrates how to detect that the user has stopped
        // sharing the screen via the browser UI.
        screenVideoTrack.onended = function(){
            videoSender.replaceTrack(camVideoTrack);
            userVideo.style = "transform: scale(-1, 1)";
            userVideo.srcObject = userStream;
            shareScreenButton.disabled = false;
        }
    })
    .catch(err => {
        alert("Couldn't access user screen media");
    });
});

sendMsgButton.addEventListener("click", function(){

    let message = msgInput.value;
    divChatArea.innerHTML += "<div class = 'right-align'>" + message + "</div><br />";
    chatChannel.send(message);
    msgInput.value = "";
});

leaveRoomButton.addEventListener("click", function(){

    socket.emit("leave", roomName);
    divButtonGroup.style = "display: none";
    videoChatLobby.style = "display: block";
    divChatCard.style = "display: none";

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

function StreamUserMediaFunc(stream){

    userStream = stream;
    videoChatLobby.style = "display: none";
    userVideo.style = "transform: scale(-1, 1)";
    divButtonGroup.style = "display: flex";
    divChatCard.style = "display: flex";
    userVideo.srcObject = stream;
    userVideo.onloadedmetadata = function(e) {
        userVideo.play();
    };
}

function GetUserMediaFunc(){

    return navigator.mediaDevices
            .getUserMedia({
                audio : true,
                video : {width : 1280, height : 720}
            });
}

socket.on("created", function(){

    creator = true;

    GetUserMediaFunc()
    .then(stream => {
        StreamUserMediaFunc(stream);
    })
    .catch(error => {
        console.log(error);
        alert("couldn't access user media");
    });
});

socket.on("joined", function(){

    creator = false;

    GetUserMediaFunc()
    .then(stream => {
        StreamUserMediaFunc(stream);
        socket.emit("ready", roomName);
    })
    .catch(error => {
        console.log(error);
        alert("couldn't access user media");
    });
});

//Triggered when a room is full (meaning has 2 people).
socket.on("full", function(){

    alert("room is full, can't join!");
});

//Triggered on receiving an ice candidate from the peer.
socket.on("candidate", candidate => {
    
    let icecandidate = new RTCIceCandidate(candidate);
    rtcPeerConnection.addIceCandidate(icecandidate);
});

//Implementing the OnTrackFunction which is part of the RTCPeerConnection Interface.
function OnTrackFunc(event){

    peerVideo.srcObject = event.streams[0];
    peerVideo.onloadedmetadata = function(e){
        peerVideo.play();
    };
}

//Implementing the OnIceCandidateFunction which is part of the RTCPeerConnection Interface.
function OnIceCandidateFunc(event){

    console.log("Candidate");
    if(event.candidate){
        socket.emit("candidate", event.candidate, roomName);
    }
}

function NewPeerConnFunc(){

    camVideoTrack = userStream.getVideoTracks()[0];
    camAudioTrack = userStream.getAudioTracks()[0];
    rtcPeerConnection = new RTCPeerConnection(iceServers);
    rtcPeerConnection.onicecandidate = OnIceCandidateFunc;
    rtcPeerConnection.ontrack = OnTrackFunc;
    videoSender = rtcPeerConnection.addTrack(camVideoTrack, userStream);
    audioSender = rtcPeerConnection.addTrack(camAudioTrack, userStream);
}

function OnMessage(event){

    console.log(event.data);
    divChatArea.innerHTML += "<div class = 'left-align'>" + event.data + "</div><br />";
}

socket.on("ready", function(){

    if(creator){
        NewPeerConnFunc(iceServers);
        chatChannel = rtcPeerConnection.createDataChannel("chatchannel");
        chatChannel.onmessage = OnMessage;

        rtcPeerConnection.createOffer()
        .then(offer => {
            rtcPeerConnection.setLocalDescription(offer);
            socket.emit("offer", offer, roomName);
        })
        .catch(error => {
            console.log(error);
        });
    }
});

socket.on("offer", offer => {

    if(!creator){
        NewPeerConnFunc(iceServers);
        rtcPeerConnection.ondatachannel = (event) => {
            chatChannel = event.channel;
            chatChannel.onmessage = OnMessage;
        }

        rtcPeerConnection.setRemoteDescription(offer);
        rtcPeerConnection.createAnswer()
        .then(answer => {
            rtcPeerConnection.setLocalDescription(answer);
            socket.emit("answer", answer, roomName);
        })
        .catch(error => {
            console.log(error);
        });
    }

});

socket.on("answer", answer => {

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





