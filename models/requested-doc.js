const mongoose = require('mongoose');

//

const Schema = mongoose.Schema;

const requestedDocSchema = new Schema({
  requestId: {
    type: Schema.Types.ObjectId,
    ref: 'Request',
    required: true,
  },
  title: {
    type: String,
  },
  previousMonths: {
    type: Number,
  },
  previousYears: {
    type: Number,
  },
  monthAge: {
    type: number,
  },
  doctypeId: { type: Schema.Types.ObjectId, ref: 'Doctype', required: true },
  alternativeRequestedDocIds: [
    { type: Schema.Types.ObjectId, ref: 'RequestedDoc', required: true },
  ]
});

module.exports = mongoose.model('RequestedDoc', requestedDocSchema);
