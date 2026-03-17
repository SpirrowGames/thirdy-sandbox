'use strict';

const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticate } = require('../middlewares/authenticate');
const ProjectService = require('../services/ProjectService');

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ error: { code: 'VALIDATION_ERROR', message: errors.array() } });
  }
  next();
};

// GET /api/v1/projects
router.get('/', authenticate, async (req, res, next) => {
  try {
    const projects = await ProjectService.listProjects();
    res.json({ projects });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/projects
router.post(
  '/',
  authenticate,
  [body('name').notEmpty().withMessage('プロジェクト名は必須です')],
  validate,
  async (req, res, next) => {
    try {
      const project = await ProjectService.createProject(req.body, req.user.id);
      res.status(201).json(project);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;