import mongoose from 'mongoose';

const alumniProfileSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    role: { type: String, default: '' },
    company: { type: String, default: '' },
    location: { type: String, default: '' },
    batch: { type: String, default: '' },
    avatarUrl: { type: String, default: '' },
    skills: { type: [String], default: [] },
    highlight: { type: String, default: '' },
    tags: { type: [String], default: [] },
  },
  { timestamps: true },
);

export default mongoose.models.AlumniProfile || mongoose.model('AlumniProfile', alumniProfileSchema);
