import { connectMongo } from '../lib/connectMongo.js';
import ProfilePage from '../../server/models/ProfilePage.js';

const fallbackProfile = {
  key: 'default',
  tabs: [
    'Student Accounts',
    'Transport Registration',
    'Admin Control',
    'Scheduler',
    'Result',
    'Registration',
  ],
  stats: {
    cgpa: 3.44,
    completedCredits: 70,
    balance: 0,
  },
  advisor: {
    name: 'Akbor Ali',
    initials: 'AKI',
    email: 'sjsakjd@cse.uiu.ac.bd',
    room: '123 (D)',
    phone: 'xxxxxxxxxxxx',
  },
  resultSummary: {
    labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5'],
    scores: [2.8, 3.0, 3.2, 3.1, 3.4],
  },
  attendanceSummary: {
    label: 'No attendance data available',
  },
  profileInfo: {
    fullName: 'John Smith',
    studentId: '01122XXXX',
    dob: '01 September, 2000',
    phone: '017XXXXXXXXXX',
  },
};

export default async function handler(req, res) {
  await connectMongo();

  if (req.method === 'GET') {
    const profile = await ProfilePage.findOne({ key: 'default' }).lean();
    return res.json({ profile: profile || fallbackProfile });
  }

  if (req.method === 'POST') {
    const payload = req.body || {};
    const profile = await ProfilePage.findOneAndUpdate(
      { key: 'default' },
      { $set: payload, $setOnInsert: { key: 'default' } },
      { new: true, upsert: true },
    ).lean();
    return res.json({ profile });
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
