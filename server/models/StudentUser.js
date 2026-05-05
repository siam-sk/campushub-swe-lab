import mongoose from 'mongoose';

const dashboardMetaSchema = new mongoose.Schema(
  {
    noticesUnread: { type: Number, default: 0 },
    messagesUnread: { type: Number, default: 0 },
    coursesEnrolled: { type: Number, default: 0 },
  },
  { _id: false },
);

const studentUserSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true, unique: true, index: true },
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    department: { type: String, required: true },
    year: { type: String, required: true },
    semester: { type: String, required: true },
    gpa: { type: Number, default: 0 },
    status: { type: String, default: 'active' },
    avatarUrl: { type: String, default: '' },
    dashboardMeta: { type: dashboardMetaSchema, default: () => ({}) },
  },
  { timestamps: true },
);

export default mongoose.models.StudentUser || mongoose.model('StudentUser', studentUserSchema);
