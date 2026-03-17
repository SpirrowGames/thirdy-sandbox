'use strict';

const TaskRepository = require('../repositories/TaskRepository');
const { NotFoundError, ForbiddenError } = require('../errors');

class TaskService {
  /**
   * タスク一覧を取得する。
   */
  async listTasks(filters) {
    return TaskRepository.findAll(filters);
  }

  /**
   * タスクを新規作成する。担当者を一括アサインする。
   */
  async createTask({ title, description, deadline, project_id, assignee_ids = [] }, userId) {
    const { pool } = require('../config/db');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const task = await TaskRepository.create({ title, description, deadline, project_id, created_by: userId });
      if (assignee_ids.length > 0) {
        const values = assignee_ids.map((uid, i) => `($1, $${i + 2})`).join(', ');
        await client.query(
          `INSERT INTO task_assignments (task_id, user_id) VALUES ${values}`,
          [task.id, ...assignee_ids]
        );
      }
      await client.query('COMMIT');
      return TaskRepository.findById(task.id);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * タスクを更新する。オーナーのみ許可。
   */
  async updateTask(id, data, userId) {
    const task = await TaskRepository.findById(id);
    if (!task) throw new NotFoundError('タスクが存在しません');

    await this._assertOwner(task.project_id, userId);
    return TaskRepository.update(id, data);
  }

  /**
   * タスクを削除する。オーナーのみ許可。
   */
  async deleteTask(id, userId) {
    const task = await TaskRepository.findById(id);
    if (!task) throw new NotFoundError('タスクが存在しません');

    await this._assertOwner(task.project_id, userId);
    await TaskRepository.delete(id);
  }

  /**
   * 担当者をアサインする。
   */
  async assignUser(taskId, userId) {
    const { pool } = require('../config/db');
    const task = await TaskRepository.findById(taskId);
    if (!task) throw new NotFoundError('タスクが存在しません');

    await pool.query(
      'INSERT INTO task_assignments (task_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [taskId, userId]
    );
    return TaskRepository.findById(taskId);
  }

  /**
   * 担当者をアサイン解除する。
   */
  async unassignUser(taskId, userId) {
    const { pool } = require('../config/db');
    await pool.query(
      'DELETE FROM task_assignments WHERE task_id = $1 AND user_id = $2',
      [taskId, userId]
    );
  }

  async _assertOwner(projectId, userId) {
    const ProjectRepository = require('../repositories/ProjectRepository');
    const project = await ProjectRepository.findById(projectId);
    if (!project) throw new NotFoundError('プロジェクトが存在しません');
    if (project.owner_id !== userId) throw new ForbiddenError('権限がありません');
  }
}

module.exports = new TaskService();