const mongoose = require('mongoose');

//

const Schema = mongoose.Schema;

const doctypeSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  periodicity: {
    type: String,
    enum: ['none', 'month', 'year'],
  },
  isUnique: {
    type: Boolean,
    required: true,
  },
  hasIssuanceDate: {
    type: Boolean,
    required: true,
  },
  hasExpirationDate: {
    type: Boolean,
    required: true,
  },
});

module.exports = mongoose.model('Doctype', doctypeSchema);
