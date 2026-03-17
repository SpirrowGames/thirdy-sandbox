'use strict';

const jwt = require('jsonwebtoken');
const TaskService = require('../services/TaskService');

/**
 * Socket.IOのタスク関連イベントハンドラを登録する。
 * @param {import('socket.io').Server} io
 */
function registerTaskSocket(io) {
  // ハンドシェイク時JWT検証
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }
    try {
      const secret = process.env.JWT_SECRET || 'changeme';
      const payload = jwt.verify(token, secret);
      socket.userId = payload.sub;
      next();
    } catch {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id} (user: ${socket.userId})`);

    socket.on('join_project', ({ project_id }) => {
      socket.join(`project:${project_id}`);
    });

    socket.on('leave_project', ({ project_id }) => {
      socket.leave(`project:${project_id}`);
    });

    socket.on('update_task', async (data) => {
      try {
        const task = await TaskService.updateTask(data.id, data, socket.userId);
        // プロジェクトルームにブロードキャスト
        io.to(`project:${task.project_id}`).emit('task_updated', task);
      } catch (err) {
        socket.emit('error', { code: err.name || 'ERROR', message: err.message });
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
}

module.exports = { registerTaskSocket };