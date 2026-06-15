import mongoose from 'mongoose';

const studentAnswerSchema = new mongoose.Schema(
  {
    questionIndex: { type: Number, required: true },
    selectedOptionIndex: { type: Number, required: true },
  },
  { _id: false }
);

const testAttemptSchema = new mongoose.Schema(
  {
    testId: { type: mongoose.Schema.Types.ObjectId, ref: 'MockTest', required: true },
    userId: { type: String, required: true, index: true },
    email: { type: String, default: '' },
    name: { type: String, default: '' },
    score: { type: Number, default: 0 },
    status: { type: String, default: 'started' },
    answers: { type: [studentAnswerSchema], default: [] },
    totalQuestions: { type: Number, default: 0 },
    correctAnswers: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export default mongoose.models.TestAttempt || mongoose.model('TestAttempt', testAttemptSchema);
