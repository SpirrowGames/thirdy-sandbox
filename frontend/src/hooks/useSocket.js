import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { io } from 'socket.io-client';
import {
  socketTaskUpdated,
  socketTaskCreated,
  socketTaskDeleted,
} from '../store/tasksSlice';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001';

/**
 * Socket.IO接続を管理し、プロジェクトルームのイベントをReduxに反映するフック。
 * @param {number|null} projectId
 */
export function useSocket(projectId) {
  const dispatch = useDispatch();
  const socketRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const socket = io(SOCKET_URL, { auth: { token } });
    socketRef.current = socket;

    socket.on('connect', () => {
      if (projectId) socket.emit('join_project', { project_id: projectId });
    });

    socket.on('task_updated', (task) => dispatch(socketTaskUpdated(task)));
    socket.on('task_created', (task) => dispatch(socketTaskCreated(task)));
    socket.on('task_deleted', ({ id }) => dispatch(socketTaskDeleted({ id })));

    return () => {
      if (projectId) socket.emit('leave_project', { project_id: projectId });
      socket.disconnect();
    };
  }, [projectId, dispatch]);

  return socketRef;
}