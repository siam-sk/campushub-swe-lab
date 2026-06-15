import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema(
  {
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    deadline: { type: Date, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Assignment || mongoose.model('Assignment', assignmentSchema);
