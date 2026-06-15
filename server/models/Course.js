import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    dept: { type: String, default: 'Dept. of CSE' },
    footer: { type: String, default: '' },
    accent: { type: String, default: 'blue' },
    materials: { type: Number, default: 0 },
    assignments: { type: Number, default: 0 },
    facultyEmail: { type: String, index: true },
  },
  { timestamps: true }
);

export default mongoose.models.Course || mongoose.model('Course', courseSchema);
