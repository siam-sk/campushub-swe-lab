import admin from '../../lib/firebaseAdmin.js';
import { connectMongo } from '../../lib/connectMongo.js';
import Notice from '../../server/models/Notice.js';
import UserProfile from '../../server/models/UserProfile.js';

const getTokenFromHeader = (req) => {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
};

const buildNoticeFilter = ({ role, category, query }) => {
  const filter = {};

  if (category && category !== 'All') {
    filter.category = category;
  }

  if (role) {
    filter.$or = [
      { audienceRoles: { $size: 0 } },
      { audienceRoles: { $in: [role] } },
    ];
  }

  if (query) {
    filter.$and = filter.$and || [];
    filter.$and.push({
      $or: [
        { title: new RegExp(query, 'i') },
        { body: new RegExp(query, 'i') },
      ],
    });
  }

  return filter;
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const token = getTokenFromHeader(req);
  if (!token) {
    return res.status(401).json({ message: 'Missing auth token' });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    await connectMongo();
    const profile = await UserProfile.findOne({ uid: decoded.uid }).lean();
    const role = profile?.role || 'student';

    if (req.method === 'GET') {
      const category = req.query.category;
      const query = req.query.q || '';
      const filter = buildNoticeFilter({ role, category, query });

      const notices = await Notice.find(filter)
        .sort({ publishAt: -1 })
        .limit(50)
        .lean();

      return res.json({ notices, count: notices.length, role });
    }

    if (req.method === 'POST') {
      if (!['faculty', 'admin'].includes(role)) {
        return res.status(403).json({ message: 'Insufficient role permissions' });
      }

      const { title, body, category, priority, audienceRoles, publishAt } = req.body || {};
      if (!title || !body) {
        return res.status(400).json({ message: 'Title and body are required' });
      }

      const notice = await Notice.create({
        title,
        body,
        category,
        priority,
        audienceRoles,
        publishAt,
        createdBy: {
          uid: decoded.uid,
          email: decoded.email || '',
          name: profile?.fullName || decoded.name || decoded.email || '',
        },
      });

      return res.status(201).json({ notice });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    return res.status(401).json({ message: 'Invalid auth token', error: error?.message || '' });
  }
}
