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
  gender: {
    type: String,
    enum: ['male', 'female', 'other', null],
  },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  birthDate: Date,
  address: String,
  phoneNumber: String,
  documentIds: [
    { type: Schema.Types.ObjectId, ref: 'Document', required: true },
  ],
  swapFolderIds: [
    { type: Schema.Types.ObjectId, ref: 'SwapFolder', required: true },
  ],
});

module.exports = mongoose.model('User', userSchema);
