import { connectMongo } from '../../lib/connectMongo.js';
import LiveClass from '../../server/models/LiveClass.js';

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

export default async function handler(req, res) {
  await connectMongo();

  const action = req.query.action?.[0] || req.query.action;
  if (action === 'join') {
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

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
  }

  if (req.method === 'GET') {
    const classes = await LiveClass.find().sort({ startTime: 1 }).lean();
    return res.json({ classes: classes.length ? classes : fallbackClasses });
  }

  if (req.method === 'POST') {
    const liveClass = await LiveClass.create(req.body || {});
    return res.status(201).json({ liveClass });
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
