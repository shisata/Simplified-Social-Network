/****
General guideline for this project:
 - Put a comment in codes/functions declaration describing its purpose. Especially complicated ones.
 - Group functions/code in category so the code is easy to read
 - If you find some pieces of codes from someone that don't work for you, comment it out and add your modified code if the person is not aware of changes.
 - Put all backend .js files into models
 - Put all .ejs files into views
****/

////// Dependencies
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const flash = require('connect-flash');
const path = require('path');

var async = require('async');

var bcrypt = require('bcryptjs'); // Encryption for password
const passport = require('passport'); // Handles login ?
const {ensureAuthenticated} = require('./models/Auth.js') // Authentication for login ?
const User = require('./models/User'); // Schema for User using mongoose
const Post = require('./models/Post');
const Request = require('./models/Request'); // Friend Requests
// const Chat = require('./models/chat') // Handles chat login

mongoose.set('debug', true);


var http = require('http');
var socketIO = require('socket.io'); // For live connection when doing live chat
const { request } = require('express');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);


app.set('view engine', 'ejs'); // Set .ejs as static file, will automatically look into views folder for .ejs

app.use(express.urlencoded({ extended: false }));
app.use(express.static(__dirname + '/public')); // Set public as folder for static file (css)
app.use(session({
  secret: 'secret',
  resave: true,
  saveUninitialized:true
}));

/////// <some description>
app.use(passport.initialize());
app.use(passport.session());
require("./models/Passport")(passport);

/////// <some description>
app.use(flash());
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
next();
})

/////// Connect to MongoDB
// originalDBURL = 'mongodb://mongo:27017/docker-node' //connection to local container mongo through port 27017 
// chrisDBURL = 'mongodb+srv://user11:Shengjin1@cluster0.dxk2z.mongodb.net/myFirstDatabase?retryWrites=true&w=majority'
joshDBURL = 'mongodb+srv://guest:guest@cluster0.fjr7b.mongodb.net/myFirstDatabase?retryWrites=true&w=majority'
mongoose
  .connect( 
    joshDBURL,
    { useNewUrlParser: true,useUnifiedTopology: true}
  )
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));



/////// Access URL controller
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

app.get('/logout', (req, res)=>{
  u = req.user;
  u.active = false;
  u.save();
  req.logout();
  req.flash('success_msg','You have now logged out!');
  res.redirect('/')
})

app.get('/chat', ensureAuthenticated, (req, res) => {
  //res.sendFile(path.join(__dirname, 'views', 'chat.html'));
  user_data = { // dummy data 
    name : "Dummy_user"
  }
  res.render('chat',{user_data})
  // var user_name = 'dummy'
  // console.log('chat page')
});

///// SocketIO listen to connection when client call io()
io.on('connection', function(socket) { 
  // Emit welcome message to current user
  console.log("Detect connection from: ", socket.id);

  // Listen for message from 
  // socket.on('message', handleMessage(message));
  socket.on('message', function(data) {
    console.log(data);
    io.emit('incoming-message', data); 
    // handleMessage(user_id, message);
  });

  socket.on('disconnect', function(){
    console.log("Disconnection from: ", socket.id);
    // io.emit('message', handleMessage('', user_name + ' is offline!!')) // emits message to everyone
  });
});

/////// Post to URL controller
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



// PROFILE

// Get "My" profile when Auntheticated
// Ensure only "My" posts are displayed

app.get('/profile', ensureAuthenticated, (req, res) => {

  u = req.user;

  Post.find({owner: u._id})
    .then(posts => res.render('profile_page.ejs', { posts, user:u }))
    .catch(err => res.status(404).json({ msg: 'No Posts found' }));

});


// Submit a Post to "My" profile when Authenticated
// TO-DO: Set Post privacy

app.post('/profile/post', ensureAuthenticated, (req, res) => {

  u = req.user;

  const newPost = new Post({
    Title: req.body.Title,
    Body: req.body.Body,
    owner: u._id,
    privacy: req.body.privacy
  })

  newPost.save().then(post => res.redirect('/profile'));

});



// FRIENDS PAGE
// Shows Friends of a Current User
app.get('/friends', ensureAuthenticated, (req, res) => {

  u = req.user;
  u_id = u._id
  
  // TO-DO: Display Users That contain My ID in their friend's list

  User.find({"friends_list": u_id})
      .then(users => res.render('friends.ejs',{ users, user:u }))

})

// Add a friend (NO REQUEST)
app.post('/friends/add', ensureAuthenticated, async (req, res) => {
  
  u = req.user;
  var requested_user_email = req.body.receiver_id;

  // Find a Requested User's ID by Email:

  const friend_lookup = await User.findOne(
    { "email": requested_user_email}
  )

  // console.log("Requested User's Email: ", requested_user_email);
  // console.log("Requested User's ObjectID: ", friend_lookup._id);

  // // Create a new Request Object
  // // Fill processed information
  // const friend_req = new Request({
  //   sender_id: u._id,
  //   receiver_id: friend_lookup._id,
  //   req_status: 1 // Status: Request PENDING
  // })

  const user1 = await User.findById(u._id);
  const user2 = await User.findById(friend_lookup._id);

  await user1.friends_list.push(friend_lookup._id);
  await user2.friends_list.push(u._id);

  console.log(user1);
  console.log(user2);


  console.log("Friend Request Sent to: ", friend_lookup.fname, " " ,friend_lookup.lname, " with ID: ", friend_lookup._id);

  await user1.save();
  await user2.save().then(request => res.redirect('/friends'))
    .catch(err => res.status(404).json({ msg: 'No User found' }));

})


// Accept Incoming request (UNUSED)
// app.post('/friends/add/accept', ensureAuthenticated, async (req, res) => {

//   // Incoming request has sender_id, receiver_id, status
//   // Find the Existing Request and Update status with Response
//   // Update Both user's friendships based on response

//   u = req.user;

//   console.log("Query variabless:", req.query);

//   const request = await Request.findOne({receiver_id: u._id, sender_id: friend_id})
//   .exec(async function(err, request){
//     if(err){return handleError(err)}
//     try{
//       const user1 = await User.findById(u._id);
//       const user2 = await User.findById(friend_id);

//       console.log(request);
//       console.log(user1);
//       console.log(user2);

//       if(u._id !== friend_id){

//         await request.updateOne({ $set: {req_status: 2} });
//         await user1.friends_list.push(req.body.friend_id );
//         await user2.friends_list.push(u._id);

//         await user1.save()
//         await user2.save()
  
//         res.status(400)
//       }
//       else 
//       {
//         res.status(400)
//       }
//     }catch(err){console.log(err)}
//   })

//   // If Declined
//   // Set Status to 2 and update the Friendships for BOTH users

//   // Satisfy the request
//   // Update Request Object' Status
    

// })



// Check for Incoming Friend Requests
// UNUSED
app.get('/friends/requests', ensureAuthenticated, (req, res) => {

  u = req.user;
  
  User.find({"friend_reqs." : u._id})

  // Looks up PENDING (1) requests sent in my name
  // Return 404 if nothing found
  Request.find({receiver_id : u._id, req_status: 1})
    .then(requests => res.render('request_check.ejs',{requests, user:u }))
    .catch(err => res.status(404).json({ msg: 'No Requests Found' }));

})




const PORT = 3000; //Port of backend container

server.listen(PORT, () => console.log('Server running...'));
