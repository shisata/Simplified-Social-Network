const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Comment Represntation Schema
// Used for Posts

const commentSchema = new Schema({
    
  // ObjectID attached automatically as _id

  // Sender User Id
  user_id:{
    type: mongoose.ObjectId,
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
