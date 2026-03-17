'use strict';

const http = require('http');
const { Server: SocketIOServer } = require('socket.io');
require('dotenv').config();

const { createApp } = require('./app');
const { registerTaskSocket } = require('./socket/taskSocket');

const PORT = process.env.PORT || 3001;

const app = createApp();
const httpServer = http.createServer(app);

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

registerTaskSocket(io);

httpServer.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

module.exports = { httpServer, io };