const express = require('express');
const mongoose = require('mongoose');
var bcrypt = require('bcryptjs');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
const {ensureAuthenticated} = require('./auth.js')

const app = express();

app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: false }));
app.use(express.static(__dirname + '/public'));
app.use(session({
  secret: 'secret',
  resave: true,
  saveUninitialized:true
}));

app.use(passport.initialize());
app.use(passport.session());
require("./passport")(passport);

app.use(flash());
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
next();
})
// Connect to MongoDB
mongoose
  .connect(
    'mongodb+srv://user11:Shengjin1@cluster0.dxk2z.mongodb.net/myFirstDatabase?retryWrites=true&w=majority', //connection to local container mongo through port 27017 
    { useNewUrlParser: true,useUnifiedTopology: true}
  )
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

const User = require('./models/User');
const Post = require('./models/Post')


app.get('/', (req, res) =>{
  res.render('index', {});
});

app.get('/register', (req, res) => {
  res.render('register',{});
});

app.get('/admin',ensureAuthenticated,(req, res) => {
  u = req.user;
  u.active = true;
  u.save();

  User.find()
    .then(users => res.render('admin',{users,user:u}))

});

app.get('/login', (req, res) => {
  res.render('login',{})
});

app.post('/login', (req, res, next) => {
  passport.authenticate("local",{
    successRedirect : '/admin',
    failureRedirect : '/login',
    failureFlash : true ,
  })(req, res,next);

})

app.post('/register', (req, res) => {
  const {email,password,password2,fname,lname} = req.body;
  let errors = [];
  if(password!=password2){
    errors.push({msg:"passwords dont match!"})
  }
  if(!email || !password || !password2){
    errors.push({msg:"Please fill in email and passwords!"})
  }
  if(password.length<6){
    errors.push({msg:"passwords should be over 6 characters."})
  }
  if(errors.length>0){
    res.render('register',{
      errors:errors,
      email:email,
      password:password,
      password2:password2,
      fname:fname,
      lname:lname
    })
  } else {
    User.findOne({email:email}).exec((err,user)=>{
      if(user){
        errors.push({msg:"email already registered"});
        res.render('register',{errors,email,password,password2,fname,lname})
      } else{
        const newUser = new User({
          email: req.body.email,
          password: req.body.password,
          fname: req.body.fname,
          lname: req.body.lname
        });
        // newUser.save().then(
        //   req.flash('success_msg','You have now registered!'),
        //   res.redirect('/')
        // )

        //hash passwords
        bcrypt.genSalt(10,(err,salt)=>
        bcrypt.hash(newUser.password,salt,
          (err,hash)=>{
            if(err) {throw err;}
            newUser.password=hash;
            newUser.save()
              .then((value)=>{
                req.flash('success_msg','You have now registered!');
                res.redirect('/');
              }).catch(value=>console.log(value));
          }))

      }
    })
  };
  
});

app.get('/logout', (req, res)=>{
  u = req.user;
  u.active = false;
  u.save();
  req.logout();
  req.flash('success_msg','You have now logged out!');
  res.redirect('/')
})



// Get "My" profile when Auntheticated
// Ensure only "My" posts are displayed

app.get('/profile', ensureAuthenticated, (req, res) => {

  u = req.user;

  Post.find({owner: u.email})
    .then(posts => res.render('profile_page.ejs', { posts, user:u }))
    .catch(err => res.status(404).json({ msg: 'No Posts found' }));

});


// Submit a Post to "My" profile when Authenticated
// Mark post with the Owner attribute (User's email address)

app.post('/profile/post', ensureAuthenticated, (req, res) => {

  u = req.user;

  const newPost = new Post({
    Title: req.body.Title,
    Body: req.body.Body,
    owner: u.email
  })

  newPost.save().then(post => res.redirect('/profile'));

});



const port = 3000;

app.listen(port, () => console.log('Server running...'));
