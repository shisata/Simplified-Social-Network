//// Story Schema for each user, unfinnished, needs more fields
const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const StorySchema = new Schema({

  title:{
    type:String,
    required: true
  },

  // Expires after 24 hours 
  date:{
    type: Date,
    default: Date.now
  },

  // Story is archived (hidden) after expiration
  archived: {
    type: Boolean,
    default: false
  },

  // Temporary content, needs to have something else (Video, Image)
  content:{
    type: String,
    required: true
  },

  // list of user_id that have seen this story
  seen_list:{
    type: [mongoose.ObjectId],
    default:[]
  },

  privacy:{
    type: String,
    required: true
  }

})
module.exports = Story = mongoose.model('story', StorySchema);
