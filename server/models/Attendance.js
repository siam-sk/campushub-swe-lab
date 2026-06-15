import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    studentEmail: { type: String, required: true, index: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    date: { type: Date, required: true },
    status: {
      type: String,
      enum: ['Present', 'Absent', 'Late'],
      required: true,
    },
  },
  { timestamps: true }
);

// Index to help speed up queries
attendanceSchema.index({ studentEmail: 1, courseId: 1, date: 1 }, { unique: true });

export default mongoose.models.Attendance || mongoose.model('Attendance', attendanceSchema);
