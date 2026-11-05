const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Station = require('../models/Station');
const requireAuth = require('../middleware/auth');
const { HttpError, asyncHandler } = require('../middleware/errors');
const { jwtSecret, tokenLifetime } = require('../config');

const router = express.Router();

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

const isText = (value) => typeof value === 'string' && value.trim().length > 0;

function checkUsername(username) {
  if (!isText(username) || username.trim().length < 3 || username.trim().length > 30) {
    throw new HttpError(400, 'Username must be 3 to 30 characters');
  }
}

function session(user) {
  const token = jwt.sign({ userId: user._id }, jwtSecret, { expiresIn: tokenLifetime });
  return { token, user };
}

router.post('/register', asyncHandler(async (req, res) => {
  const { username, email, password, phone } = req.body;

  checkUsername(username);
  if (!isText(email) || !EMAIL_PATTERN.test(email.trim())) {
    throw new HttpError(400, 'Enter a valid email address');
  }
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    throw new HttpError(400, `Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }

  const user = await User.create({
    username,
    email,
    phone: isText(phone) ? phone : undefined,
    password: await bcrypt.hash(password, 10),
  });

  res.status(201).json(session(user));
}));

router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!isText(email) || typeof password !== 'string') {
    throw new HttpError(400, 'Enter your email and password');
  }

  const user = await User.findOne({ email: email.trim().toLowerCase() });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new HttpError(401, 'Incorrect email or password');
  }

  user.lastLogin = new Date();
  await user.save();

  res.json(session(user));
}));

router.get('/me', requireAuth, asyncHandler(async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) throw new HttpError(401, 'Your session has expired, log in again');
  res.json(user);
}));

router.patch('/me', requireAuth, asyncHandler(async (req, res) => {
  const { username, phone, homeStation } = req.body;
  const user = await User.findById(req.userId);
  if (!user) throw new HttpError(401, 'Your session has expired, log in again');

  if (username !== undefined) {
    checkUsername(username);
    user.username = username;
  }
  if (phone !== undefined) {
    if (typeof phone !== 'string') throw new HttpError(400, 'Phone must be text');
    user.phone = phone;
  }
  if (homeStation !== undefined) {
    if (typeof homeStation !== 'string') throw new HttpError(400, 'Home station must be a station id');
    if (homeStation && !(await Station.exists({ stationId: homeStation }))) {
      throw new HttpError(400, 'Home station not found');
    }
    user.homeStation = homeStation || undefined;
  }

  await user.save();
  res.json(user);
}));

module.exports = router;
