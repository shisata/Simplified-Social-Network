//// File description: Schema for User in MongoDB
const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const requestSchema = new Schema({

    // Sending User
    user1_id:{
        type:String,
        required: true
    },

    // Receiving User
    user2_id:{
        type:String,
        required: true
    },

    // Set for sending User
    user1_agree:{
        type:Boolean,
        required: true
    },

    // Set for receiving User
    user2_agree:{
        type:Boolean,
        required: false
      }

})

module.exports = mongoose.model('friend_request',requestSchema)