import mongoose from 'mongoose';

const assignmentSubmissionSchema = new mongoose.Schema(
  {
    assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
    studentEmail: { type: String, required: true, index: true },
    submissionText: { type: String, required: true },
    submittedAt: { type: Date, default: Date.now },
    marks: { type: Number, default: 0 },
    feedback: { type: String, default: '' },
    gradedAt: { type: Date },
  },
  { timestamps: true }
);

assignmentSubmissionSchema.index({ assignmentId: 1, studentEmail: 1 }, { unique: true });

export default mongoose.models.AssignmentSubmission || mongoose.model('AssignmentSubmission', assignmentSubmissionSchema);

