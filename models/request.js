const mongoose = require('mongoose');

//

const Schema = mongoose.Schema;

const requestSchema = new Schema({
  requestedDocIds: [
    { type: Schema.Types.ObjectId, ref: 'RequestedDoc', required: true },
  ],
});

module.exports = mongoose.model('Request', requestSchema);
