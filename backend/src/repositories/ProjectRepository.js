'use strict';

const { pool } = require('../config/db');

class ProjectRepository {
  async findAll() {
    const result = await pool.query(
      `SELECT p.*,
              COUNT(DISTINCT pm.user_id) + 1 AS member_count
       FROM projects p
       LEFT JOIN project_members pm ON pm.project_id = p.id
       GROUP BY p.id
       ORDER BY p.created_at DESC`
    );
    return result.rows;
  }

  async findById(id) {
    const result = await pool.query('SELECT * FROM projects WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async create({ name, owner_id }) {
    const result = await pool.query(
      'INSERT INTO projects (name, owner_id) VALUES ($1, $2) RETURNING *',
      [name, owner_id]
    );
    return result.rows[0];
  }
}

module.exports = new ProjectRepository();