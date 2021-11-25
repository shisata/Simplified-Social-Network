const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const UserSchema = new Schema({
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
  date :{
    type:Date,
    default: Date.now
  }

})
module.exports = User = mongoose.model('user', UserSchema);
