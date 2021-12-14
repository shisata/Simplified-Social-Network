//// File description: Schema for User in MongoDB
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const MessageLog = require('./MessageLog');

const Request = require('./Request');

const UserSchema = new Schema({

  // ObjectID attribute is attached automatically as _id
  
  email:{
    type:String,
    required: true
  },
  password:{
    type:String,
  },
  fname:{
    type:String
  },
  lname:{
    type:String
  },
  date:{
    type:Date,
    default: Date.now
  },
  active:{ 
    type:Boolean,
    default: false
  },

  // // Keeping a friend list by Object IDs
  friends_list:{
    type: [mongoose.ObjectId],
  },

  // Friend Requests
  friend_requests:{
    type: [mongoose.ObjectId],
    default:[]
  },

  // Post IDs belonging to a user
  posts:{
    type: [mongoose.ObjectId],
  },

  // Message logs for conversation with each user (each message_log has many message transactions)
  message_logs:{
    type: [mongoose.ObjectId],
  },

  // Stories IDs posted by this user
  stories:{
    type: [mongoose.ObjectId],
  },

  // Chat rooms that user is currently in (each chat room is an id of the friend user is chatting with)
  chat_rooms:{
    type: [{type: Schema.Types.ObjectId, ref: 'chatroom'}],
  },

  // Setting ObjectId for the current user
  setting:{
    type: mongoose.ObjectId
  },


})



module.exports = User = mongoose.model('user', UserSchema);
