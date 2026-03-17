import React from 'react';
import { DragDropContext } from 'react-beautiful-dnd';
import { useDispatch } from 'react-redux';
import { optimisticallyUpdateStatus } from '../../store/tasksSlice';
import KanbanColumn from './KanbanColumn';

const COLUMNS = [
  { id: 'todo', label: 'To Do' },
  { id: 'in-progress', label: 'In Progress' },
  { id: 'done', label: 'Done' },
];

/**
 * カンバンボードのルートコンポーネント。
 * D&Dでタスクのステータスを変更する。
 * @param {{ tasks: Array, socket: React.MutableRefObject }} props
 */
function KanbanBoard({ tasks, socket }) {
  const dispatch = useDispatch();

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const newStatus = result.destination.droppableId;
    const taskId = result.draggableId;

    dispatch(optimisticallyUpdateStatus({ taskId, status: newStatus }));
    socket.current?.emit('update_task', { id: Number(taskId), status: newStatus });
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div style={{ display: 'flex', gap: '16px' }}>
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.id}
            columnId={col.id}
            label={col.label}
            tasks={tasks.filter((t) => t.status === col.id)}
          />
        ))}
      </div>
    </DragDropContext>
  );
}

export default KanbanBoard;