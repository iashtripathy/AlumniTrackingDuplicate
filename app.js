if(process.env.NODE_ENV !=="production"){
  require('dotenv').config();
}

var express = require('express');

var path = require('path');

var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
//var session = require('express-session');


//var FileStore = require('session-file-store')(session);
//var LocalStorage = require('node-localstorage').LocalStorage;
//var localStorage = new LocalStorage('./tokens');
var app = express();

var index = require('./routes/index');
var alumni = require('./routes/alumni');
var admin = require('./routes/admin');

var config = require('./config');

const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

const AlumniBasicDetails = require('./models/alumniBasicDetailsModel');

var passport = require('passport');
//var authenticate = require('./authenticate');



/* var expressHbs = require('express-handlebars'); */


app.use(cookieParser());
// app.use(express.json());



//db url
//const url = config.mongoUrl;
//process.env.DB_URL || 
const url = 'mongodb://localhost:27017/AlumniTrackingDatabaseDuplicate'
const connect = mongoose.connect(url, {
  
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex : true,
  useFindAndModify : false
 
});



connect.then((db) => {
    console.log("Connected correctly to server");
}, (err) => { console.log(err); });




// view engine setup

/* app.engine(".hbs",expressHbs({ extname : ".hbs"})); */
app.set('views', path.join(__dirname, 'views'));

app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(passport.initialize());
// app.use(passport.session());

app.use('/', index);
app.use('/admin',admin);
app.use('/alumni', alumni);

app.use(express.static('.'));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.send(err);
});

const port = process.env.PORT || 3000
app.listen(port,() => console.log('Server started'));

module.exports = app;
