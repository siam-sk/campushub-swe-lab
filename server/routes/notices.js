import express from 'express';
import Notice from '../models/Notice.js';
import { loadUserProfile, requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

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

router.get('/', requireAuth, loadUserProfile, async (req, res) => {
  try {
    const role = req.profile?.role || 'student';
    const category = req.query.category;
    const query = req.query.q || '';

    const filter = buildNoticeFilter({ role, category, query });
    const notices = await Notice.find(filter)
      .sort({ publishAt: -1 })
      .limit(50)
      .lean();

    return res.json({
      notices,
      count: notices.length,
      role,
    });
  } catch {
    return res.status(500).json({ message: 'Unable to load notices', notices: [] });
  }
});

router.post('/', requireAuth, loadUserProfile, requireRole(['faculty', 'admin']), async (req, res) => {
  try {
    const { title, body, category, priority, audienceRoles, publishAt } = req.body || {};

    if (!title || !body) {
      return res.status(400).json({ message: 'Title and body are required' });
    }

    const createdBy = {
      uid: req.user?.uid || '',
      email: req.user?.email || '',
      name: req.profile?.fullName || req.user?.name || req.user?.email || '',
    };

    const notice = await Notice.create({
      title,
      body,
      category,
      priority,
      audienceRoles,
      publishAt,
      createdBy,
    });

    return res.status(201).json({ notice });
  } catch {
    return res.status(500).json({ message: 'Unable to create notice' });
  }
});

export default router;
