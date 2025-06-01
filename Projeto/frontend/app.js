var create_error = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
var index_router = require('./routes/index');

var app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'a very secret key for frontend',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

app.use((req, res, next) => {
  res.locals.session = req.session;
  res.locals.currentUser = req.session.user;
  res.locals.isAuthenticated = req.session.isAuthenticated || false;
  next();
});

app.use('/', index_router);

app.use(function(req, res, next) {
  next(create_error(404));
});

app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  console.error("[FRONTEND ERROR HANDLER]", err);
  res.status(err.status || 500);
  res.render('error', { backendBaseUrl: process.env.BACKEND_API_URL || 'http://localhost:16000' });
});

module.exports = app;
