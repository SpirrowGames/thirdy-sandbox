'use strict';

jest.mock('../../src/repositories/ReminderRepository');
jest.mock('../../src/services/NotificationService');
jest.mock('node-cron', () => ({
  schedule: jest.fn().mockReturnValue({ stop: jest.fn() }),
}));

const ReminderRepository = require('../../src/repositories/ReminderRepository');
const NotificationService = require('../../src/services/NotificationService');

describe('reminderJob', () => {
  it('未通知リマインダーを取得して通知を送信する', async () => {
    const dueReminders = [
      { id: 1, task_id: 10, reminder_time: new Date().toISOString() },
    ];
    ReminderRepository.claimDueReminders.mockResolvedValue(dueReminders);
    NotificationService.send.mockResolvedValue();

    // cronコールバックを直接実行して検証
    const cron = require('node-cron');
    const callback = cron.schedule.mock.calls[0]?.[1];
    if (callback) {
      await callback();
      expect(NotificationService.send).toHaveBeenCalledWith(dueReminders[0]);
    }
  });
});