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

var async = require('async');

var bcrypt = require('bcryptjs'); // Encryption for password
const passport = require('passport'); // Handles login ?
const {ensureAuthenticated} = require('./models/Auth.js') // Authentication for login ?
const User = require('./models/User'); // Schema for User using mongoose
const Post = require('./models/Post');
const Comment = require('./models/Comment');

// const Chat = require('./models/chat') // Handles chat logic
const MessageLog = require('./models/MessageLog');
const Message = require('./models/Message');

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

/////// Support functions

// Return a list of friends with their info on it
async function getFriendsInfo(user){
  var friends = [];
  for(var i = 0; i < user.friends_list.length; i++){
    try{
      const friend = await User.findById(user.friends_list[i].toString());
      // In case _id doesn't belong to any account 
      if(friend){
        friends.push({
          _id: friend._id,
          email: friend.email,
          fname: friend.fname,
          lname: friend.lname
        })
      } 
    }  catch (err){console.log(err)}
  }
  return friends;
}

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

  //find all visible posts that are public, from friends, or yourself
  Post
  .find({$or: [{privacy:"public"},{privacy:"friends",owner:{$in:u.friends_list}},{privacy:{$in:["private","friends"]},owner:u._id}]})
  .sort({date:-1})
  .then(posts=>{
    Comment.find().sort({date:-1}).then(comments=>{
      User.find().then(async users=>{
        let comment_map = {};
        comments.forEach(comment => {comment_map[comment._id]=comment});
        //console.log(comment_dict);
        console.log("=====before user_map======")
        let user_map = {};
        users.forEach(user => {user_map[user._id]=user});
        console.log("=====before getFriendsInfo======")
        const friends = await getFriendsInfo(u)
        console.log("=====after getFriendsInfo======")

        console.log("===>users: ", users) 
        console.log("===>user_map: ",  user_map) 
        console.log("===>friends: ", friends)

        // Fixed conflict admin.ejs due to same name (users != user_map)
        res.render('admin',{
          posts: posts,
          users: users, // List of users
          user_map: user_map, 
          user: u,
          friends_list: friends,
          comments: comment_map})
      });
    });
  });
  
  //.then(users => parameters[]=user)
});

app.post('/admin/like',(req, res)=>{
  u = req.user;
  let mode = "like";
  //console.log("post_id: user: ",req.body.post_id,u);
  Post.findOne({_id:req.body.post_id}).then(p=>{
    if (!p.likes.includes(u._id)){ //check if user has already liked the post
      p.likes.push(u._id);         //add like to post if it has been liked
      mode = "unlike";
    } else {
      var i = p.likes.indexOf(u._id);
      while (i >= 0){
        p.likes.splice(i,1);
        i = p.likes.indexOf(u._id);
      }
      mode = "like";
    }
    console.log("# of likes: ",p.likes.length);
    p.save().then(post => res.send({likes:p.likes,mode:mode})); //send the list of likes back
  });
});

app.post('/admin/comment',(req, res)=>{
  u = req.user;
  Post.findOne({_id:req.body.post_id}).then(p=>{
    const newComment = new Comment({
      user_id: u._id,
      content: req.body.Content,
    });
    p.comments.push(newComment._id);
    console.log("comment user_id:",newComment.user_id);
    newComment.save();
    p.save().then(post => res.redirect('/admin'));
  }); //parent post of the comment
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
});

app.get('/chat', ensureAuthenticated, async (req, res)  => {
  u = req.user;
  console.log(u);
  // Find each friend data
  const friends = await getFriendsInfo(u);
  console.log(friends)
  res.render('chat_selection', {
    user: u, 
    friends_list: friends
  });
});

app.get('/chat/:id', ensureAuthenticated, async (req, res) => {
  var user = req.user;
  const user_id = user._id.toString()
  const other_id = req.params.id.toString();
  var message_log_id; // message_log between 2 users

  console.log(user)
  console.log("other_id: " + other_id)

  // Check if message_log is already established with the user that we are chatting with
  try{
    var message_log_exists = false;
    // Loop through all message_log id to look for the one with both users
    for(var i = 0; i < user.message_logs.length && message_log_exists == false; i++){
      const message_log = await MessageLog.findById(user.message_logs[i])
      const user1_id = message_log.user1_id.toString()
      const user2_id = message_log.user2_id.toString()

      if(user1_id == user_id && user2_id == other_id){
        message_log_exists = true;
        message_log_id = message_log._id;
      }else if(user2_id == user._id && user1_id == other_id){
        message_log_exists = true;
        message_log_id = message_log._id;
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
      message_log_id = message_log._id;


    }   
  } catch (err){console.log(err)}

    
  // Load all existing messages and render the page 
  try{
    const foundUser = await User.findById(user._id)
    const foundMessageLog = await MessageLog.findById(message_log_id)

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

    // Finding friends info for sidebar
    const friends = await getFriendsInfo(u);
    console.log("=====>friends: ", friends);

    res.render('chat', {
      user : foundUser, 
      user_names: u_names, 
      message_log: foundMessageLog,
      message_list: messages,
      friends_list: friends
    })

  } catch (err){console.log(err)}
})

///// SocketIO listen to connection when client call io()
io.on('connection', function(socket) { 
  // Emit welcome message to current user
  console.log("Detect connection from: ", socket.id);
  // chat room will be in array
  
  // await process to complete
  // check if client2 already in chat room with client1 (check DB)
  // client1 joins client2 room
  // create new chat room for client1 if client2 is not in chat room

  // Listen to client1 request that they are chatting with client2 
  socket.on('join-chatroom-request', async function(data){
    console.log("========join-chatroom-request==========")
    try{
      // Verify if 2 users match message_log (aka in correct chatroom)
      const message_log_id = data.message_log_id.toString();
      const user1_id = data.user1_id.toString();
      const user2_id = data.user2_id.toString();
      const message_log = await MessageLog.findById(message_log_id);
      console.log("Checkpoint!!!!")
      console.log(user1_id)
      console.log(message_log.user1_id.toString())
      console.log(user2_id)
      console.log(message_log.user2_id.toString())
      if(user1_id == message_log.user1_id.toString() && user2_id == message_log.user2_id.toString()){
        console.log(user1_id + " is joining room: " + message_log_id)
        socket.join(message_log_id);
        console.log("Checkpoint1!!!!")
      } else if(user1_id == message_log.user2_id.toString() && user2_id == message_log.user1_id.toString()){
        console.log(user1_id + " is joining room: " + message_log_id)
        socket.join(message_log_id);
        console.log("Checkpoint2!!!!")
      } else{
        console.log("Checkpoint3!!!!")
        throw ("Can't find both users id in message_log: ", message_log, user1_id, user2_id)
      }

    }catch(err){console.log("Error: " + err)}
    console.log("========join==========")
  });
  
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
      io.to(message_log._id.toString()).emit('incoming-message', {
        user_name: u_name,
        sender_id: message.sender_id,
        message: message.content
      })

      // socket.emit('incoming-message', {
      //   user_name: u_name,
      //   sender_id: message.sender_id,
      //   message: message.content
      // })

      console.log('replied back client about message')

    } catch(err){console.log(err)}
    
    // handleMessage(user_id, message);
  });

  // TODO: check if user is active and tell the friends

  // TODO: Listen to client1 disconnect request, remove client1 from chat room (on DB)
  socket.on('disconnect', function(){
    console.log("Disconnection from: ", socket.id);
    // io.emit('message', handleMessage('', user_name + ' is offline!!')) // emits message to everyone
  });
});

/////// Post to URL controller
app.post('/login', (req, res, next) => {
  console.log("=====Inside ap.post /login======")
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
    .then(async posts => {
      // Finding friends info for sidebar
      const friends = await getFriendsInfo(u);
      console.log("=====>friends: ", friends);

      res.render('profile_page.ejs', { 
        posts, 
        user: u,
        friends_list: friends,
      })
    })
    .catch(err => res.status(404).json({ msg: 'No Posts found' }));

});


// Submit a Post to "My" profile when Authenticated

app.post('/profile/post', ensureAuthenticated, async (req, res) => {
  u = req.user;
  const newPost = new Post({
    Title: req.body.Title,
    Body: req.body.Body,
    owner: u._id,
    privacy: req.body.privacy
  })

  newPost.save().then(post => {
    res.redirect('/profile')
  });
});



// FRIENDS PAGE
// Shows Friends of a Current User
app.get('/friends', ensureAuthenticated, (req, res) => {

  u = req.user;
  u_id = u._id
  
  // Display Users That contain My ID in their friend's list
  User.find({"friends_list": u_id})
      .then(async users => {
        // Finding friends info for sidebar
        const friends = await getFriendsInfo(u);
        console.log("=====>friends: ", friends);

        res.render('friends.ejs',{ 
          users, 
          user: u,
          friends_list: friends,
        })
      })

})

// Add a friend
app.post('/friends/add', ensureAuthenticated, async (req, res) => {
  
  u = req.user;
  var requested_user_email = req.body.receiver_id;

  // Find a Requested User's ID by Email:

  const friend_lookup = await User.findOne({"email": requested_user_email});

  // Make sure user is not adding themselves
  if(friend_lookup._id.toString() === u._id.toString()){
    console.log("Cannot Add Yourself as a friend!");
    return res.redirect('/friends')
  }

  console.log("Requested User's Email: ", requested_user_email);
  console.log("Requested User's ObjectID: ", friend_lookup._id);

  // Create a new Request Object
  // Fill processed information
  const friend_req = new Request({
    sender_id: u._id,
    receiver_id: friend_lookup._id,
    req_status: 1 // Status: Request PENDING
  })
  
  // Locate Users
  const user1 = await User.findById(u._id);
  const user2 = await User.findById(friend_lookup._id);

  // Push a new Request Object into Both User's request storages:
  await user1.friend_requests.push(friend_req._id);
  await user2.friends_list.push(friend_req._id);

  console.log("Friend Request Sent by Me to: ", friend_lookup.fname, " " ,friend_lookup.lname, " with ID: ", friend_lookup._id);

  // Request is not sent if User Does not exist
  await user1.save();
  await user2.save();
  await friend_req.save().then(request => res.redirect('/friends'))
    .catch(err => res.redirect('/friends'));

})


// Removes a friend selected in the menu.
app.post('/friends/remove', ensureAuthenticated, async (req, res) => {

  u = req.user;
  friend_id = req.body.friend_id;

  // Look up the Requested Friend ID
  const friend_lookup = await User.findOne({"email": friend_id});

  // Find both User objects
  const user1 = await User.findById(u._id);
  const user2 = await User.findById(friend_lookup._id);

  await user1.friends_list.pull(friend_lookup._id);
  await user2.friends_list.pull(u._id);

  await user1.save()
  await user2.save()

  res.redirect('/friends');
})


// Accept Incoming request
app.post('/friends/add/accept', ensureAuthenticated, async (req, res) => {

  // Incoming request has sender_id, receiver_id, status
  // Finds the Existing Request and Update status
  // Updates Both user's friendships based on response

  u = req.user;
  friend_id = req.body.friend_id;
  req_id = req.body.req_id;

  // Finds an Incoming Request with Status = 1 (PENDING)
  const request = await Request.findOne({"_id": req_id})
  .exec(async function(err, request){
    if(err){console.log(err)}
    try{

      // Find both User objects
      const user1 = await User.findById(u._id);
      const user2 = await User.findById(friend_id);

      console.log(request);
      console.log(user1);
      console.log(user2);

      // Make sure adding a different user, not myself
      if(u._id !== friend_id){

        // Update the Request Object Status to 2 (FRIENDS)
        await request.update({ $set: {req_status: 2} });

        // Update the friend lists on acceptance
        await user1.friends_list.push(req.body.friend_id );
        await user2.friends_list.push(u._id);

        await user1.save()
        await user2.save()
  
        res.redirect('/friends')
      }
      else 
      {
        res.redirect('/friends')
      }
    }catch(err){console.log(err)}
  })

})






// Decline Incoming request
app.post('/friends/add/decline', ensureAuthenticated, async (req, res) => {

  // Incoming request has sender_id, receiver_id, status
  // Finds the Existing Request and Update status
  // Updates Both user's friendships based on response

  u = req.user;
  friend_id = req.body.friend_id;
  req_id = req.body.req_id;

  // Finds an Incoming Request with Status = 1 (PENDING)
  const request = await Request.findOne({"_id": req_id})
  .exec(async function(err, request){
    if(err){console.log(err)}
    try{

      // Find both User objects
      const user1 = await User.findById(u._id);
      const user2 = await User.findById(friend_id);

      console.log(request);
      console.log(user1);
      console.log(user2);


      // Remove request for each user
      await user1.friend_requests.pull(req_id)
      await user2.friend_requests.pull(req_id)

      // Remove the request object completely
      await request.remove();

      await user1.save();
      await user2.save();

      res.redirect('/friends');


    }catch(err){console.log(err)}
  })

})



// Check for Incoming Friend Requests
app.get('/friends/requests', ensureAuthenticated, (req, res) => {

  u = req.user;
  
  User.find().then(users=>{
    Request.find({receiver_id : u._id, req_status: 1}).then(requests=>{
      res.render('request_check.ejs',{requests, user:u, all_users:users})
    })
  })

})



// Page in case user access wrong url
app.use((req, res) => {

  res.render('wrong_url', {wrong_url: req.url});

})
const PORT = 3000; //Port of backend container

server.listen(PORT, () => console.log('Server running...'));


