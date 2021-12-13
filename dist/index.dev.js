"use strict";

var express = require('express');

var mongoose = require('mongoose');

var bcrypt = require('bcryptjs');

var session = require('express-session');

var flash = require('connect-flash');

var passport = require('passport');

var _require = require('./auth.js'),
    ensureAuthenticated = _require.ensureAuthenticated;

var app = express();
app.set('view engine', 'ejs');
app.use(express.urlencoded({
  extended: false
}));
app.use(express["static"](__dirname + '/public'));
app.use(session({
  secret: 'secret',
  resave: true,
  saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

require("./passport")(passport);

app.use(flash());
app.use(function (req, res, next) {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  next();
}); // Connect to MongoDB

mongoose.connect('mongodb+srv://user11:Shengjin1@cluster0.dxk2z.mongodb.net/myFirstDatabase?retryWrites=true&w=majority', //connection to local container mongo through port 27017 
{
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(function () {
  return console.log('MongoDB Connected');
})["catch"](function (err) {
  return console.log(err);
});

var User = require('./models/User');

app.get('/', function (req, res) {
  res.render('index', {});
});
app.get('/register', function (req, res) {
  res.render('register', {});
});
app.get('/admin', ensureAuthenticated, function (req, res) {
  u = req.user;
  u.active = true;
  u.save();
  User.find().then(function (users) {
    return res.render('admin', {
      users: users,
      user: u
    });
  });
});
app.get('/login', function (req, res) {
  res.render('login', {});
});
app.post('/login', function (req, res, next) {
  passport.authenticate("local", {
    successRedirect: '/admin',
    failureRedirect: '/login',
    failureFlash: true
  })(req, res, next);
});
app.post('/register', function (req, res) {
  var _req$body = req.body,
      email = _req$body.email,
      password = _req$body.password,
      password2 = _req$body.password2,
      fname = _req$body.fname,
      lname = _req$body.lname;
  var errors = [];

  if (password != password2) {
    errors.push({
      msg: "passwords dont match!"
    });
  }

  if (!email || !password || !password2) {
    errors.push({
      msg: "Please fill in email and passwords!"
    });
  }

  if (password.length < 6) {
    errors.push({
      msg: "passwords should be over 6 characters."
    });
  }

  if (errors.length > 0) {
    res.render('register', {
      errors: errors,
      email: email,
      password: password,
      password2: password2,
      fname: fname,
      lname: lname
    });
  } else {
    User.findOne({
      email: email
    }).exec(function (err, user) {
      if (user) {
        errors.push({
          msg: "email already registered"
        });
        res.render('register', {
          errors: errors,
          email: email,
          password: password,
          password2: password2,
          fname: fname,
          lname: lname
        });
      } else {
        var newUser = new User({
          email: req.body.email,
          password: req.body.password,
          fname: req.body.fname,
          lname: req.body.lname
        }); // newUser.save().then(
        //   req.flash('success_msg','You have now registered!'),
        //   res.redirect('/')
        // )
        //hash passwords

        bcrypt.genSalt(10, function (err, salt) {
          return bcrypt.hash(newUser.password, salt, function (err, hash) {
            if (err) {
              throw err;
            }

            newUser.password = hash;
            newUser.save().then(function (value) {
              req.flash('success_msg', 'You have now registered!');
              res.redirect('/');
            })["catch"](function (value) {
              return console.log(value);
            });
          });
        });
      }
    });
  }

  ;
});
app.get('/logout', function (req, res) {
  u = req.user;
  u.active = false;
  u.save();
  req.logout();
  req.flash('success_msg', 'You have now logged out!');
  res.redirect('/');
});

require('./gg.js');

app.get('/auth/google', function (req, res, next) {
  passport.authenticate('google', {
    scope: ['https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/userinfo.email']
  })(req, res, next);
});
app.get('/auth/google/callback', function (req, res, next) {
  passport.authenticate('google', {
    successRedirect: '/admin',
    failureRedirect: '/login',
    failureFlash: true
  })(req, res, next);
});
var port = 3000;
app.listen(port, function () {
  return console.log('Server running...');
});