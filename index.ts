import express from 'express';
const app = express();
import http from 'http';
const server = http.createServer(app);
import { Server } from "socket.io";
const io = new Server(server);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  socket.on('chat message', (msg) => {
    io.emit('chat message', msg);
  });

  console.log('new user has joined:', socket.id);
});


server.listen(8080, () => {
  console.log('listening on *:8080');
  console.log('testing to see if this shows up without tsc-ing myself');
});