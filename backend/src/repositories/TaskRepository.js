'use strict';

const { pool } = require('../config/db');

class TaskRepository {
  /**
   * フィルタ条件でタスク一覧を取得する。
   * @param {{ project_id?: number, status?: string, page?: number, limit?: number }} opts
   */
  async findAll({ project_id, status, page = 1, limit = 20 } = {}) {
    const conditions = [];
    const values = [];
    let idx = 1;

    if (project_id) {
      conditions.push(`t.project_id = $${idx++}`);
      values.push(project_id);
    }
    if (status) {
      conditions.push(`t.status = $${idx++}`);
      values.push(status);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (page - 1) * limit;

    const [tasksResult, countResult] = await Promise.all([
      pool.query(
        `SELECT t.*,
                COALESCE(json_agg(json_build_object('id', u.id, 'name', u.name))
                  FILTER (WHERE u.id IS NOT NULL), '[]') AS assignees
         FROM tasks t
         LEFT JOIN task_assignments ta ON ta.task_id = t.id
         LEFT JOIN users u ON u.id = ta.user_id
         ${where}
         GROUP BY t.id
         ORDER BY t.created_at DESC
         LIMIT $${idx} OFFSET $${idx + 1}`,
        [...values, limit, offset]
      ),
      pool.query(`SELECT COUNT(*) FROM tasks t ${where}`, values),
    ]);

    return {
      tasks: tasksResult.rows,
      total: Number(countResult.rows[0].count),
    };
  }

  /**
   * IDでタスクを取得する。
   * @param {number} id
   */
  async findById(id) {
    const result = await pool.query(
      `SELECT t.*,
              COALESCE(json_agg(json_build_object('id', u.id, 'name', u.name))
                FILTER (WHERE u.id IS NOT NULL), '[]') AS assignees
       FROM tasks t
       LEFT JOIN task_assignments ta ON ta.task_id = t.id
       LEFT JOIN users u ON u.id = ta.user_id
       WHERE t.id = $1
       GROUP BY t.id`,
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * タスクを新規作成する。
   * @param {{ title: string, description?: string, deadline?: string, project_id: number, created_by: number }} data
   */
  async create({ title, description, deadline, project_id, created_by }) {
    const result = await pool.query(
      `INSERT INTO tasks (title, description, deadline, project_id, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [title, description || null, deadline || null, project_id, created_by]
    );
    return result.rows[0];
  }

  /**
   * タスクを更新する。
   * @param {number} id
   * @param {Partial<{ title: string, description: string, deadline: string, status: string }>} data
   */
  async update(id, data) {
    const fields = [];
    const values = [];
    let idx = 1;

    for (const [key, value] of Object.entries(data)) {
      if (['title', 'description', 'deadline', 'status'].includes(key)) {
        fields.push(`${key} = $${idx++}`);
        values.push(value);
      }
    }
    if (fields.length === 0) return this.findById(id);

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const result = await pool.query(
      `UPDATE tasks SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  /**
   * タスクを削除する。
   * @param {number} id
   */
  async delete(id) {
    await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
  }

  /**
   * タスクのプロジェクトIDを取得する。
   * @param {number} id
   */
  async getProjectId(id) {
    const result = await pool.query('SELECT project_id FROM tasks WHERE id = $1', [id]);
    return result.rows[0]?.project_id || null;
  }

  /**
   * プロジェクトIDごとの統計を取得する。
   * @param {number} projectId
   */
  async getStats(projectId) {
    const result = await pool.query(
      `SELECT status, COUNT(*) AS count FROM tasks WHERE project_id = $1 GROUP BY status`,
      [projectId]
    );
    return result.rows;
  }
}

module.exports = new TaskRepository();