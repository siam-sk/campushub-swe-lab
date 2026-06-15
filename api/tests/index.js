import admin from '../../lib/firebaseAdmin.js';
import { connectMongo } from '../../lib/connectMongo.js';
import MockTest from '../../server/models/MockTest.js';
import TestAttempt from '../../server/models/TestAttempt.js';
import UserProfile from '../../server/models/UserProfile.js';

const fallbackTests = [
  {
    title: 'Data Structures & Algorithms',
    courseCode: 'CSE 201',
    questions: 5,
    durationMinutes: 60,
    difficulty: 'Medium',
    avgScore: 72,
    participants: 245,
  },
  {
    title: 'Database Management Systems',
    courseCode: 'CSE 301',
    questions: 5,
    durationMinutes: 45,
    difficulty: 'Easy',
    avgScore: 78,
    participants: 189,
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

  // GET Public / list tests: returns only metadata (no questionsList)
  if (!action && req.method === 'GET') {
    try {
      const tests = await MockTest.find({}, { questionsList: 0 }).sort({ createdAt: -1 }).lean();
      return res.json({ tests: tests.length ? tests : fallbackTests });
    } catch (err) {
      return res.status(500).json({ message: 'Error loading tests', error: err.message });
    }
  }

  // Token-dependent actions start here
  const token = getTokenFromHeader(req);
  if (!token) {
    return res.status(401).json({ message: 'Missing auth token' });
  }

  try {
    const decoded = await decodeToken(token);
    const profile = await UserProfile.findOne({ uid: decoded.uid }).lean();
    const role = profile?.role || 'student';

    // GET questions: returns questionsList but excludes correctOptionIndex
    if (action === 'questions' && req.method === 'GET') {
      const { testId } = req.query;
      if (!testId) {
        return res.status(400).json({ message: 'testId is required' });
      }

      const test = await MockTest.findById(testId, { 'questionsList.correctOptionIndex': 0 }).lean();
      if (!test) {
        return res.status(404).json({ message: 'Test not found' });
      }
      return res.json({ test });
    }

    // GET history: return past attempts for current user
    if (action === 'history' && req.method === 'GET') {
      const attempts = await TestAttempt.find({ userId: decoded.uid })
        .populate('testId')
        .sort({ createdAt: -1 })
        .lean();
      return res.json({ attempts });
    }

    // POST start: creates a new TestAttempt
    if (action === 'start' && req.method === 'POST') {
      const { testId } = req.body || {};
      if (!testId) {
        return res.status(400).json({ message: 'testId is required' });
      }

      const test = await MockTest.findById(testId);
      if (!test) {
        return res.status(404).json({ message: 'Test not found' });
      }

      // Increment participant count
      await MockTest.findByIdAndUpdate(testId, { $inc: { participants: 1 } });

      const attempt = await TestAttempt.create({
        testId,
        userId: decoded.uid,
        email: decoded.email,
        name: decoded.name || decoded.email || 'Student',
        status: 'started',
      });

      return res.status(201).json({ attempt });
    }

    // POST submit: scores the attempt and flags completed
    if (action === 'submit' && req.method === 'POST') {
      const { attemptId, answers } = req.body || {};
      if (!attemptId || !Array.isArray(answers)) {
        return res.status(400).json({ message: 'attemptId and answers array are required' });
      }

      const attempt = await TestAttempt.findById(attemptId);
      if (!attempt) {
        return res.status(404).json({ message: 'Attempt record not found' });
      }

      if (attempt.userId !== decoded.uid) {
        return res.status(403).json({ message: 'Unauthorized access to attempt' });
      }

      const test = await MockTest.findById(attempt.testId);
      if (!test) {
        return res.status(404).json({ message: 'Mock test not found' });
      }

      // Convert answers array to map
      const answersMap = {};
      answers.forEach((ans) => {
        answersMap[ans.questionIndex] = ans.selectedOptionIndex;
      });

      // Calculate score
      let correctAnswers = 0;
      test.questionsList.forEach((q, index) => {
        if (answersMap[index] === q.correctOptionIndex) {
          correctAnswers++;
        }
      });

      const totalQuestions = test.questionsList.length;
      const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

      attempt.score = score;
      attempt.status = 'completed';
      attempt.answers = answers;
      attempt.totalQuestions = totalQuestions;
      attempt.correctAnswers = correctAnswers;
      await attempt.save();

      return res.json({ attempt });
    }

    // POST: Create a mock test (faculties/admins only)
    if (req.method === 'POST' && !action) {
      if (!['faculty', 'admin'].includes(role)) {
        return res.status(403).json({ message: 'Insufficient role permissions' });
      }
      const test = await MockTest.create(req.body || {});
      return res.status(201).json({ test });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('API Test handler error:', error);
    return res.status(401).json({ message: 'Unauthorized', error: error?.message || '' });
  }
}
