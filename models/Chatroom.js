const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//// This Schema will record all messages between 2 users
const ChatroomSchema = new Schema({

  user1_id: {
    type: mongoose.ObjectId,
    required: true
  },

  user2_id: {
    type: mongoose.ObjectId,
    required: true
  },
})


module.exports = Chatroom = mongoose.model('chatroom', ChatroomSchema);
