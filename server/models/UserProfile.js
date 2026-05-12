import mongoose from 'mongoose';

const dashboardMetaSchema = new mongoose.Schema(
  {
    noticesUnread: { type: Number, default: 0 },
    messagesUnread: { type: Number, default: 0 },
    coursesEnrolled: { type: Number, default: 0 },
  },
  { _id: false },
);

const userProfileSchema = new mongoose.Schema(
  {
    uid: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, index: true },
    fullName: { type: String, required: true },
    role: {
      type: String,
      enum: ['student', 'faculty', 'admin'],
      default: 'student',
      index: true,
    },
    department: { type: String, default: '' },
    year: { type: String, default: '' },
    semester: { type: String, default: '' },
    gpa: { type: Number, default: 0 },
    status: { type: String, default: 'active' },
    avatarUrl: { type: String, default: '' },
    dashboardMeta: { type: dashboardMetaSchema, default: () => ({}) },
  },
  { timestamps: true },
);

export default mongoose.models.UserProfile || mongoose.model('UserProfile', userProfileSchema);
