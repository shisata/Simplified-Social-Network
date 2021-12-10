const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Single message included in MessageLog
const MessageSchema = new Schema({
  sender_id: {
    type: mongoose.ObjectId,
    required: true
  },

  content: {
    type: String,
    default: ""
  },

  date: {
    type: Date,
    default: Date.now
  },

})

module.exports = Message = mongoose.model('message', MessageSchema);
