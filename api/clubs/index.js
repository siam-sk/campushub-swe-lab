import { connectMongo } from '../../lib/connectMongo.js';
import Club from '../../server/models/Club.js';

const fallbackClubs = [
  {
    name: 'UIU Robotics Club',
    summary: 'Date & Time: October 20, 2025 · 10:00 AM - 3:00 PM',
    date: 'October 20, 2025',
    time: '10:00 AM - 3:00 PM',
    venue: 'Innovation Lab, Main Campus',
    description:
      'Join us for RoboFest 2025, a day robotics competition where innovation meets engineering excellence.',
    memberCount: 245,
    coverImage: '',
  },
  {
    name: 'UIU Computer Club',
    summary: 'Date & Time: November 5, 2025 · 9:00 AM - 5:00 PM',
    date: 'November 5, 2025',
    time: '9:00 AM - 5:00 PM',
    venue: 'Innovation Lab, Main Campus',
    description:
      'Hack the Future 2025 is an exhilarating 24-hour hackathon for programmers, designers, and innovators.',
    memberCount: 189,
    coverImage: '',
  },
  {
    name: 'UIU Cultural Club',
    summary: 'Date & Time: December 15, 2025 · 5:00 PM - 9:00 PM',
    date: 'December 15, 2025',
    time: '5:00 PM - 9:00 PM',
    venue: 'Playground, 4B&C',
    description:
      'Experience the vibrant diversity of our campus at Fusion Fest 2025.',
    memberCount: 312,
    coverImage: '',
  },
  {
    name: 'UIU Photography Club',
    summary: 'Date & Time: January 12, 2026 · 2:00 PM - 6:00 PM',
    date: 'January 12, 2026',
    time: '2:00 PM - 6:00 PM',
    venue: 'Media Lab, Building B',
    description: 'Photo walk and editing workshop for beginners and enthusiasts.',
    memberCount: 178,
    coverImage: '',
  },
  {
    name: 'UIU Debate Society',
    summary: 'Date & Time: January 20, 2026 · 4:00 PM - 7:00 PM',
    date: 'January 20, 2026',
    time: '4:00 PM - 7:00 PM',
    venue: 'Auditorium, Main Campus',
    description: 'Weekly debate sessions and mock tournaments to sharpen public speaking.',
    memberCount: 267,
    coverImage: '',
  },
  {
    name: 'UIU Sports Club',
    summary: 'Date & Time: January 28, 2026 · 3:00 PM - 6:00 PM',
    date: 'January 28, 2026',
    time: '3:00 PM - 6:00 PM',
    venue: 'Sports Ground',
    description: 'Inter-department football and badminton tryouts for the spring season.',
    memberCount: 423,
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

    const { clubId } = req.body || {};
    if (!clubId) {
      return res.status(400).json({ message: 'clubId is required' });
    }

    const club = await Club.findByIdAndUpdate(
      clubId,
      { $inc: { memberCount: 1 } },
      { new: true },
    ).lean();

    return res.json({ club });
  }

  if (req.method === 'GET') {
    const clubs = await Club.find().sort({ createdAt: -1 }).lean();
    return res.json({ clubs: clubs.length ? clubs : fallbackClubs });
  }

  if (req.method === 'POST') {
    const club = await Club.create(req.body || {});
    return res.status(201).json({ club });
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
