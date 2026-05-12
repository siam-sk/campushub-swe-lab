import mongoose from 'mongoose';

const assistantMessageSchema = new mongoose.Schema(
  {
    sessionId: { type: String, default: 'default' },
    sender: { type: String, enum: ['user', 'assistant'], default: 'assistant' },
    body: { type: String, default: '' },
  },
  { timestamps: true },
);

export default mongoose.models.AssistantMessage || mongoose.model('AssistantMessage', assistantMessageSchema);
