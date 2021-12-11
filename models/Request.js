const mongoose = require('mongoose');
const Schema = mongoose.Schema;


// Friend request Object 

const requestSchema = new Schema({

    // Sending User
    sender_id:{
        type: mongoose.ObjectId,
        required: true
    },

    // Receiving User
    receiver_id:{
        type: mongoose.ObjectId,
        required: true
    },

    // Set for receiving User
    receiver_agree:{
        type:Boolean,
        required: false
      }

})
module.exports = mongoose.model('friend_request',requestSchema)
