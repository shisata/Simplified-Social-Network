const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Comment Represntation Schema

const settingSchema = new Schema({
    
  // ObjectID attached automatically as _id

  // Sender User Id
  theme:{
    type: String,
    default: 'default-theme'
  },
  email_notification:{
    type: Boolean,
    default: true
  },
})
module.exports = Setting = mongoose.model('setting', settingSchema);
