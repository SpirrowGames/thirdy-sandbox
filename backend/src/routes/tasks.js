'use strict';

const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const { authenticate } = require('../middlewares/authenticate');
const TaskService = require('../services/TaskService');
const ReminderService = require('../services/ReminderService');

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ error: { code: 'VALIDATION_ERROR', message: errors.array() } });
  }
  next();
};

// GET /api/v1/tasks
router.get(
  '/',
  authenticate,
  [
    query('project_id').optional().isInt(),
    query('status').optional().isIn(['todo', 'in-progress', 'done']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { project_id, status, page, limit } = req.query;
      const result = await TaskService.listTasks({
        project_id: project_id ? Number(project_id) : undefined,
        status,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 20,
      });
      res.json({ ...result, page: Number(page) || 1, limit: Number(limit) || 20 });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/v1/tasks
router.post(
  '/',
  authenticate,
  [
    body('title').notEmpty().withMessage('タイトルは必須です'),
    body('project_id').isInt().withMessage('project_idは整数です'),
    body('deadline').optional().isISO8601(),
    body('assignee_ids').optional().isArray(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const task = await TaskService.createTask(req.body, req.user.id);
      res.status(201).json(task);
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/v1/tasks/:id
router.put(
  '/:id',
  authenticate,
  [
    param('id').isInt(),
    body('title').optional().notEmpty(),
    body('status').optional().isIn(['todo', 'in-progress', 'done']),
    body('deadline').optional().isISO8601(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const task = await TaskService.updateTask(Number(req.params.id), req.body, req.user.id);
      res.json(task);
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/v1/tasks/:id
router.delete(
  '/:id',
  authenticate,
  [param('id').isInt()],
  validate,
  async (req, res, next) => {
    try {
      await TaskService.deleteTask(Number(req.params.id), req.user.id);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/v1/tasks/:id/assign
router.post(
  '/:id/assign',
  authenticate,
  [param('id').isInt(), body('user_id').isInt()],
  validate,
  async (req, res, next) => {
    try {
      const task = await TaskService.assignUser(Number(req.params.id), req.body.user_id);
      res.json({ task_id: task.id, assignees: task.assignees });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/v1/tasks/:id/assign/:user_id
router.delete(
  '/:id/assign/:user_id',
  authenticate,
  [param('id').isInt(), param('user_id').isInt()],
  validate,
  async (req, res, next) => {
    try {
      await TaskService.unassignUser(Number(req.params.id), Number(req.params.user_id));
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/v1/tasks/:id/reminders
router.post(
  '/:id/reminders',
  authenticate,
  [param('id').isInt(), body('reminder_time').isISO8601()],
  validate,
  async (req, res, next) => {
    try {
      const reminder = await ReminderService.createReminder(Number(req.params.id), req.body);
      res.status(201).json(reminder);
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/v1/tasks/:id/reminders
router.get(
  '/:id/reminders',
  authenticate,
  [param('id').isInt()],
  validate,
  async (req, res, next) => {
    try {
      const reminders = await ReminderService.getReminders(Number(req.params.id));
      res.json({ reminders });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;