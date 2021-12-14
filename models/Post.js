const mongoose = require('mongoose')
const Schema = mongoose.Schema;


// Post Object

const PostSchema = new Schema({

  // ObjecID attribute is attached automatically as _id

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
  },

  // Public, Private or Friends Only
  privacy: {
    type: String,
    required: true
  },

  // Owner's ID
  owner: {
    type: mongoose.ObjectId,
    required: true
  },

  // User IDs
  likes: {
    type: [mongoose.ObjectId],
    default: []
  },

  // Comment IDs
  comments: {
    type: [mongoose.ObjectId],
    default: []
  }

});

module.exports = mongoose.model('Posts',PostSchema)