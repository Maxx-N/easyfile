const mongoose = require('mongoose');

//

const Schema = mongoose.Schema;

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  firstName: String,
  lastName: String,
  birthDate: Date,
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
  },
  address: String,
});

module.exports = mongoose.model('User', userSchema);
