const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static("public"));

let waitingUser = null;

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    if (waitingUser) {
        // Pair users if one is waiting
        io.to(waitingUser).emit("match", socket.id);
        io.to(socket.id).emit("match", waitingUser);
        waitingUser = null;
    } else {
        // Store waiting user
        waitingUser = socket.id;
    }

    socket.on("signal", (data) => {
        io.to(data.to).emit("signal", { from: socket.id, signal: data.signal });
    });

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
        if (waitingUser === socket.id) {
            waitingUser = null;
        }
    });
});

server.listen(3000, () => console.log("Server running on http://localhost:3000"));
