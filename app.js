const express = require("express")();
const http = require("http").Server(express);
const io = require("socket.io")(http, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const port = process.env.PORT || 5001;

const empire = require('./empire');

express.get('/', (req, res) => {
  res.send({ response: "I'm alive" }).status(200);
});

io.on("connection", (socket) => {
  console.log("New client connected!");
  empire.initGame(io, socket);

  // // socket event for client subscription
  // socket.on('subscribeToDateEvent', interval => {
  //   console.log('Client is subscribing with interval: ', interval);

  //   // emit message to the client side
  //   setInterval(() => {
  //     io.emit('getDate', new Date().toUTCString());
  //   }, interval);
  // });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  })
})

http.listen(port, () => console.log(`Listening on port ${port}`));