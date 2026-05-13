import admin from './firebaseAdmin.js';
import { connectMongo } from './connectMongo.js';
import UserProfile from '../server/models/UserProfile.js';

const buildUserPayload = (decoded, profile) => ({
  uid: decoded.uid,
  email: decoded.email,
  name: profile?.fullName || decoded.name || decoded.email,
  picture: decoded.picture || null,
  role: profile?.role || 'student',
  profile: profile
    ? {
        fullName: profile.fullName,
        role: profile.role,
        department: profile.department,
        year: profile.year,
        semester: profile.semester,
        gpa: profile.gpa,
        avatarUrl: profile.avatarUrl,
      }
    : null,
});

const ensureUserProfile = async (decoded) => {
  const fullName = decoded.name || decoded.email || 'Student';
  const update = {
    email: decoded.email,
    avatarUrl: decoded.picture || '',
  };

  if (decoded.name) {
    update.fullName = decoded.name;
  }

  const profile = await UserProfile.findOneAndUpdate(
    { uid: decoded.uid },
    {
      $set: update,
      $setOnInsert: {
        fullName,
        role: 'student',
      },
    },
    { new: true, upsert: true },
  ).lean();

  return profile;
};

export const handleAuthAction = async (req, res, action) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (action === 'me') {
      const header = req.headers.authorization || '';
      const token = header.startsWith('Bearer ') ? header.slice(7) : null;

      if (!token) {
        return res.status(401).json({ message: 'Missing auth token' });
      }

      const decoded = await admin.auth().verifyIdToken(token);
      await connectMongo();
      const profile = await UserProfile.findOne({ uid: decoded.uid }).lean();
      return res.json({ user: buildUserPayload(decoded, profile) });
    }

    const { idToken } = req.body || {};

    if (!idToken) {
      return res.status(400).json({ message: 'idToken is required' });
    }

    const decoded = await admin.auth().verifyIdToken(idToken);
    await connectMongo();
    const profile = await ensureUserProfile(decoded);

    return res.status(action === 'register' ? 201 : 200).json({
      message: action === 'register' ? 'Registration verified' : 'Login verified',
      user: buildUserPayload(decoded, profile),
    });
  } catch (error) {
    return res.status(401).json({
      message: 'Invalid idToken',
      error: error?.message || 'Unknown auth error',
    });
  }
};
