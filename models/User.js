//// File description: Schema for User in MongoDB
const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const UserSchema = new Schema({

  // ObjectID attribute is attached automatically as _id

  email:{
    type:String,
    required: true
  },
  password:{
    type:String,
    required: true
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

  // Keeping a friend list by Object IDs
  friends_list:{
    type: [mongoose.ObjectId],
    default:[]
  },

  // Post IDs belonging to a user
  posts:{
    type: [mongoose.ObjectId],
    default: []
  },

  // Message IDs sent by a user
  messages:{
    type: [mongoose.ObjectId],
    default: []
  },

  // Stories IDs posted by a user
  stories:{
    type: [mongoose.ObjectId],
    default: []
  },

  // Setting Object ID for a current user
  setting:{
    type: mongoose.ObjectId,
    required: true
  }

})
module.exports = User = mongoose.model('user', UserSchema);
