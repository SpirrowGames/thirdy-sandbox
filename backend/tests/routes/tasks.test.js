'use strict';

const request = require('supertest');
const { createApp } = require('../../src/app');

// リポジトリとサービスをモック
jest.mock('../../src/services/TaskService');
jest.mock('../../src/middlewares/authenticate', () => ({
  authenticate: (req, _res, next) => {
    req.user = { id: 1, role: 'owner' };
    next();
  },
}));

const TaskService = require('../../src/services/TaskService');
const app = createApp();

describe('GET /api/v1/tasks', () => {
  it('タスク一覧を返す', async () => {
    TaskService.listTasks.mockResolvedValue({ tasks: [], total: 0 });

    const res = await request(app)
      .get('/api/v1/tasks')
      .set('Authorization', 'Bearer dummy');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('tasks');
    expect(res.body).toHaveProperty('total', 0);
  });

  it('statusが不正な場合422を返す', async () => {
    const res = await request(app)
      .get('/api/v1/tasks?status=invalid')
      .set('Authorization', 'Bearer dummy');

    expect(res.status).toBe(422);
  });
});

describe('POST /api/v1/tasks', () => {
  it('タスクを作成して201を返す', async () => {
    const newTask = { id: 1, title: 'テストタスク', status: 'todo', project_id: 1 };
    TaskService.createTask.mockResolvedValue(newTask);

    const res = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', 'Bearer dummy')
      .send({ title: 'テストタスク', project_id: 1 });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('テストタスク');
  });

  it('titleが空の場合422を返す', async () => {
    const res = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', 'Bearer dummy')
      .send({ project_id: 1 });

    expect(res.status).toBe(422);
  });
});

describe('PUT /api/v1/tasks/:id', () => {
  it('タスクを更新して200を返す', async () => {
    const updated = { id: 1, title: '更新済み', status: 'in-progress', project_id: 1 };
    TaskService.updateTask.mockResolvedValue(updated);

    const res = await request(app)
      .put('/api/v1/tasks/1')
      .set('Authorization', 'Bearer dummy')
      .send({ status: 'in-progress' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('in-progress');
  });
});

describe('DELETE /api/v1/tasks/:id', () => {
  it('タスクを削除して204を返す', async () => {
    TaskService.deleteTask.mockResolvedValue();

    const res = await request(app)
      .delete('/api/v1/tasks/1')
      .set('Authorization', 'Bearer dummy');

    expect(res.status).toBe(204);
  });
});