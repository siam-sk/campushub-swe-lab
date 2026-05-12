import { connectMongo } from '../lib/connectMongo.js';
import SettingsPage from '../../server/models/SettingsPage.js';

const fallbackSettings = {
  key: 'default',
  profile: {
    fullName: 'John Student',
    studentId: '2021CSE089',
    email: 'john.student@university.edu',
    phone: '+880 1234-567890',
    department: 'Computer Science & Engineering',
    year: '3rd Year',
    bio: 'Tell us about yourself...',
    avatarUrl: '',
  },
  notifications: {
    push: true,
    email: true,
    notices: true,
    messages: true,
  },
  privacy: {
    publicProfile: true,
    showEmail: false,
    showPhone: false,
  },
  appearance: {
    darkMode: false,
    theme: 'orange',
  },
};

export default async function handler(req, res) {
  await connectMongo();

  if (req.method === 'GET') {
    const settings = await SettingsPage.findOne({ key: 'default' }).lean();
    return res.json({ settings: settings || fallbackSettings });
  }

  if (req.method === 'POST') {
    const payload = req.body || {};
    const settings = await SettingsPage.findOneAndUpdate(
      { key: 'default' },
      { $set: payload, $setOnInsert: { key: 'default' } },
      { new: true, upsert: true },
    ).lean();
    return res.json({ settings });
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
