const socket = io();
const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");

let peerConnection;
const config = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

socket.on("match", (partnerId) => {
    peerConnection = new RTCPeerConnection(config);

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit("signal", { to: partnerId, signal: event.candidate });
        }
    };

    peerConnection.ontrack = (event) => {
        remoteVideo.srcObject = event.streams[0];
    };

    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
        localVideo.srcObject = stream;
        stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream));
        peerConnection.createOffer().then((offer) => peerConnection.setLocalDescription(offer));
    });

    socket.on("signal", (data) => {
        if (data.signal.type === "offer") {
            peerConnection.setRemoteDescription(new RTCSessionDescription(data.signal));
            peerConnection.createAnswer().then((answer) => peerConnection.setLocalDescription(answer));
        } else {
            peerConnection.addIceCandidate(new RTCIceCandidate(data.signal));
        }
    });
});
