var createError = require('http-errors');
var express = require('express');
var path = require('path');
var logger = require('morgan');
const mongoose = require("mongoose");
const cors = require("cors");

const alunosRoutes = require("./routes/alunos-router");

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended:false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use("/data/alunos", alunosRoutes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

mongoose.connect("mongodb://localhost:27017/alunos", {
    useNewUrlParser:true,
    useUnifiedTopology:true
})
.then(() => console.log("mongoDB connected"))
.catch(err => console.error(err));

// Usar as rotas


module.exports = app;
