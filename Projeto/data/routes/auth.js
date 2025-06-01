const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

const jwt_secret = 'a very secret key for backend';
const jwt_expire = '1h';

function ensureAuthenticated(req, res, next) {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      let message = 'Unauthorized. Please log in.';
      if (info && info.message) message = info.message;
      return res.status(401).json({ message });
    }
    req.user = user;
    return next();
  })(req, res, next);
}

function tryAuthenticate(req, res, next) {
  passport.authenticate('jwt', { session: false }, (err, user) => {
    if (err) console.error("ERROR:", err);
    if (user) req.user = user;
    return next();
  })(req, res, next);
}

function ensureAdmin(req, res, next) {
  if (req.user && req.user.level === 'admin') return next();
  res.status(403).json({ message: 'FORBIDDEN: Admin access required.' });
}

router.post('/register', async (req, res) => {
  let { username, password, level } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }
  try {
    const existing = await User.findOne({ username });
    if (existing) return res.status(400).json({ message: 'Username already exists.' });
    const new_user = new User({ username, password, level: "producer" });
    await new_user.save();
    const payload = { id: new_user.id, username: new_user.username, level: new_user.level };
    const token = jwt.sign(payload, jwt_secret, { expiresIn: jwt_expire });
    res.status(201).json({
      message: 'User registered successfully.',
      token: 'Bearer ' + token,
      user: { id: new_user.id, username: new_user.username, level: new_user.level }
    });
  } catch (error) {
    console.error('[ERROR] during registration:', error);
    res.status(500).json({ message: '[ERROR]: registering user.', error: error.message });
  }
});

router.post('/login', (req, res, next) => {
  passport.authenticate('local', { session: false }, (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      return res.status(401).json({ message: info.message || 'Login FAILED! Invalid credentials.' });
    }
    const payload = { id: user.id, username: user.username, level: user.level };
    const token = jwt.sign(payload, jwt_secret, { expiresIn: jwt_expire });
    return res.status(200).json({
      message: 'Login SUCCESSFUL.',
      token: 'Bearer ' + token,
      user: { id: user.id, username: user.username, level: user.level }
    });
  })(req, res, next);
});

router.get('/logout', (req, res) => {
  res.status(200).json({ message: 'Logout signal received. Client should clear token.' });
});

router.get('/profile', ensureAuthenticated, (req, res) => {
  res.status(200).json({
    user: {
      id: req.user.id,
      username: req.user.username,
      level: req.user.level
    }
  });
});

module.exports = router;
module.exports.ensureAuthenticated = ensureAuthenticated;
module.exports.ensureAdmin = ensureAdmin;
module.exports.tryAuthenticate = tryAuthenticate;
