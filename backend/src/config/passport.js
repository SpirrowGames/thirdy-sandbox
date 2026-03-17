'use strict';

const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const { pool } = require('./db');

/**
 * passport-jwtストラテジーを設定する。
 * @param {import('passport').PassportStatic} passport
 */
function configurePassport(passport) {
  const options = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET || 'changeme',
  };

  passport.use(
    new JwtStrategy(options, async (payload, done) => {
      try {
        const result = await pool.query(
          'SELECT id, name, email, role FROM users WHERE id = $1',
          [payload.sub]
        );
        if (result.rows.length === 0) {
          return done(null, false);
        }
        return done(null, result.rows[0]);
      } catch (err) {
        return done(err, false);
      }
    })
  );
}

module.exports = configurePassport;