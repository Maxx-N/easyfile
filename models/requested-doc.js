const mongoose = require('mongoose');

//

const Schema = mongoose.Schema;

const requestedDocSchema = new Schema({
  title: {
    type: String,
  },
  age: {
    type: Number,
  },
  doctypeId: { type: Schema.Types.ObjectId, ref: 'Doctype', required: true },
  alternativeRequestedDocIds: [
    { type: Schema.Types.ObjectId, ref: 'RequestedDoc', required: true },
  ],
});

module.exports = mongoose.model('RequestedDoc', requestedDocSchema);
