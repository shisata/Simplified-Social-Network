"use strict";

var passport = require('passport');

var GoogleStrategy = require('passport-google-oauth20').Strategy;

var User = require('./models/User');

passport.use(new GoogleStrategy({
  clientID: '218597842520-kpnpr2efuv6834r44oto049bkni9i39s.apps.googleusercontent.com',
  clientSecret: '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',
  callbackURL: "/auth/google/callback",
  passReqToCallback: true
}, function (accessToken, refreshToken, profile, email, done) {
  var em = email.emails[0].value;
  var fn = email.name.givenName;
  var ln = email.name.familyName;
  User.findOne({
    email: em
  }).exec(function (err, user) {
    if (user) {
      return done(err, user);
    } else {
      var newUser = new User({
        email: em,
        fname: fn,
        lname: ln
      });
      newUser.save();
      return done(err, user);
    }
  });
}));