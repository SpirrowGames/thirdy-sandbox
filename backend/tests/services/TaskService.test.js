'use strict';

// モジュールキャッシュをリセットしてモックを注入
jest.mock('../../src/repositories/TaskRepository');
jest.mock('../../src/repositories/ProjectRepository');
jest.mock('../../src/config/db', () => ({
  pool: {
    connect: jest.fn().mockResolvedValue({
      query: jest.fn().mockResolvedValue({ rows: [] }),
      release: jest.fn(),
    }),
    query: jest.fn().mockResolvedValue({ rows: [] }),
  },
}));

const TaskRepository = require('../../src/repositories/TaskRepository');
const ProjectRepository = require('../../src/repositories/ProjectRepository');
const TaskService = require('../../src/services/TaskService');
const { NotFoundError, ForbiddenError } = require('../../src/errors');

describe('TaskService.updateTask', () => {
  beforeEach(() => jest.clearAllMocks());

  it('オーナーであればタスクを更新できる', async () => {
    TaskRepository.findById.mockResolvedValue({ id: 1, project_id: 10 });
    ProjectRepository.findById.mockResolvedValue({ id: 10, owner_id: 1 });
    TaskRepository.update.mockResolvedValue({ id: 1, status: 'done' });

    const result = await TaskService.updateTask(1, { status: 'done' }, 1);
    expect(result.status).toBe('done');
  });

  it('タスクが存在しない場合NotFoundErrorをthrowする', async () => {
    TaskRepository.findById.mockResolvedValue(null);
    await expect(TaskService.updateTask(999, {}, 1)).rejects.toThrow(NotFoundError);
  });

  it('オーナーでない場合ForbiddenErrorをthrowする', async () => {
    TaskRepository.findById.mockResolvedValue({ id: 1, project_id: 10 });
    ProjectRepository.findById.mockResolvedValue({ id: 10, owner_id: 99 });

    await expect(TaskService.updateTask(1, {}, 1)).rejects.toThrow(ForbiddenError);
  });
});

describe('TaskService.deleteTask', () => {
  beforeEach(() => jest.clearAllMocks());

  it('オーナーであればタスクを削除できる', async () => {
    TaskRepository.findById.mockResolvedValue({ id: 1, project_id: 10 });
    ProjectRepository.findById.mockResolvedValue({ id: 10, owner_id: 1 });
    TaskRepository.delete.mockResolvedValue();

    await expect(TaskService.deleteTask(1, 1)).resolves.not.toThrow();
    expect(TaskRepository.delete).toHaveBeenCalledWith(1);
  });
});