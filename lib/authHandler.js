import admin from './firebaseAdmin.js';
import { connectMongo } from './connectMongo.js';
import UserProfile from '../server/models/UserProfile.js';
import StudentUser from '../server/models/StudentUser.js';

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

export const handleAuthAction = async (req, res, action) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (action === 'resolve-id') {
      const id = (req.query.id || req.body?.id || '').trim();
      if (!id) {
        return res.status(400).json({ message: 'ID is required' });
      }

      if (id.includes('@')) {
        return res.json({ email: id });
      }

      if (id.toUpperCase().startsWith('FAC')) {
        return res.json({ email: 'faculty@campushub.edu' });
      }

      if (id.toUpperCase().startsWith('ADM')) {
        return res.json({ email: 'admin@campushub.edu' });
      }

      const mongoStatus = await connectMongo();
      if (!mongoStatus?.connected) {
        return res.status(500).json({ message: 'Database connection failed' });
      }

      try {
        const student = await StudentUser.findOne({ studentId: id }).lean();
        if (student) {
          return res.json({ email: student.email });
        }
        return res.status(404).json({ message: 'User ID not found' });
      } catch (err) {
        return res.status(500).json({ message: 'Database error', error: err.message });
      }
    }

    if (action === 'me') {
      const header = req.headers.authorization || '';
      const token = header.startsWith('Bearer ') ? header.slice(7) : null;

      if (!token) {
        return res.status(401).json({ message: 'Missing auth token' });
      }

      const decoded = await decodeToken(token);
      const mongoStatus = await connectMongo();
      if (!mongoStatus?.connected) {
        return res.json({ user: buildUserPayload(decoded, null) });
      }

      const profile = await UserProfile.findOne({ uid: decoded.uid }).lean();
      return res.json({ user: buildUserPayload(decoded, profile) });
    }

    const { idToken } = req.body || {};

    if (!idToken) {
      return res.status(400).json({ message: 'idToken is required' });
    }

    const decoded = await decodeToken(idToken);
    const mongoStatus = await connectMongo();
    const profile = mongoStatus?.connected ? await ensureUserProfile(decoded) : null;

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
