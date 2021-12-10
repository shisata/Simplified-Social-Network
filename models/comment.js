const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Comment Represntation Schema

const commentSchema = new Schema({
    
  id:{
    type: Number,
    required: true
  },
  user_id:{
    type: Number,
    required: true
  },
  date:{
    type: Date
  },
  content:{
    type:String
  }
  
})
module.exports = Comment = mongoose.model('comment', commentSchema);
