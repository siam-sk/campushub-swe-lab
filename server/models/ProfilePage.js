import mongoose from 'mongoose';

const profilePageSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    tabs: { type: [String], default: [] },
    stats: {
      cgpa: { type: Number, default: 0 },
      completedCredits: { type: Number, default: 0 },
      balance: { type: Number, default: 0 },
    },
    advisor: {
      name: { type: String, default: '' },
      initials: { type: String, default: '' },
      email: { type: String, default: '' },
      room: { type: String, default: '' },
      phone: { type: String, default: '' },
    },
    resultSummary: {
      labels: { type: [String], default: [] },
      scores: { type: [Number], default: [] },
    },
    attendanceSummary: {
      label: { type: String, default: 'No attendance data available' },
    },
    profileInfo: {
      fullName: { type: String, default: '' },
      studentId: { type: String, default: '' },
      dob: { type: String, default: '' },
      phone: { type: String, default: '' },
    },
  },
  { timestamps: true },
);

export default mongoose.models.ProfilePage || mongoose.model('ProfilePage', profilePageSchema);
