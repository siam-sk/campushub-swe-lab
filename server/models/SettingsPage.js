import mongoose from 'mongoose';

const settingsPageSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    profile: {
      fullName: { type: String, default: '' },
      studentId: { type: String, default: '' },
      email: { type: String, default: '' },
      phone: { type: String, default: '' },
      department: { type: String, default: '' },
      year: { type: String, default: '' },
      bio: { type: String, default: '' },
      avatarUrl: { type: String, default: '' },
    },
    notifications: {
      push: { type: Boolean, default: true },
      email: { type: Boolean, default: true },
      notices: { type: Boolean, default: true },
      messages: { type: Boolean, default: true },
    },
    privacy: {
      publicProfile: { type: Boolean, default: true },
      showEmail: { type: Boolean, default: false },
      showPhone: { type: Boolean, default: false },
    },
    appearance: {
      darkMode: { type: Boolean, default: false },
      theme: { type: String, default: 'orange' },
    },
  },
  { timestamps: true },
);

export default mongoose.models.SettingsPage || mongoose.model('SettingsPage', settingsPageSchema);
