import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    code: { type: String, required: true },
    topic: { type: String, required: true },
    category: { type: String, default: 'All Subjects' },
    pages: { type: Number, required: true, default: 1 },
    author: { type: String, required: true },
    email: { type: String, required: true },
    downloads: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['pending', 'approved'],
      default: 'pending',
      index: true,
    },
    downloadUrl: { type: String, default: '' },
    accent: { type: String, default: 'blue' },
  },
  { timestamps: true }
);

export default mongoose.models.Note || mongoose.model('Note', noteSchema);

