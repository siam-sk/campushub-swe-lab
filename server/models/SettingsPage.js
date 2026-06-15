import mongoose from 'mongoose';

const settingsPageSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    theme: { type: String, default: 'orange' },
    notificationsEnabled: { type: Boolean, default: true },
    emailNotifications: { type: Boolean, default: true },
    smsNotifications: { type: Boolean, default: true },
    language: { type: String, default: 'English' },
    darkMode: { type: Boolean, default: false },
    accentColor: { type: String, default: 'orange' },
  },
  { timestamps: true },
);

export default mongoose.models.SettingsPage || mongoose.model('SettingsPage', settingsPageSchema);
