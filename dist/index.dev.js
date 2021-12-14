"use strict";

/****
General guideline for this project:
 - Put a comment in codes/functions declaration describing its purpose. Especially complicated ones.
 - Group functions/code in category so the code is easy to read
 - If you find some pieces of codes from someone that don't work for you, comment it out and add your modified code if the person is not aware of changes.
 - Put all backend .js files into models
 - Put all .ejs files into views
****/
////// Dependencies
var express = require('express');

var mongoose = require('mongoose');

var session = require('express-session');

var flash = require('connect-flash');

var passport = require('passport');

var path = require('path');

var bodyParser = require('body-parser');

var async = require('async');

var bcrypt = require('bcryptjs'); // Encryption for password


var _require = require('./models/Auth.js'),
    ensureAuthenticated = _require.ensureAuthenticated; // Authentication for login ?


var User = require('./models/User'); // Schema for User using mongoose


var Post = require('./models/Post');

var Comment = require('./models/Comment'); // const Chat = require('./models/chat') // Handles chat logic


var MessageLog = require('./models/MessageLog');

var Message = require('./models/Message');

var Request = require('./models/Request'); // Friend Requests
// const Chat = require('./models/chat') // Handles chat login


mongoose.set('debug', true);

var http = require('http');

var socketIO = require('socket.io'); // For live connection when doing live chat


var _require2 = require('express'),
    request = _require2.request;

var app = express();
var server = http.createServer(app);
var io = socketIO(server);
app.set('view engine', 'ejs'); // Set .ejs as static file, will automatically look into views folder for .ejs

app.use(express.urlencoded({
  extended: false
}));
app.use(express["static"](__dirname + '/public')); // Set public as folder for static file (css)

app.use(session({
  secret: 'secret',
  resave: true,
  saveUninitialized: true
})); /////// <some description>

app.use(passport.initialize());
app.use(passport.session());

require("./models/Passport")(passport); /////// <some description>


app.use(flash());
app.use(function (req, res, next) {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  next();
}); // Parse incoming request bodies in a middleware before handlers, available under the req.body property.

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extend: true
})); /////// Connect to MongoDB
// originalDBURL = 'mongodb://mongo:27017/docker-node' //connection to local container mongo through port 27017 
// chrisDBURL = 'mongodb+srv://user11:Shengjin1@cluster0.dxk2z.mongodb.net/myFirstDatabase?retryWrites=true&w=majority'

joshDBURL = 'mongodb+srv://guest:guest@cluster0.fjr7b.mongodb.net/myFirstDatabase?retryWrites=true&w=majority';
mongoose.connect(joshDBURL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(function () {
  return console.log('MongoDB Connected');
})["catch"](function (err) {
  return console.log(err);
}); /////// Support functions
// Return a list of friends with their info on it

function getFriendsInfo(user) {
  var friends, i, friend;
  return regeneratorRuntime.async(function getFriendsInfo$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          friends = [];
          i = 0;

        case 2:
          if (!(i < user.friends_list.length)) {
            _context.next = 16;
            break;
          }

          _context.prev = 3;
          _context.next = 6;
          return regeneratorRuntime.awrap(User.findById(user.friends_list[i].toString()));

        case 6:
          friend = _context.sent;

          // In case _id doesn't belong to any account 
          if (friend) {
            friends.push({
              _id: friend._id,
              email: friend.email,
              fname: friend.fname,
              lname: friend.lname
            });
          }

          _context.next = 13;
          break;

        case 10:
          _context.prev = 10;
          _context.t0 = _context["catch"](3);
          console.log(_context.t0);

        case 13:
          i++;
          _context.next = 2;
          break;

        case 16:
          return _context.abrupt("return", friends);

        case 17:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[3, 10]]);
} /////// Access URL controller


app.get('/', function (req, res) {
  res.render('index', {});
});
app.get('/register', function (req, res) {
  res.render('register', {});
});
app.get('/admin', ensureAuthenticated, function (req, res) {
  u = req.user;
  u.active = true;
  u.save(); //find all visible posts that are public, from friends, or yourself

  Post.find({
    $or: [{
      privacy: "public"
    }, {
      privacy: "friends",
      owner: {
        $in: u.friends_list
      }
    }, {
      privacy: {
        $in: ["private", "friends"]
      },
      owner: u._id
    }]
  }).sort({
    date: -1
  }).then(function (posts) {
    Comment.find().sort({
      date: -1
    }).then(function (comments) {
      User.find().then(function _callee(users) {
        var comment_map, user_map, friends;
        return regeneratorRuntime.async(function _callee$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                comment_map = {};
                comments.forEach(function (comment) {
                  comment_map[comment._id] = comment;
                }); //console.log(comment_dict);

                console.log("=====before user_map======");
                user_map = {};
                users.forEach(function (user) {
                  user_map[user._id] = user;
                });
                console.log("=====before getFriendsInfo======");
                _context2.next = 8;
                return regeneratorRuntime.awrap(getFriendsInfo(u));

              case 8:
                friends = _context2.sent;
                console.log("=====after getFriendsInfo======");
                console.log("===>users: ", users);
                console.log("===>user_map: ", user_map);
                console.log("===>friends: ", friends); // Fixed conflict admin.ejs due to same name (users != user_map)

                res.render('admin', {
                  posts: posts,
                  users: users,
                  // List of users
                  user_map: user_map,
                  user: u,
                  friends_list: friends,
                  comments: comment_map
                });

              case 14:
              case "end":
                return _context2.stop();
            }
          }
        });
      });
    });
  }); //.then(users => parameters[]=user)
});
app.post('/admin/like', function (req, res) {
  u = req.user;
  var mode = "like"; //console.log("post_id: user: ",req.body.post_id,u);

  Post.findOne({
    _id: req.body.post_id
  }).then(function (p) {
    if (!p.likes.includes(u._id)) {
      //check if user has already liked the post
      p.likes.push(u._id); //add like to post if it has been liked

      mode = "unlike";
    } else {
      var i = p.likes.indexOf(u._id);

      while (i >= 0) {
        p.likes.splice(i, 1);
        i = p.likes.indexOf(u._id);
      }

      mode = "like";
    }

    console.log("# of likes: ", p.likes.length);
    p.save().then(function (post) {
      return res.send({
        likes: p.likes,
        mode: mode
      });
    }); //send the list of likes back
  });
});
app.post('/admin/comment', function (req, res) {
  u = req.user;
  Post.findOne({
    _id: req.body.post_id
  }).then(function (p) {
    var newComment = new Comment({
      user_id: u._id,
      content: req.body.Content
    });
    p.comments.push(newComment._id);
    console.log("comment user_id:", newComment.user_id);
    newComment.save();
    p.save().then(function (post) {
      return res.redirect('/admin');
    });
  }); //parent post of the comment
});
app.get('/login', function (req, res) {
  res.render('login', {});
});
app.get('/logout', function (req, res) {
  u = req.user;
  u.active = false;
  u.save();
  req.logout();
  req.flash('success_msg', 'You have now logged out!');
  res.redirect('/');
});
app.get('/chat', ensureAuthenticated, function _callee2(req, res) {
  var friends;
  return regeneratorRuntime.async(function _callee2$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          u = req.user;
          console.log(u); // Find each friend data

          _context3.next = 4;
          return regeneratorRuntime.awrap(getFriendsInfo(u));

        case 4:
          friends = _context3.sent;
          console.log(friends);
          res.render('chat_selection', {
            user: u,
            friends_list: friends
          });

        case 7:
        case "end":
          return _context3.stop();
      }
    }
  });
});
app.get('/chat/:id', ensureAuthenticated, function _callee3(req, res) {
  var user, user_id, other_id, message_log_id, message_log_exists, i, message_log, user1_id, user2_id, _message_log, user1, user2, foundUser, foundMessageLog, u1, u1_name, u2, u2_name, u_names, messages, msg_list, found, message, friends;

  return regeneratorRuntime.async(function _callee3$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          user = req.user;
          user_id = user._id.toString();
          other_id = req.params.id.toString();
          // message_log between 2 users
          console.log(user);
          console.log("other_id: " + other_id); // Check if message_log is already established with the user that we are chatting with

          _context4.prev = 5;
          message_log_exists = false; // Loop through all message_log id to look for the one with both users

          i = 0;

        case 8:
          if (!(i < user.message_logs.length && message_log_exists == false)) {
            _context4.next = 19;
            break;
          }

          _context4.next = 11;
          return regeneratorRuntime.awrap(MessageLog.findById(user.message_logs[i]));

        case 11:
          message_log = _context4.sent;
          user1_id = message_log.user1_id.toString();
          user2_id = message_log.user2_id.toString();

          if (user1_id == user_id && user2_id == other_id) {
            message_log_exists = true;
            message_log_id = message_log._id;
          } else if (user2_id == user._id && user1_id == other_id) {
            message_log_exists = true;
            message_log_id = message_log._id;
          }

          console.log("Message_log: ", message_log);

        case 16:
          i++;
          _context4.next = 8;
          break;

        case 19:
          console.log("There was a message log? " + message_log_exists); // If no message_log exists, create a new one

          if (message_log_exists) {
            _context4.next = 39;
            break;
          }

          _message_log = new MessageLog({
            user1_id: user_id,
            // Current user id
            user2_id: other_id // Other user id retrieved from url

          }); // Add message_log id to both users

          _context4.next = 24;
          return regeneratorRuntime.awrap(User.findById(user_id));

        case 24:
          user1 = _context4.sent;
          _context4.next = 27;
          return regeneratorRuntime.awrap(User.findById(other_id));

        case 27:
          user2 = _context4.sent;
          _context4.next = 30;
          return regeneratorRuntime.awrap(user1.message_logs.push(_message_log));

        case 30:
          _context4.next = 32;
          return regeneratorRuntime.awrap(user2.message_logs.push(_message_log));

        case 32:
          _context4.next = 34;
          return regeneratorRuntime.awrap(user1.save());

        case 34:
          _context4.next = 36;
          return regeneratorRuntime.awrap(user2.save());

        case 36:
          _context4.next = 38;
          return regeneratorRuntime.awrap(_message_log.save());

        case 38:
          message_log_id = _message_log._id;

        case 39:
          _context4.next = 44;
          break;

        case 41:
          _context4.prev = 41;
          _context4.t0 = _context4["catch"](5);
          console.log(_context4.t0);

        case 44:
          _context4.prev = 44;
          _context4.next = 47;
          return regeneratorRuntime.awrap(User.findById(user._id));

        case 47:
          foundUser = _context4.sent;
          _context4.next = 50;
          return regeneratorRuntime.awrap(MessageLog.findById(message_log_id));

        case 50:
          foundMessageLog = _context4.sent;
          _context4.next = 53;
          return regeneratorRuntime.awrap(User.findById(foundMessageLog.user1_id));

        case 53:
          u1 = _context4.sent;
          u1_name = {
            fname: u1.fname,
            lname: u1.lname
          };
          _context4.next = 57;
          return regeneratorRuntime.awrap(User.findById(foundMessageLog.user2_id));

        case 57:
          u2 = _context4.sent;
          u2_name = {
            fname: u2.fname,
            lname: u2.lname
          };
          u_names = {
            user1_name: u1_name,
            user2_name: u2_name
          }; // Create a list of messages to send to client

          messages = [];
          msg_list = foundMessageLog.messages;
          i = 0;

        case 63:
          if (!(i < msg_list.length)) {
            _context4.next = 72;
            break;
          }

          _context4.next = 66;
          return regeneratorRuntime.awrap(Message.findById(msg_list[i]));

        case 66:
          found = _context4.sent;
          message = {
            sender_id: found.sender_id,
            content: found.content,
            date: found.date.toString()
          };
          messages.push(message);

        case 69:
          i++;
          _context4.next = 63;
          break;

        case 72:
          _context4.next = 74;
          return regeneratorRuntime.awrap(getFriendsInfo(u));

        case 74:
          friends = _context4.sent;
          console.log("=====>friends: ", friends);
          res.render('chat', {
            user: foundUser,
            user_names: u_names,
            message_log: foundMessageLog,
            message_list: messages,
            friends_list: friends
          });
          _context4.next = 82;
          break;

        case 79:
          _context4.prev = 79;
          _context4.t1 = _context4["catch"](44);
          console.log(_context4.t1);

        case 82:
        case "end":
          return _context4.stop();
      }
    }
  }, null, null, [[5, 41], [44, 79]]);
}); ///// SocketIO listen to connection when client call io()

io.on('connection', function (socket) {
  // Emit welcome message to current user
  console.log("Detect connection from: ", socket.id); // chat room will be in array
  // await process to complete
  // check if client2 already in chat room with client1 (check DB)
  // client1 joins client2 room
  // create new chat room for client1 if client2 is not in chat room
  // Listen to client1 request that they are chatting with client2 

  socket.on('join-chatroom-request', function _callee4(data) {
    var message_log_id, user1_id, user2_id, message_log;
    return regeneratorRuntime.async(function _callee4$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            console.log("========join-chatroom-request==========");
            _context5.prev = 1;
            // Verify if 2 users match message_log (aka in correct chatroom)
            message_log_id = data.message_log_id.toString();
            user1_id = data.user1_id.toString();
            user2_id = data.user2_id.toString();
            _context5.next = 7;
            return regeneratorRuntime.awrap(MessageLog.findById(message_log_id));

          case 7:
            message_log = _context5.sent;
            console.log("Checkpoint!!!!");
            console.log(user1_id);
            console.log(message_log.user1_id.toString());
            console.log(user2_id);
            console.log(message_log.user2_id.toString());

            if (!(user1_id == message_log.user1_id.toString() && user2_id == message_log.user2_id.toString())) {
              _context5.next = 19;
              break;
            }

            console.log(user1_id + " is joining room: " + message_log_id);
            socket.join(message_log_id);
            console.log("Checkpoint1!!!!");
            _context5.next = 27;
            break;

          case 19:
            if (!(user1_id == message_log.user2_id.toString() && user2_id == message_log.user1_id.toString())) {
              _context5.next = 25;
              break;
            }

            console.log(user1_id + " is joining room: " + message_log_id);
            socket.join(message_log_id);
            console.log("Checkpoint2!!!!");
            _context5.next = 27;
            break;

          case 25:
            console.log("Checkpoint3!!!!");
            throw "Can't find both users id in message_log: ", message_log, user1_id, user2_id;

          case 27:
            _context5.next = 32;
            break;

          case 29:
            _context5.prev = 29;
            _context5.t0 = _context5["catch"](1);
            console.log("Error: " + _context5.t0);

          case 32:
            console.log("========join==========");

          case 33:
          case "end":
            return _context5.stop();
        }
      }
    }, null, null, [[1, 29]]);
  }); // Listen for message from user and push it to current message log user is using
  // Then tell user to check for new update

  socket.on('message', function _callee5(data) {
    var message_log, message, _u, u_name;

    return regeneratorRuntime.async(function _callee5$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            console.log("receive message from user: ");
            console.log(data);
            _context6.prev = 2;
            _context6.next = 5;
            return regeneratorRuntime.awrap(MessageLog.findById(data.message_log_id));

          case 5:
            message_log = _context6.sent;
            console.log(message_log); // Create new Message and save to MessageLog

            message = new Message({
              sender_id: data.sender_id,
              content: data.message
            });
            _context6.next = 10;
            return regeneratorRuntime.awrap(message_log.messages.push(message));

          case 10:
            _context6.next = 12;
            return regeneratorRuntime.awrap(message.save());

          case 12:
            _context6.next = 14;
            return regeneratorRuntime.awrap(message_log.save());

          case 14:
            _context6.next = 16;
            return regeneratorRuntime.awrap(User.findById(message.sender_id));

          case 16:
            _u = _context6.sent;
            u_name = {
              fname: _u.fname,
              lname: _u.lname
            }; // notify both client1 and client2 that new message is coming

            io.to(message_log._id.toString()).emit('incoming-message', {
              user_name: u_name,
              sender_id: message.sender_id,
              message: message.content
            }); // socket.emit('incoming-message', {
            //   user_name: u_name,
            //   sender_id: message.sender_id,
            //   message: message.content
            // })

            console.log('replied back client about message');
            _context6.next = 25;
            break;

          case 22:
            _context6.prev = 22;
            _context6.t0 = _context6["catch"](2);
            console.log(_context6.t0);

          case 25:
          case "end":
            return _context6.stop();
        }
      }
    }, null, null, [[2, 22]]);
  }); // TODO: check if user is active and tell the friends
  // TODO: Listen to client1 disconnect request, remove client1 from chat room (on DB)

  socket.on('disconnect', function () {
    console.log("Disconnection from: ", socket.id); // io.emit('message', handleMessage('', user_name + ' is offline!!')) // emits message to everyone
  });
}); /////// Post to URL controller

app.post('/login', function (req, res, next) {
  console.log("=====Inside ap.post /login======");
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
}); // PROFILE
// Get "My" profile when Auntheticated
// Ensure only "My" posts are displayed

app.get('/profile', ensureAuthenticated, function (req, res) {
  u = req.user;
  Post.find({
    owner: u._id
  }).then(function _callee6(posts) {
    var friends;
    return regeneratorRuntime.async(function _callee6$(_context7) {
      while (1) {
        switch (_context7.prev = _context7.next) {
          case 0:
            _context7.next = 2;
            return regeneratorRuntime.awrap(getFriendsInfo(u));

          case 2:
            friends = _context7.sent;
            console.log("=====>friends: ", friends);
            res.render('profile_page.ejs', {
              posts: posts,
              user: u,
              friends_list: friends
            });

          case 5:
          case "end":
            return _context7.stop();
        }
      }
    });
  })["catch"](function (err) {
    return res.status(404).json({
      msg: 'No Posts found'
    });
  });
}); // Submit a Post to "My" profile when Authenticated

app.post('/profile/post', ensureAuthenticated, function _callee7(req, res) {
  var newPost;
  return regeneratorRuntime.async(function _callee7$(_context8) {
    while (1) {
      switch (_context8.prev = _context8.next) {
        case 0:
          u = req.user;
          newPost = new Post({
            Title: req.body.Title,
            Body: req.body.Body,
            owner: u._id,
            privacy: req.body.privacy
          });
          newPost.save().then(function (post) {
            res.redirect('/profile');
          });

        case 3:
        case "end":
          return _context8.stop();
      }
    }
  });
}); // FRIENDS PAGE
// Shows Friends of a Current User

app.get('/friends', ensureAuthenticated, function (req, res) {
  u = req.user;
  u_id = u._id; // Display Users That contain My ID in their friend's list

  User.find({
    "friends_list": u_id
  }).then(function _callee8(users) {
    var friends;
    return regeneratorRuntime.async(function _callee8$(_context9) {
      while (1) {
        switch (_context9.prev = _context9.next) {
          case 0:
            _context9.next = 2;
            return regeneratorRuntime.awrap(getFriendsInfo(u));

          case 2:
            friends = _context9.sent;
            console.log("=====>friends: ", friends);
            res.render('friends.ejs', {
              users: users,
              user: u,
              friends_list: friends
            });

          case 5:
          case "end":
            return _context9.stop();
        }
      }
    });
  });
}); // Add a friend

app.post('/friends/add', ensureAuthenticated, function _callee9(req, res) {
  var requested_user_email, friend_lookup, friend_req, user1, user2;
  return regeneratorRuntime.async(function _callee9$(_context10) {
    while (1) {
      switch (_context10.prev = _context10.next) {
        case 0:
          u = req.user;
          requested_user_email = req.body.receiver_id; // Find a Requested User's ID by Email:

          _context10.next = 4;
          return regeneratorRuntime.awrap(User.findOne({
            "email": requested_user_email
          }));

        case 4:
          friend_lookup = _context10.sent;

          if (!(friend_lookup._id.toString() === u._id.toString())) {
            _context10.next = 8;
            break;
          }

          console.log("Cannot Add Yourself as a friend!");
          return _context10.abrupt("return", res.redirect('/friends'));

        case 8:
          console.log("Requested User's Email: ", requested_user_email);
          console.log("Requested User's ObjectID: ", friend_lookup._id); // Create a new Request Object
          // Fill processed information

          friend_req = new Request({
            sender_id: u._id,
            receiver_id: friend_lookup._id,
            req_status: 1 // Status: Request PENDING

          }); // Locate Users

          _context10.next = 13;
          return regeneratorRuntime.awrap(User.findById(u._id));

        case 13:
          user1 = _context10.sent;
          _context10.next = 16;
          return regeneratorRuntime.awrap(User.findById(friend_lookup._id));

        case 16:
          user2 = _context10.sent;
          _context10.next = 19;
          return regeneratorRuntime.awrap(user1.friend_requests.push(friend_req._id));

        case 19:
          _context10.next = 21;
          return regeneratorRuntime.awrap(user2.friends_list.push(friend_req._id));

        case 21:
          console.log("Friend Request Sent by Me to: ", friend_lookup.fname, " ", friend_lookup.lname, " with ID: ", friend_lookup._id); // Request is not sent if User Does not exist

          _context10.next = 24;
          return regeneratorRuntime.awrap(user1.save());

        case 24:
          _context10.next = 26;
          return regeneratorRuntime.awrap(user2.save());

        case 26:
          _context10.next = 28;
          return regeneratorRuntime.awrap(friend_req.save().then(function (request) {
            return res.redirect('/friends');
          })["catch"](function (err) {
            return res.redirect('/friends');
          }));

        case 28:
        case "end":
          return _context10.stop();
      }
    }
  });
}); // Removes a friend selected in the menu.

app.post('/friends/remove', ensureAuthenticated, function _callee10(req, res) {
  var friend_lookup, user1, user2;
  return regeneratorRuntime.async(function _callee10$(_context11) {
    while (1) {
      switch (_context11.prev = _context11.next) {
        case 0:
          u = req.user;
          friend_id = req.body.friend_id; // Look up the Requested Friend ID

          _context11.next = 4;
          return regeneratorRuntime.awrap(User.findOne({
            "email": friend_id
          }));

        case 4:
          friend_lookup = _context11.sent;
          _context11.next = 7;
          return regeneratorRuntime.awrap(User.findById(u._id));

        case 7:
          user1 = _context11.sent;
          _context11.next = 10;
          return regeneratorRuntime.awrap(User.findById(friend_lookup._id));

        case 10:
          user2 = _context11.sent;
          _context11.next = 13;
          return regeneratorRuntime.awrap(user1.friends_list.pull(friend_lookup._id));

        case 13:
          _context11.next = 15;
          return regeneratorRuntime.awrap(user2.friends_list.pull(u._id));

        case 15:
          _context11.next = 17;
          return regeneratorRuntime.awrap(user1.save());

        case 17:
          _context11.next = 19;
          return regeneratorRuntime.awrap(user2.save());

        case 19:
          res.redirect('/friends');

        case 20:
        case "end":
          return _context11.stop();
      }
    }
  });
}); // Accept Incoming request

app.post('/friends/add/accept', ensureAuthenticated, function _callee12(req, res) {
  var request;
  return regeneratorRuntime.async(function _callee12$(_context13) {
    while (1) {
      switch (_context13.prev = _context13.next) {
        case 0:
          // Incoming request has sender_id, receiver_id, status
          // Finds the Existing Request and Update status
          // Updates Both user's friendships based on response
          u = req.user;
          friend_id = req.body.friend_id;
          req_id = req.body.req_id; // Finds an Incoming Request with Status = 1 (PENDING)

          _context13.next = 5;
          return regeneratorRuntime.awrap(Request.findOne({
            "_id": req_id
          }).exec(function _callee11(err, request) {
            var user1, user2;
            return regeneratorRuntime.async(function _callee11$(_context12) {
              while (1) {
                switch (_context12.prev = _context12.next) {
                  case 0:
                    if (err) {
                      console.log(err);
                    }

                    _context12.prev = 1;
                    _context12.next = 4;
                    return regeneratorRuntime.awrap(User.findById(u._id));

                  case 4:
                    user1 = _context12.sent;
                    _context12.next = 7;
                    return regeneratorRuntime.awrap(User.findById(friend_id));

                  case 7:
                    user2 = _context12.sent;
                    console.log(request);
                    console.log(user1);
                    console.log(user2); // Make sure adding a different user, not myself

                    if (!(u._id !== friend_id)) {
                      _context12.next = 25;
                      break;
                    }

                    _context12.next = 14;
                    return regeneratorRuntime.awrap(request.update({
                      $set: {
                        req_status: 2
                      }
                    }));

                  case 14:
                    _context12.next = 16;
                    return regeneratorRuntime.awrap(user1.friends_list.push(req.body.friend_id));

                  case 16:
                    _context12.next = 18;
                    return regeneratorRuntime.awrap(user2.friends_list.push(u._id));

                  case 18:
                    _context12.next = 20;
                    return regeneratorRuntime.awrap(user1.save());

                  case 20:
                    _context12.next = 22;
                    return regeneratorRuntime.awrap(user2.save());

                  case 22:
                    res.redirect('/friends');
                    _context12.next = 26;
                    break;

                  case 25:
                    res.redirect('/friends');

                  case 26:
                    _context12.next = 31;
                    break;

                  case 28:
                    _context12.prev = 28;
                    _context12.t0 = _context12["catch"](1);
                    console.log(_context12.t0);

                  case 31:
                  case "end":
                    return _context12.stop();
                }
              }
            }, null, null, [[1, 28]]);
          }));

        case 5:
          request = _context13.sent;

        case 6:
        case "end":
          return _context13.stop();
      }
    }
  });
});

require('./gg.js');

app.get('/auth/google', function (req, res, next) {
  passport.authenticate('google', {
    scope: ['https://www.googleapis.com/auth/userinfo.email']
  })(req, res, next);
});
app.get('/auth/google/callback', function (req, res, next) {
  passport.authenticate('google', {
    successRedirect: '/admin',
    failureRedirect: '/login',
    failureFlash: true
  })(req, res, next);
}); // Decline Incoming request

app.post('/friends/add/decline', ensureAuthenticated, function _callee14(req, res) {
  var request;
  return regeneratorRuntime.async(function _callee14$(_context15) {
    while (1) {
      switch (_context15.prev = _context15.next) {
        case 0:
          // Incoming request has sender_id, receiver_id, status
          // Finds the Existing Request and Update status
          // Updates Both user's friendships based on response
          u = req.user;
          friend_id = req.body.friend_id;
          req_id = req.body.req_id; // Finds an Incoming Request with Status = 1 (PENDING)

          _context15.next = 5;
          return regeneratorRuntime.awrap(Request.findOne({
            "_id": req_id
          }).exec(function _callee13(err, request) {
            var user1, user2;
            return regeneratorRuntime.async(function _callee13$(_context14) {
              while (1) {
                switch (_context14.prev = _context14.next) {
                  case 0:
                    if (err) {
                      console.log(err);
                    }

                    _context14.prev = 1;
                    _context14.next = 4;
                    return regeneratorRuntime.awrap(User.findById(u._id));

                  case 4:
                    user1 = _context14.sent;
                    _context14.next = 7;
                    return regeneratorRuntime.awrap(User.findById(friend_id));

                  case 7:
                    user2 = _context14.sent;
                    console.log(request);
                    console.log(user1);
                    console.log(user2); // Remove request for each user

                    _context14.next = 13;
                    return regeneratorRuntime.awrap(user1.friend_requests.pull(req_id));

                  case 13:
                    _context14.next = 15;
                    return regeneratorRuntime.awrap(user2.friend_requests.pull(req_id));

                  case 15:
                    _context14.next = 17;
                    return regeneratorRuntime.awrap(request.remove());

                  case 17:
                    _context14.next = 19;
                    return regeneratorRuntime.awrap(user1.save());

                  case 19:
                    _context14.next = 21;
                    return regeneratorRuntime.awrap(user2.save());

                  case 21:
                    res.redirect('/friends');
                    _context14.next = 27;
                    break;

                  case 24:
                    _context14.prev = 24;
                    _context14.t0 = _context14["catch"](1);
                    console.log(_context14.t0);

                  case 27:
                  case "end":
                    return _context14.stop();
                }
              }
            }, null, null, [[1, 24]]);
          }));

        case 5:
          request = _context15.sent;

        case 6:
        case "end":
          return _context15.stop();
      }
    }
  });
}); // Check for Incoming Friend Requests

app.get('/friends/requests', ensureAuthenticated, function (req, res) {
  u = req.user;
  User.find().then(function (users) {
    Request.find({
      receiver_id: u._id,
      req_status: 1
    }).then(function (requests) {
      res.render('request_check.ejs', {
        requests: requests,
        user: u,
        all_users: users
      });
    });
  });
}); // Page in case user access wrong url

app.use(function (req, res) {
  res.render('wrong_url', {
    wrong_url: req.url
  });
});
var PORT = 3000; //Port of backend container

server.listen(PORT, function () {
  return console.log('Server running...');
});