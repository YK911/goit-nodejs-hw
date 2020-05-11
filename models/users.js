const mongoose = require('mongoose');
mongoose.set('useFindAndModify', false);

const userSchema = new mongoose.Schema({
  email: {type: String, required: true},
  password: {type: String, required: true},
  subscription: {
    type: String,
    enum: ["free", "pro", "premium"],
    default: "free"
  },
  token: String
});

const User = mongoose.model('User', userSchema);

module.exports = User;