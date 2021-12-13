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
const bodyParser = require('body-parser');

var bcrypt = require('bcryptjs'); // Encryption for password
const passport = require('passport'); // Handles login ?
const {ensureAuthenticated} = require('./models/Auth.js') // Authentication for login ?
const User = require('./models/User'); // Schema for User using mongoose
const Post = require('./models/Post');
// const Chat = require('./models/chat') // Handles chat logic
const MessageLog = require('./models/MessageLog');
const Message = require('./models/Message');
const Request = require('./models/Request'); // Friend Requests
// const Chat = require('./models/chat') // Handles chat login

mongoose.set('debug', true);


var http = require('http');
var socketIO = require('socket.io'); // For live connection when doing live chat

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

// Parse incoming request bodies in a middleware before handlers, available under the req.body property.
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extend: true
}))

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
  console.log(u);
  u.active = true;
  u.save();

  //let parameters = new Object();
  //parameters["user"] = u;

  Post.find().sort({date:-1}).then(posts=>{
    User.find().then(users=>{
      res.render('admin',{posts:posts,users:users,user:u})
    });
  });

    //.then(users => parameters[]=user)

  
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

app.get('/chat', ensureAuthenticated, async (req, res)  => {
  u = req.user;
  console.log(u);
  // Find each friend data
  var friends = [];
  for(var i = 0; i < u.friends_list.length; i++){
    const friend = await User.findById(u.friends_list[i]);
    // TODO: find last message, sender and date
    friends.push({
      _id: friend._id,
      email: friend.email,
      fname: friend.fname,
      lname: friend.lname
    })
  }
  console.log(friends)
  res.render('chat_selection', {user: u, friends_list: friends});
});

app.get('/chat/:id', ensureAuthenticated, async (req, res) => {
  console.log("///////////////////Current User////////////////////")
  var user = req.user;
  const user_id = user._id.toString()
  const other_id = req.params.id.toString();

  console.log(user)
  console.log("other_id: " + other_id)

  // Check if message_log is already established with the user that we are chatting with
  console.log("///////////////////Check Message_log////////////////////")
  try{
    var message_log_exists = false;
    // Loop through all message_log id to look for the one with both users
    for(var i = 0; i < user.message_logs.length && message_log_exists == false; i++){
      const message_log = await MessageLog.findById(user.message_logs[i])
      const user1_id = message_log.user1_id.toString()
      const user2_id = message_log.user2_id.toString()

      if(user1_id == user_id && user2_id == other_id){
        message_log_exists = true;
      }else if(user2_id == user._id && user1_id == other_id){
        message_log_exists = true;
      }
      console.log("Message_log: ", message_log)
    }
    
    console.log("There was a message log? " + message_log_exists);
    // If no message_log exists, create a new one
    if(!message_log_exists){
      const message_log = new MessageLog({
        user1_id: user_id, // Current user id
        user2_id: other_id, // Other user id retrieved from url
      })

      // Add message_log id to both users
      const user1 = await User.findById(user_id);
      const user2 = await User.findById(other_id);

      await user1.message_logs.push(message_log);
      await user2.message_logs.push(message_log);

      await user1.save();
      await user2.save();
      await message_log.save();

      console.log(console.log("////////////////////Created message log///////////////////"))
      console.log(user1)
      console.log(user2)
      console.log(message_log)
      console.log(console.log("////////////////////C///////////////////"))
    }   
  } catch (err){console.log(err)}
  console.log("///////////////////////////////////////")
    
  // Load all existing messages and render the page 
  try{
    // console.log("///////////////////Found User////////////////////")
    const foundUser = await User.findById(user._id)
    const foundMessageLog = await MessageLog.findById(foundUser.message_logs[0])
    const foundMessages = await Message.findById('61b58fc4f1dd72001239c97d')
    // await console.log(foundUser)
    // await console.log(foundMessageLog)
    // console.log("///////////////////////////////////////")
  
    // Pushing new message into log
    // awabit foundMessageLog.messages.push(foundMessages)
    // await foundMessageLog.save(function(err, result){
    //   if(err){console.log(err)}
    //   else{
    //     console.log(result)
    //   }
    // })

    // Find both users name to send to client
    const u1 = await User.findById(foundMessageLog.user1_id);
    const u1_name = {
      fname: u1.fname,
      lname: u1.lname
    }

    const u2 = await User.findById(foundMessageLog.user2_id);
    const u2_name = {
      fname: u2.fname,
      lname: u2.lname
    }
    
    const u_names = {
      user1_name: u1_name,
      user2_name: u2_name
    }

    // Create a list of messages to send to client
    var messages = []
    var msg_list = foundMessageLog.messages
    for (var i = 0; i < msg_list.length; i++){
      var found = await Message.findById(msg_list[i]);
      var message = {
        sender_id: found.sender_id,
        content: found.content,
        date: found.date.toString()
      }
      messages.push(message)
    }

    // await User
    //  .find({_id: '61b29a093f00ea001a3e70c2'})
    //  .populate('message_logs')
    //  .exec(function(err, user){
    //    if (err) {return handleError(err)}
    //    console.log(user);
    //   });


    // // Checking if messages in MessagesLog are schemas 
    // await MessageLog
    //  .findOne({_id: foundUser.message_logs[0], content: 'First message ever!!'})//()
    //  .populate('messages')
    //  .exec(function(err, message_log){
    //   if (err) {return handleError(err)}
    //   console.log(message_log);
    //  });

    // Checking if message_logs in User are schemas
    // await User
    //  .findOne()
    //  .populate()
    //  .exec(function(err, user){
    //   if (err) {return handleError(err)}
    //   console.log(user);
    //  });
    

    // console.log("///////////////////////////////////////")


    await res.render('chat', {
      user : foundUser, 
      user_names: u_names, 
      message_log: foundMessageLog,
      message_list: messages
    })

    // console.log("///////////////////After Push////////////////////")
    // console.log(await MessageLog.findById(foundUser.message_logs[0]))


    // MessageLog.findById('61b533f0323caf001474ea4f')
    // .populate()
    // .then((result) => {
    //   console.log(result.messages)
    // }).catch((err) => {console.log(err)})

  } catch (err){console.log(err)}
})

///// SocketIO listen to connection when client call io()
io.on('connection', function(socket) { 
  // Emit welcome message to current user
  console.log("Detect connection from: ", socket.id);
  // chat room will be in array

  // Listen to client1 request that they are chatting with client2 
  // await process to complete
    // check if client2 already in chat room with client1 (check DB)
      // client1 joins client2 room
    // create new chat room for client1 if client2 is not in chat room

    
  // Listen for message from user and push it to current message log user is using
  // Then tell user to check for new update
  socket.on('message', async function(data) {
    console.log("receive message from user: ");
    console.log(data);
    try{
      const message_log = await MessageLog.findById(data.message_log_id);
      console.log(message_log)

      // Create new Message and save to MessageLog
      const message = new Message({
        sender_id: data.sender_id,
        content: data.message
      });
      await message_log.messages.push(message)
      await message.save()
      await message_log.save()
      
      // Look for sender name
      const u = await User.findById(message.sender_id);
      const u_name = {
        fname: u.fname,
        lname: u.lname
      }

      // notify both client1 and client2 that new message is coming
      socket.emit('incoming-message', {
        user_name: u_name,
        sender_id: message.sender_id,
        message: message.content
      })
      // io.to("some room").emit('incoming-message', data);
      console.log('replied back client about message')

    } catch(err){console.log(err)}
    
    // handleMessage(user_id, message);
  });

  // TODO: Listen to client1 disconnect request, remove client1 from chat room (on DB)
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




// TO-DO
// Add a comment to a post



// FRIENDS PAGE

// Shows Friends of a Current User
app.get('/friends', ensureAuthenticated, (req, res) => {

  u = req.user;
  
  // TO-DO: Display Users contained in user.friends_list

  User.find({ "friends_list": u._id})
    .then(users => res.render('friends.ejs',{ users, user:u }))

})


// Make a friend request
app.post('/friends/add', ensureAuthenticated, async (req, res) => {
  
  u = req.user;
  var requested_user_email = req.body.receiver_id;


  // Find a Requested User's ID by Email:

  const friend_lookup = await User.findOne(
    { "email": requested_user_email}
  )

  console.log("Requested User's Email: ", requested_user_email);
  console.log("Requested User's ObjectID: ", friend_lookup._id);


  // Create a new Request Object
  // Fill processed information
  const friend_req = new Request({
    sender_id: u._id,
    receiver_id: friend_lookup._id,
    req_status: 1 // Status: Request PENDING
  })

  console.log("Friend Request Sent to: ", friend_lookup.fname, " " ,friend_lookup.lname, " with ID: ", friend_lookup._id);

  friend_req.save()
    .then(request => res.redirect('/friends'))
    .catch(err => res.status(404).json({ msg: 'No User found' }));

})


// Accept an incoming request
app.post('/friends/add/manage', ensureAuthenticated, async (req, res) => {

  // Incoming request has sender_id, receiver_id, status
  // Find the Existing Request and Update status with Response
  // Update Both user's friendships based on response

  u = req.user;
  friend_id = req.body.friend_id;
  response = req.body.response;
  
  
  // If Added
  // Set Status to 2 and update the Friendships for BOTH users

  if (response === 1) {

    // Satisfy the request
    // Update Request Object' Status
    Request.findOneAndUpdate({receiver_id: u._id, sender_id: friend_id},
      {req_status: 2}, 
      {upsert: true}
    )

    // TODO: Update BOTH User's Friendships
    User.findOneAndUpdate(
      {"_id": u._id}, {$push: {friends_list: friend_id}}
    )
     
    User.findOneAndUpdate(
      {"_id": friend_id}, {$push: {friends_list: friend_id}}
    )

  } 
  
  // If Declined
  // Remove Request Object
  // else{
  // }

  User.save()
    .then(request => res.redirect('/friends'))
    .catch(err => res.status(404).json({ msg: 'No User found' }));

})


// Remove an existing friend
// app.post('/friends/remove', ensureAuthenticated, (req, res) => {
// })

// app.get(/friends/search/), (req, res) => {

// })



// Check for Incoming Friend Requests
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
