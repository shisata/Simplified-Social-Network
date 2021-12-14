var passport = require('passport');
var GoogleStrategy = require('passport-google-Oauth20').Strategy;
const User = require('./models/User');

passport.use(new GoogleStrategy({
    clientID: '218597842520-kpnpr2efuv6834r44oto049bkni9i39s.apps.googleusercontent.com',
    clientSecret: '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',
    callbackURL:"/auth/google/callback",
    passReqToCallback: true
},
function(accessToken, refreshToken, profile ,email ,done) {
    console.log(email);
    var em = email.emails[0].value;
    let errors = [];
    


    User.findOne({email:em}).exec((err,user)=>{
        if(user){
            return done(err, user);
        } else {
            errors.push({msg:"please registst first!"});
            res.render('register',{
                errors:errors,
                email:em,
              });
            return done(err, user);
        
        }
    });
}
));