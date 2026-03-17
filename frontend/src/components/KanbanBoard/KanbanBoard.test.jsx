import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import tasksReducer from '../../store/tasksSlice';
import KanbanBoard from './KanbanBoard';

// react-beautiful-dndをモック（jsdomではD&D不可）
jest.mock('react-beautiful-dnd', () => ({
  DragDropContext: ({ children }) => children,
  Droppable: ({ children }) => children({ innerRef: jest.fn(), droppableProps: {}, placeholder: null }, {}),
  Draggable: ({ children }) => children({ innerRef: jest.fn(), draggableProps: {}, dragHandleProps: {} }, {}),
}));

const tasks = [
  { id: 1, title: 'タスクA', status: 'todo', assignees: [] },
  { id: 2, title: 'タスクB', status: 'in-progress', assignees: [] },
  { id: 3, title: 'タスクC', status: 'done', assignees: [] },
];

function renderWithStore(ui) {
  const store = configureStore({ reducer: { tasks: tasksReducer } });
  return render(<Provider store={store}>{ui}</Provider>);
}

describe('KanbanBoard', () => {
  it('各ステータスの列が表示される', () => {
    const socketRef = { current: null };
    renderWithStore(<KanbanBoard tasks={tasks} socket={socketRef} />);

    expect(screen.getByText(/To Do/)).toBeInTheDocument();
    expect(screen.getByText(/In Progress/)).toBeInTheDocument();
    expect(screen.getByText(/Done/)).toBeInTheDocument();
  });

  it('各タスクがカードとして表示される', () => {
    const socketRef = { current: null };
    renderWithStore(<KanbanBoard tasks={tasks} socket={socketRef} />);

    expect(screen.getByText('タスクA')).toBeInTheDocument();
    expect(screen.getByText('タスクB')).toBeInTheDocument();
    expect(screen.getByText('タスクC')).toBeInTheDocument();
  });
});