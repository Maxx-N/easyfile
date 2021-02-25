const mongoose = require('mongoose');

//

const Schema = mongoose.Schema;

const swapFolderSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  proId: {
    type: Schema.Types.ObjectId,
    ref: 'Pro',
    required: true,
  },
  userRequestId: {
    type: Schema.Types.ObjectId,
    ref: 'Request',
    required: true,
  },
  proRequestId: { type: Schema.Types.ObjectId, ref: 'Request', required: true },

});

module.exports = mongoose.model('SwapFolder', swapFolderSchema);
