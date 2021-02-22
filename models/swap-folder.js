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
  status: {
    type: String,
    enum: ['pending', 'accepted', 'refused', 'suspended'],
    required: true,
  },
  requestIds: [
    { type: Schema.Types.ObjectId, ref: 'Request', required: true },
  ],
  documentIds: [
    { type: Schema.Types.ObjectId, ref: 'Document', required: true },
  ],
});

module.exports = mongoose.model('SwapFolder', swapFolderSchema);
