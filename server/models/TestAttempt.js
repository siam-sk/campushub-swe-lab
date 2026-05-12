import mongoose from 'mongoose';

const testAttemptSchema = new mongoose.Schema(
  {
    testId: { type: mongoose.Schema.Types.ObjectId, ref: 'MockTest' },
    name: { type: String, default: '' },
    score: { type: Number, default: 0 },
    status: { type: String, default: 'started' },
  },
  { timestamps: true },
);

export default mongoose.models.TestAttempt || mongoose.model('TestAttempt', testAttemptSchema);
