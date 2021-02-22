const mongoose = require('mongoose');

//

const Schema = mongoose.Schema;

const requestSchema = new Schema({
  swapFolderId: {
    type: Schema.Types.ObjectId,
    ref: 'SwapFolder',
    required: true,
  },
  isAccepted: {
    type: Boolean,
    required: true,
  },
  requestedDocIds: [
    { type: Schema.Types.ObjectId, ref: 'RequestedDoc', required: true },
  ],
});

module.exports = mongoose.model('Request', requestSchema);
