import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    company: { type: String, required: true },
    description: { type: String, default: '' },
    tags: { type: [String], default: [] },
    type: { type: String, default: '' },
    location: { type: String, default: '' },
    salaryRange: { type: String, default: '' },
    postedAt: { type: Date, default: Date.now },
    deadline: { type: String, default: '' },
    isNew: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export default mongoose.models.Job || mongoose.model('Job', jobSchema);
