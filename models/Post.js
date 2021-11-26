const mongoose = require('mongoose')
const Schema = mongoose.Schema;


const PostSchema = new Schema({
  Title: {
    type: String,
    required: true
  },

  Body: {
    type: String,
    required: true
  },

  date: {
    type: Date,
    default: Date.now
  }

  // Add Attachments
  // Count Likes
  // Store comments
  // Set Privacy

});

module.exports = mongoose.model('Posts',PostSchema)