const mongoose = require('mongoose');

//

const Schema = mongoose.Schema;

const documentSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  doctypeId: {
    type: Schema.Types.ObjectId,
    ref: 'Doctype',
    required: true,
  },
  fileUrl: {
    type: String,
    required: true,
  },
  issuanceDate: { type: Date },
  expirationDate: { type: Date },
  month: {
    type: Number,
    min: 1,
    max: 12,
  },
  year: {
    type: Number,
    max: new Date().getFullYear(),
  },
});

module.exports = mongoose.model('Document', documentSchema);
