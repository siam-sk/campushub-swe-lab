import mongoose from 'mongoose';

const scholarshipSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    provider: { type: String, default: '' },
    description: { type: String, default: '' },
    amount: { type: String, default: '' },
    type: { type: String, default: '' },
    deadline: { type: String, default: '' },
    countries: { type: [String], default: [] },
    applicants: { type: Number, default: 0 },
    awards: { type: Number, default: 0 },
    categories: { type: [String], default: [] },
    eligibility: { type: String, default: '' },
    isNew: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export default mongoose.models.Scholarship || mongoose.model('Scholarship', scholarshipSchema);
