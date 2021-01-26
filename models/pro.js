const mongoose = require('mongoose');

//

const Schema = mongoose.Schema;

const proSchema = new Schema({
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  loanFileIds: [
    { type: Schema.Types.ObjectId, ref: 'LoanFile', required: true },
  ],
});

module.exports = mongoose.model('Pro', proSchema);
