const crypto = require('crypto');

function loadJwtSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;

  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set in production');
  }

  console.warn('JWT_SECRET is not set, using a random one. Logins end when the server restarts.');
  return crypto.randomBytes(32).toString('hex');
}

module.exports = {
  jwtSecret: loadJwtSecret(),
  tokenLifetime: '7d',
};
