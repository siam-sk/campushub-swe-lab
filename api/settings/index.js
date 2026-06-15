import admin from '../../lib/firebaseAdmin.js';
import { connectMongo } from '../../lib/connectMongo.js';
import SettingsPage from '../../server/models/SettingsPage.js';

const fallbackSettings = {
  theme: 'orange',
  notificationsEnabled: true,
  emailNotifications: true,
  smsNotifications: true,
  language: 'English',
  darkMode: false,
  accentColor: 'orange',
};

const getTokenFromHeader = (req) => {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
};

const decodeToken = async (token) => {
  if (process.env.NODE_ENV !== 'production' && token.startsWith('mock-')) {
    const email = token.replace('mock-', '');
    return {
      uid: `mock-uid-${email}`,
      email: email,
      name: email.split('@')[0],
      picture: '',
    };
  }
  if (token.startsWith('mock-')) {
    throw new Error('Mock tokens are not allowed in production');
  }
  return await admin.auth().verifyIdToken(token);
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  await connectMongo();

  const token = getTokenFromHeader(req);
  if (!token) {
    return res.status(401).json({ message: 'Missing auth token' });
  }

  try {
    const decoded = await decodeToken(token);

    // GET: load user settings
    if (req.method === 'GET') {
      const settings = await SettingsPage.findOne({ userId: decoded.uid }).lean();
      return res.json({ settings: settings || fallbackSettings });
    }

    // POST: save user settings
    if (req.method === 'POST') {
      const {
        theme,
        notificationsEnabled,
        emailNotifications,
        smsNotifications,
        language,
        darkMode,
        accentColor,
      } = req.body || {};

      const updatePayload = {};
      if (theme !== undefined) updatePayload.theme = theme;
      if (notificationsEnabled !== undefined) updatePayload.notificationsEnabled = !!notificationsEnabled;
      if (emailNotifications !== undefined) updatePayload.emailNotifications = !!emailNotifications;
      if (smsNotifications !== undefined) updatePayload.smsNotifications = !!smsNotifications;
      if (language !== undefined) updatePayload.language = language;
      if (darkMode !== undefined) updatePayload.darkMode = !!darkMode;
      if (accentColor !== undefined) updatePayload.accentColor = accentColor;

      const settings = await SettingsPage.findOneAndUpdate(
        { userId: decoded.uid },
        { $set: updatePayload },
        { new: true, upsert: true }
      ).lean();

      return res.json({ settings, message: 'Settings saved successfully' });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('API Settings handler error:', error);
    return res.status(401).json({ message: 'Unauthorized', error: error?.message || '' });
  }
}
