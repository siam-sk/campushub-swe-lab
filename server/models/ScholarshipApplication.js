import mongoose from 'mongoose';

const scholarshipApplicationSchema = new mongoose.Schema(
  {
    scholarshipId: { type: mongoose.Schema.Types.ObjectId, ref: 'Scholarship' },
    name: { type: String, default: '' },
    email: { type: String, default: '' },
    status: { type: String, default: 'submitted' },
  },
  { timestamps: true },
);

export default mongoose.models.ScholarshipApplication || mongoose.model('ScholarshipApplication', scholarshipApplicationSchema);
