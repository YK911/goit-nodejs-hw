const mongoose = require('mongoose');
mongoose.set('useFindAndModify', false);

const userSchema = new mongoose.Schema({
  email: {type: String, required: true},
  password: {type: String, required: true},
  avatarURL: {type: String},
  subscription: {
    type: String,
    enum: ["free", "pro", "premium"],
    default: "free"
  },
  token: String,
  otpCode: String,
  registered: { type: Boolean, default: false }
});

const User = mongoose.model('User', userSchema);

module.exports = User;