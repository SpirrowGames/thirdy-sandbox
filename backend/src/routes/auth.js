'use strict';

const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UserRepository = require('../repositories/UserRepository');

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ error: { code: 'VALIDATION_ERROR', message: errors.array() } });
  }
  next();
};

/**
 * POST /api/v1/auth/login
 */
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('有効なメールアドレスを入力してください'),
    body('password').notEmpty().withMessage('パスワードは必須です'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const user = await UserRepository.findByEmail(email);
      if (!user) {
        return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: '認証に失敗しました' } });
      }
      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) {
        return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: '認証に失敗しました' } });
      }
      const secret = process.env.JWT_SECRET || 'changeme';
      const accessToken = jwt.sign({ sub: user.id }, secret, { expiresIn: '15m' });
      const refreshToken = jwt.sign({ sub: user.id, type: 'refresh' }, secret, { expiresIn: '7d' });
      res.json({ accessToken, refreshToken });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;