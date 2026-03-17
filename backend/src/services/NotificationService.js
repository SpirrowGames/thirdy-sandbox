'use strict';

const nodemailer = require('nodemailer');

class NotificationService {
  constructor() {
    this._transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'localhost',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });
  }

  /**
   * リマインダー通知を送信する。
   * @param {{ task_id: number, reminder_time: string }} reminder
   */
  async send(reminder) {
    const { pool } = require('../config/db');
    const result = await pool.query(
      `SELECT t.title, u.email, u.name
       FROM tasks t
       JOIN task_assignments ta ON ta.task_id = t.id
       JOIN users u ON u.id = ta.user_id
       WHERE t.id = $1`,
      [reminder.task_id]
    );

    const notifications = result.rows.map((row) =>
      this._sendEmail(row.email, row.name, row.title, reminder.reminder_time)
    );
    await Promise.allSettled(notifications);
  }

  async _sendEmail(to, name, taskTitle, reminderTime) {
    try {
      await this._transporter.sendMail({
        from: process.env.EMAIL_FROM || 'noreply@example.com',
        to,
        subject: `【リマインダー】${taskTitle}`,
        text: `${name} さん、タスク「${taskTitle}」のリマインダー時刻（${reminderTime}）になりました。`,
      });
    } catch (err) {
      console.error(`Failed to send email to ${to}:`, err.message);
    }
  }
}

module.exports = new NotificationService();