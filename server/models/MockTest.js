import mongoose from 'mongoose';

const questionItemSchema = new mongoose.Schema(
  {
    questionText: { type: String, required: true },
    options: { type: [String], required: true },
    correctOptionIndex: { type: Number, required: true },
  },
  { _id: false }
);

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
    questionsList: { type: [questionItemSchema], default: [] },
  },
  { timestamps: true },
);

export default mongoose.models.MockTest || mongoose.model('MockTest', mockTestSchema);
