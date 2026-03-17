'use strict';

const cron = require('node-cron');
const ReminderRepository = require('../repositories/ReminderRepository');
const NotificationService = require('../services/NotificationService');

/**
 * 1分ごとにリマインダーをポーリングし、発火対象を通知する。
 */
const reminderJob = cron.schedule('* * * * *', async () => {
  try {
    const reminders = await ReminderRepository.claimDueReminders();
    for (const reminder of reminders) {
      await NotificationService.send(reminder);
    }
  } catch (err) {
    console.error('reminderJob error:', err.message);
  }
});

module.exports = { reminderJob };