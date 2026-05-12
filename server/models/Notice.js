import mongoose from 'mongoose';

const noticeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    body: { type: String, required: true },
    category: {
      type: String,
      enum: ['Exam', 'Holiday', 'Event', 'General'],
      default: 'General',
      index: true,
    },
    priority: {
      type: String,
      enum: ['High', 'Medium', 'Low'],
      default: 'Medium',
      index: true,
    },
    audienceRoles: {
      type: [String],
      default: ['student', 'faculty', 'admin'],
      index: true,
    },
    publishAt: { type: Date, default: Date.now, index: true },
    createdBy: {
      uid: { type: String, default: '' },
      email: { type: String, default: '' },
      name: { type: String, default: '' },
    },
  },
  { timestamps: true },
);

export default mongoose.models.Notice || mongoose.model('Notice', noticeSchema);
