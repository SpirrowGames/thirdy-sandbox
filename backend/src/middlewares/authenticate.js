'use strict';

const passport = require('passport');

/**
 * JWTを検証しreq.userをセットするミドルウェア。
 * 未認証の場合は401を返す。
 */
const authenticate = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user) => {
    if (err) return next(err);
    if (!user) {
      return res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: '認証が必要です' },
      });
    }
    req.user = user;
    next();
  })(req, res, next);
};

module.exports = { authenticate };