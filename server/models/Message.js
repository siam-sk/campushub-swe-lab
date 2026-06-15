import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    senderId: { type: String, required: true, index: true },
    receiverId: { type: String, required: true, index: true },
    senderName: { type: String, default: '' },
    receiverName: { type: String, default: '' },
    body: { type: String, required: true },
    timestamp: { type: Date, default: Date.now, index: true }
  },
  { timestamps: true }
);

export default mongoose.models.Message || mongoose.model('Message', messageSchema);
