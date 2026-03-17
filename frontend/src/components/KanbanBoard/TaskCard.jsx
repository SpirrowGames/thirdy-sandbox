import React from 'react';
import { Draggable } from 'react-beautiful-dnd';

function TaskCard({ task, index }) {
  return (
    <Draggable draggableId={String(task.id)} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{
            padding: 12,
            marginBottom: 8,
            background: snapshot.isDragging ? '#d4e9fa' : '#fff',
            borderRadius: 4,
            boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
            ...provided.draggableProps.style,
          }}
        >
          <div style={{ fontWeight: 600 }}>{task.title}</div>
          {task.deadline && (
            <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
              期限: {new Date(task.deadline).toLocaleDateString('ja-JP')}
            </div>
          )}
          {task.assignees?.length > 0 && (
            <div style={{ fontSize: 12, color: '#444', marginTop: 4 }}>
              担当: {task.assignees.map((a) => a.name).join(', ')}
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}

export default TaskCard;