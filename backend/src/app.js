'use strict';

const express = require('express');
const { json, urlencoded } = require('express');
const passport = require('passport');
require('dotenv').config();

const configurePassport = require('./config/passport');
const taskRoutes = require('./routes/tasks');
const projectRoutes = require('./routes/projects');
const authRoutes = require('./routes/auth');

/**
 * Expressアプリを初期化してミドルウェアとルートを登録する。
 * @returns {import('express').Application}
 */
function createApp() {
  const app = express();

  // ボディパーサー
  app.use(json());
  app.use(urlencoded({ extended: false }));

  // Passport初期化
  configurePassport(passport);
  app.use(passport.initialize());

  // ルート登録
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/tasks', taskRoutes);
  app.use('/api/v1/projects', projectRoutes);

  // ヘルスチェック
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  // グローバルエラーハンドラ
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
      error: {
        code: err.name || 'INTERNAL_SERVER_ERROR',
        message: err.message || 'Internal Server Error',
      },
    });
  });

  return app;
}

module.exports = { createApp };