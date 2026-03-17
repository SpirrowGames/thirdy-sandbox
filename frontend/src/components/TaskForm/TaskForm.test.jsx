import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import tasksReducer from '../../store/tasksSlice';
import TaskForm from './TaskForm';

// apiClientをモック
jest.mock('../../api/apiClient', () => ({
  post: jest.fn(),
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() },
  },
}));

const apiClient = require('../../api/apiClient');

function renderWithStore(ui) {
  const store = configureStore({ reducer: { tasks: tasksReducer } });
  return render(<Provider store={store}>{ui}</Provider>);
}

describe('TaskForm', () => {
  beforeEach(() => jest.clearAllMocks());

  it('タイトルが空のままsubmitするとエラーを表示する', async () => {
    renderWithStore(<TaskForm projectId={1} />);
    fireEvent.click(screen.getByRole('button', { name: '作成' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('タイトルは必須です');
  });

  it('正常に送信するとonCloseが呼ばれる', async () => {
    apiClient.post.mockResolvedValue({
      data: { id: 1, title: 'テスト', status: 'todo', assignees: [] },
    });
    const onClose = jest.fn();
    renderWithStore(<TaskForm projectId={1} onClose={onClose} />);

    fireEvent.change(screen.getByLabelText('タイトル *'), { target: { value: 'テスト' } });
    fireEvent.click(screen.getByRole('button', { name: '作成' }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });
});