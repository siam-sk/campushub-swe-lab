import { connectMongo } from '../../lib/connectMongo.js';
import MockTest from '../../server/models/MockTest.js';
import TestAttempt from '../../server/models/TestAttempt.js';

const fallbackTests = [
  {
    title: 'Data Structures & Algorithms',
    courseCode: 'CSE 201',
    questions: 50,
    durationMinutes: 60,
    difficulty: 'Medium',
    avgScore: 72,
    participants: 245,
  },
  {
    title: 'Database Management Systems',
    courseCode: 'CSE 301',
    questions: 40,
    durationMinutes: 45,
    difficulty: 'Easy',
    avgScore: 78,
    participants: 189,
  },
  {
    title: 'Operating Systems Concepts',
    courseCode: 'CSE 302',
    questions: 45,
    durationMinutes: 50,
    difficulty: 'Medium',
    avgScore: 74,
    participants: 210,
  },
  {
    title: 'Computer Networks',
    courseCode: 'CSE 303',
    questions: 55,
    durationMinutes: 60,
    difficulty: 'Hard',
    avgScore: 69,
    participants: 198,
  },
];

export default async function handler(req, res) {
  await connectMongo();

  const action = req.query.action?.[0] || req.query.action;
  if (action === 'start') {
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    const { testId, name } = req.body || {};
    if (!testId) {
      return res.status(400).json({ message: 'testId is required' });
    }

    const attempt = await TestAttempt.create({ testId, name, status: 'started' });
    return res.status(201).json({ attempt });
  }

  if (req.method === 'GET') {
    const tests = await MockTest.find().sort({ createdAt: -1 }).lean();
    return res.json({ tests: tests.length ? tests : fallbackTests });
  }

  if (req.method === 'POST') {
    const test = await MockTest.create(req.body || {});
    return res.status(201).json({ test });
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
