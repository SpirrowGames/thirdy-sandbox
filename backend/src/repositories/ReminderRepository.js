'use strict';

const { pool } = require('../config/db');

class ReminderRepository {
  async findByTaskId(taskId) {
    const result = await pool.query(
      'SELECT * FROM reminders WHERE task_id = $1 ORDER BY reminder_time',
      [taskId]
    );
    return result.rows;
  }

  async create({ task_id, reminder_time }) {
    const result = await pool.query(
      'INSERT INTO reminders (task_id, reminder_time) VALUES ($1, $2) RETURNING *',
      [task_id, reminder_time]
    );
    return result.rows[0];
  }

  /**
   * 未通知かつ時刻到来のリマインダーをアトミックに取得・発火済みにする。
   */
  async claimDueReminders() {
    const result = await pool.query(
      `UPDATE reminders
       SET notified_at = NOW()
       WHERE notified_at IS NULL AND reminder_time <= NOW()
       RETURNING *`
    );
    return result.rows;
  }
}

module.exports = new ReminderRepository();