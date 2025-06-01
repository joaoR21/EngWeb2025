const create_errors = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mongoose = require('mongoose');
const fs = require('fs');
const cors = require('cors');
const passport = require('passport');

const mongoDB = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/TP-EW2025';
const filestore_path = path.join(__dirname, 'filestore');

mongoose.connect(mongoDB)
  .then(() => console.log('[INFO]: successfully connected to mongoDB.'))
  .catch(err => {
    console.error('[ERROR]: while connecting to mongoDB.', err);
    process.exit(1);
  });

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'mongoDB connection error during runtime...'));

if (!fs.existsSync(filestore_path)) {
  console.log(`[INFO]: creating filestore directory at: ${filestore_path}`);
  fs.mkdirSync(filestore_path, { recursive: true });
} else {
  console.log(`[INFO]: filestore directory already exists at: ${filestore_path}`);
}

const app = express();

require('./config/passport-config')(passport);

const { ensureAuthenticated, ensureAdmin, tryAuthenticate } = require('./routes/auth');

const frontend_origin = 'http://localhost:17000';

app.use(cors({
  origin: frontend_origin,
  credentials: true
}));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(passport.initialize());

const resource_rtr = require('./routes/resource-router');
const auth_rtr = require('./routes/auth');
const admin_rtr = require('./routes/admin-router');

app.use('/auth', auth_rtr);
app.use('/data/resources', tryAuthenticate, resource_rtr);
app.use('/admin', ensureAuthenticated, ensureAdmin, admin_rtr);

const newsController = require('./controllers/news-controller');
app.get('/news/public', async (req, res) => {
  try {
    const newsItems = await newsController.listVisibleNews();
    res.status(200).json(newsItems);
  } catch (error) {
    console.error("[ERROR] Fetching public news:", error.message, error.stack);
    res.status(500).json({ message: "Failed to fetch public news." });
  }
});

app.use(function(req, res, next) {
  next(create_errors(404));
});

app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  console.error("[BACKEND ERROR]:", err.status, err.message, err.stack);

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
  if (
    err.message === 'No auth token' ||
    err.message === 'jwt expired' ||
    err.message === 'invalid signature' ||
    err.message === 'User not found (invalid token).'
  ) {
    return res.status(401).json({ message: err.message });
  }

  res.status(err.status || 500);
  res.json({
    message: err.message,
    error: req.app.get('env') === 'development' ? { status: err.status, stack: err.stack } : {}
  });
});

module.exports = app;
