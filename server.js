const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public")); // Serves frontend files

let waitingUser = null; // Stores a waiting user

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    if (waitingUser) {
        io.to(waitingUser).emit("match", socket.id);
        io.to(socket.id).emit("match", waitingUser);
        waitingUser = null;
    } else {
        waitingUser = socket.id;
    }

    socket.on("signal", (data) => {
        io.to(data.to).emit("signal", { from: socket.id, signal: data.signal });
    });

    socket.on("disconnect", () => {
        if (waitingUser === socket.id) waitingUser = null;
    });
});

server.listen(3000, () => console.log("Server running on http://localhost:3000"));
