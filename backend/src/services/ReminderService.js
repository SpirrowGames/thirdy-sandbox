'use strict';

const ReminderRepository = require('../repositories/ReminderRepository');
const TaskRepository = require('../repositories/TaskRepository');
const { NotFoundError } = require('../errors');

class ReminderService {
  async createReminder(taskId, { reminder_time }) {
    const task = await TaskRepository.findById(taskId);
    if (!task) throw new NotFoundError('タスクが存在しません');
    return ReminderRepository.create({ task_id: taskId, reminder_time });
  }

  async getReminders(taskId) {
    return ReminderRepository.findByTaskId(taskId);
  }
}

module.exports = new ReminderService();