import admin from '../../lib/firebaseAdmin.js';
import { connectMongo } from '../../lib/connectMongo.js';
import LiveClass from '../../server/models/LiveClass.js';
import UserProfile from '../../server/models/UserProfile.js';

const fallbackClasses = [
  {
    title: 'Machine Learning Fundamentals',
    instructor: 'Prof. Karim Rahman',
    durationMinutes: 120,
    attendees: 38,
    capacity: 40,
    status: 'live',
    startTime: '2026-01-02T09:00:00.000Z',
    coverImage: '',
  },
  {
    title: 'Advanced React Patterns',
    instructor: 'Ayesha Rahman',
    durationMinutes: 90,
    attendees: 0,
    capacity: 40,
    status: 'upcoming',
    startTime: '2026-01-05T10:00:00.000Z',
    coverImage: '',
  },
  {
    title: 'Data Structures Deep Dive',
    instructor: 'Zahid Hasan',
    durationMinutes: 75,
    attendees: 0,
    capacity: 40,
    status: 'upcoming',
    startTime: '2026-01-07T02:00:00.000Z',
    coverImage: '',
  },
  {
    title: 'Operating Systems Lab Review',
    instructor: 'Nusrat Jahan',
    durationMinutes: 60,
    attendees: 0,
    capacity: 30,
    status: 'upcoming',
    startTime: '2026-01-09T11:00:00.000Z',
    coverImage: '',
  },
];

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

  const action = req.query.action?.[0] || req.query.action;
  if (action === 'join') {
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    const token = getTokenFromHeader(req);
    if (!token) {
      return res.status(401).json({ message: 'Missing auth token' });
    }

    try {
      await decodeToken(token);

      const { classId } = req.body || {};
      if (!classId) {
        return res.status(400).json({ message: 'classId is required' });
      }

      const liveClass = await LiveClass.findByIdAndUpdate(
        classId,
        { $inc: { attendees: 1 } },
        { new: true },
      ).lean();

      return res.json({ liveClass });
    } catch (error) {
      return res.status(401).json({ message: 'Unauthorized', error: error?.message || '' });
    }
  }

  if (req.method === 'GET') {
    const classes = await LiveClass.find().sort({ startTime: 1 }).lean();
    return res.json({ classes: classes.length ? classes : fallbackClasses });
  }

  if (req.method === 'POST') {
    const token = getTokenFromHeader(req);
    if (!token) {
      return res.status(401).json({ message: 'Missing auth token' });
    }

    try {
      const decoded = await decodeToken(token);
      const profile = await UserProfile.findOne({ uid: decoded.uid }).lean();
      const role = profile?.role || 'student';

      if (!['faculty', 'admin'].includes(role)) {
        return res.status(403).json({ message: 'Insufficient role permissions' });
      }

      const liveClass = await LiveClass.create(req.body || {});
      return res.status(201).json({ liveClass });
    } catch (error) {
      return res.status(401).json({ message: 'Unauthorized', error: error?.message || '' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
