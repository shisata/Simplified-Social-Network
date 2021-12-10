const mongoose = require('mongoose')
const Schema = mongoose.Schema;


const PostSchema = new Schema({

  // Generated at creation
  id: {
    type: Number,
    required: true
  },

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

  // User IDs
  likes: {
    type: Array,
    default: []
  },

  // Comment IDs
  comments: {
    type: Array,
    default: []
  }

});

module.exports = mongoose.model('Posts',PostSchema)