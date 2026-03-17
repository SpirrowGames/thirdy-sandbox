import React from 'react';
import { Droppable } from 'react-beautiful-dnd';
import TaskCard from './TaskCard';

function KanbanColumn({ columnId, label, tasks }) {
  return (
    <div style={{ flex: 1, minWidth: 240 }}>
      <h3>{label} ({tasks.length})</h3>
      <Droppable droppableId={columnId}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            style={{
              minHeight: 200,
              padding: 8,
              background: snapshot.isDraggingOver ? '#e8f4fd' : '#f4f5f7',
              borderRadius: 4,
            }}
          >
            {tasks.map((task, index) => (
              <TaskCard key={task.id} task={task} index={index} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}

export default KanbanColumn;