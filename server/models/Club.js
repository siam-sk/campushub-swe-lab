import mongoose from 'mongoose';

const clubSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    summary: { type: String, default: '' },
    date: { type: String, default: '' },
    time: { type: String, default: '' },
    venue: { type: String, default: '' },
    description: { type: String, default: '' },
    coverImage: { type: String, default: '' },
    memberCount: { type: Number, default: 0 },
    tags: { type: [String], default: [] },
  },
  { timestamps: true },
);

export default mongoose.models.Club || mongoose.model('Club', clubSchema);
