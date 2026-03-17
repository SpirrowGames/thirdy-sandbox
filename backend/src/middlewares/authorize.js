'use strict';

const { pool } = require('../config/db');

/**
 * プロジェクトオーナーのみ許可するミドルウェアファクトリ。
 * @param {(req: import('express').Request) => number|string} getProjectId
 * @returns {import('express').RequestHandler}
 */
const requireOwner = (getProjectId) => async (req, res, next) => {
  try {
    const projectId = getProjectId(req);
    const result = await pool.query(
      'SELECT owner_id FROM projects WHERE id = $1',
      [projectId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: { code: 'PROJECT_NOT_FOUND', message: 'プロジェクトが存在しません' },
      });
    }
    if (result.rows[0].owner_id !== req.user.id) {
      return res.status(403).json({
        error: { code: 'FORBIDDEN', message: '権限がありません' },
      });
    }
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { requireOwner };