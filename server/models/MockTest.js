import mongoose from 'mongoose';

const mockTestSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    courseCode: { type: String, default: '' },
    questions: { type: Number, default: 0 },
    durationMinutes: { type: Number, default: 0 },
    difficulty: { type: String, default: '' },
    avgScore: { type: Number, default: 0 },
    participants: { type: Number, default: 0 },
    status: { type: String, default: 'active' },
  },
  { timestamps: true },
);

export default mongoose.models.MockTest || mongoose.model('MockTest', mockTestSchema);
