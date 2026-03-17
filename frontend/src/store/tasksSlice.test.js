import reducer, {
  optimisticallyUpdateStatus,
  socketTaskUpdated,
  socketTaskCreated,
  socketTaskDeleted,
} from './tasksSlice';

const initialState = {
  items: [
    { id: 1, title: 'タスクA', status: 'todo', assignees: [] },
    { id: 2, title: 'タスクB', status: 'in-progress', assignees: [] },
  ],
  total: 2,
  status: 'succeeded',
  error: null,
};

describe('tasksSlice', () => {
  it('optimisticallyUpdateStatus: 指定タスクのstatusを更新する', () => {
    const state = reducer(initialState, optimisticallyUpdateStatus({ taskId: '1', status: 'done' }));
    expect(state.items.find((t) => t.id === 1).status).toBe('done');
  });

  it('socketTaskUpdated: 該当タスクを上書きする', () => {
    const updated = { id: 2, title: 'タスクB更新', status: 'done', assignees: [] };
    const state = reducer(initialState, socketTaskUpdated(updated));
    expect(state.items.find((t) => t.id === 2).title).toBe('タスクB更新');
  });

  it('socketTaskCreated: 先頭にタスクを追加してtotalを増やす', () => {
    const newTask = { id: 3, title: 'タスクC', status: 'todo', assignees: [] };
    const state = reducer(initialState, socketTaskCreated(newTask));
    expect(state.items[0].id).toBe(3);
    expect(state.total).toBe(3);
  });

  it('socketTaskDeleted: 該当タスクを削除してtotalを減らす', () => {
    const state = reducer(initialState, socketTaskDeleted({ id: 1 }));
    expect(state.items.find((t) => t.id === 1)).toBeUndefined();
    expect(state.total).toBe(1);
  });
});