const socket = io();
const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");

let peerConnection;
const config = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

// Start local video
navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
    localVideo.srcObject = stream;

    socket.on("match", (partnerId) => {
        console.log("Matched with:", partnerId);
        peerConnection = new RTCPeerConnection(config);

        stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));

        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit("signal", { to: partnerId, signal: event.candidate });
            }
        };

        peerConnection.ontrack = (event) => {
            remoteVideo.srcObject = event.streams[0];
        };

        peerConnection.createOffer().then((offer) => {
            return peerConnection.setLocalDescription(offer);
        }).then(() => {
            socket.emit("signal", { to: partnerId, signal: peerConnection.localDescription });
        });
    });

    socket.on("signal", (data) => {
        if (!peerConnection) return;

        if (data.signal.type === "offer") {
            peerConnection.setRemoteDescription(new RTCSessionDescription(data.signal));
            peerConnection.createAnswer().then((answer) => {
                return peerConnection.setLocalDescription(answer);
            }).then(() => {
                socket.emit("signal", { to: data.from, signal: peerConnection.localDescription });
            });
        } else if (data.signal.type === "answer") {
            peerConnection.setRemoteDescription(new RTCSessionDescription(data.signal));
        } else {
            peerConnection.addIceCandidate(new RTCIceCandidate(data.signal));
        }
    });
});
