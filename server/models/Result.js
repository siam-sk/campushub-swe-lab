import mongoose from 'mongoose';

const resultSchema = new mongoose.Schema(
  {
    studentEmail: { type: String, required: true, index: true },
    semester: { type: String, required: true }, // e.g., 'Spring 2025', 'Fall 2025'
    courseCode: { type: String, required: true },
    courseTitle: { type: String, required: true },
    credit: { type: Number, required: true },
    grade: { type: String, required: true }, // e.g., 'A', 'B+', 'F'
    gradePoint: { type: Number, required: true }, // e.g., 4.0, 3.3, 0.0
    marks: { type: Number },
  },
  { timestamps: true }
);

// Unique compound index to prevent duplicate entries for a student's course in a semester
resultSchema.index({ studentEmail: 1, semester: 1, courseCode: 1 }, { unique: true });

export default mongoose.models.Result || mongoose.model('Result', resultSchema);
