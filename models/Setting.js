const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const settingSchema = new Schema({
    
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
