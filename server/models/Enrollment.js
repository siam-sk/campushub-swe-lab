import mongoose from 'mongoose';

const enrollmentSchema = new mongoose.Schema(
  {
    studentEmail: { type: String, required: true, index: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    schedule: { type: String, default: '' },
  },
  { timestamps: true }
);

enrollmentSchema.index({ studentEmail: 1, courseId: 1 }, { unique: true });

export default mongoose.models.Enrollment || mongoose.model('Enrollment', enrollmentSchema);
