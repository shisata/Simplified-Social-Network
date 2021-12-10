//// File description: Schema for User in MongoDB
const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const UserSchema = new Schema({
  id:{
    type: Number,
    required: true
  },
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
  friends_list:{
    type: Array,
    default:[],
  }
  
})
module.exports = User = mongoose.model('user', UserSchema);
