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
  documentIds: [
    { type: Schema.Types.ObjectId, ref: 'Document', required: true },
  ],
  loanFileIds: [
    { type: Schema.Types.ObjectId, ref: 'LoanFile', required: true },
  ],
});

module.exports = mongoose.model('User', userSchema);
