const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Comment Represntation Schema

const commentSchema = new Schema({
    
  // ObjectID attached automatically as _id

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
