const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Message = require('./Message')

//// This Schema will record all messages between 2 users
const MessageLogSchema = new Schema({

  user1_id: {
    type: mongoose.ObjectId,
    required: true
  },

  user2_id: {
    type: mongoose.ObjectId,
    required: true
  },

  messages: {
    type: [{type: Schema.Types.ObjectId, ref: 'message'}]
  }

})


module.exports = MessageLog = mongoose.model('message_log', MessageLogSchema);
