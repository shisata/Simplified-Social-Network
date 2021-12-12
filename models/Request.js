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

    // Request statuses
    req_status: {
        type: Number,
        enums: [
            1,    // Pending
            2,    // Friends
        ]
    }

})
module.exports = mongoose.model('friend_request',requestSchema)
