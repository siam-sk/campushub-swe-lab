import express from 'express';
import SettingsPage from '../models/SettingsPage.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

const fallbackSettings = {
  theme: 'orange',
  notificationsEnabled: true,
  emailNotifications: true,
  smsNotifications: true,
  language: 'English',
  darkMode: false,
  accentColor: 'orange',
};

// GET: Load authenticated user's settings
router.get('/', requireAuth, async (req, res) => {
  try {
    const settings = await SettingsPage.findOne({ userId: req.user.uid }).lean();
    return res.json({ settings: settings || fallbackSettings });
  } catch (error) {
    console.error('Express settings GET error:', error);
    return res.status(500).json({ message: 'Error loading settings', error: error.message });
  }
});

// POST: Update authenticated user's settings
router.post('/', requireAuth, async (req, res) => {
  try {
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
      { userId: req.user.uid },
      { $set: updatePayload },
      { new: true, upsert: true }
    ).lean();

    return res.json({ settings, message: 'Settings saved successfully' });
  } catch (error) {
    console.error('Express settings POST error:', error);
    return res.status(500).json({ message: 'Error saving settings', error: error.message });
  }
});

export default router;
