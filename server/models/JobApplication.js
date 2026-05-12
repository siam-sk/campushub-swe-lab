import mongoose from 'mongoose';

const jobApplicationSchema = new mongoose.Schema(
  {
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
    name: { type: String, default: '' },
    email: { type: String, default: '' },
    resumeUrl: { type: String, default: '' },
    status: { type: String, default: 'submitted' },
  },
  { timestamps: true },
);

export default mongoose.models.JobApplication || mongoose.model('JobApplication', jobApplicationSchema);
