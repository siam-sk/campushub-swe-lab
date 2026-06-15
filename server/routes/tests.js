import express from 'express';
import MockTest from '../models/MockTest.js';
import TestAttempt from '../models/TestAttempt.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

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

// GET: list tests - metadata only
router.get('/', async (req, res) => {
  try {
    const tests = await MockTest.find({}, { questionsList: 0 }).sort({ createdAt: -1 }).lean();
    return res.json({ tests: tests.length ? tests : fallbackTests });
  } catch (err) {
    return res.status(500).json({ message: 'Error loading tests', error: err.message });
  }
});

// GET: test questions - excludes solutions key
router.get('/questions', requireAuth, async (req, res) => {
  const { testId } = req.query;
  if (!testId) {
    return res.status(400).json({ message: 'testId is required' });
  }

  try {
    const test = await MockTest.findById(testId, { 'questionsList.correctOptionIndex': 0 }).lean();
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }
    return res.json({ test });
  } catch (err) {
    return res.status(500).json({ message: 'Error loading questions', error: err.message });
  }
});

// GET: attempts history
router.get('/history', requireAuth, async (req, res) => {
  try {
    const attempts = await TestAttempt.find({ userId: req.user.uid })
      .populate('testId')
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ attempts });
  } catch (err) {
    return res.status(500).json({ message: 'Error loading history', error: err.message });
  }
});

// POST: start test
router.post('/start', requireAuth, async (req, res) => {
  const { testId } = req.body || {};
  if (!testId) {
    return res.status(400).json({ message: 'testId is required' });
  }

  try {
    const test = await MockTest.findById(testId);
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    // Increment participants
    await MockTest.findByIdAndUpdate(testId, { $inc: { participants: 1 } });

    const attempt = await TestAttempt.create({
      testId,
      userId: req.user.uid,
      email: req.user.email,
      name: req.user.name || req.user.email || 'Student',
      status: 'started',
    });

    return res.status(201).json({ attempt });
  } catch (err) {
    return res.status(500).json({ message: 'Error starting test', error: err.message });
  }
});

// POST: submit test
router.post('/submit', requireAuth, async (req, res) => {
  const { attemptId, answers } = req.body || {};
  if (!attemptId || !Array.isArray(answers)) {
    return res.status(400).json({ message: 'attemptId and answers array are required' });
  }

  try {
    const attempt = await TestAttempt.findById(attemptId);
    if (!attempt) {
      return res.status(404).json({ message: 'Attempt record not found' });
    }

    if (attempt.userId !== req.user.uid) {
      return res.status(403).json({ message: 'Unauthorized access to attempt' });
    }

    const test = await MockTest.findById(attempt.testId);
    if (!test) {
      return res.status(404).json({ message: 'Mock test not found' });
    }

    // Map selections
    const answersMap = {};
    answers.forEach((ans) => {
      answersMap[ans.questionIndex] = ans.selectedOptionIndex;
    });

    // Score computation
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
  } catch (err) {
    return res.status(500).json({ message: 'Error submitting test', error: err.message });
  }
});

// POST: create new test (faculties/admins)
router.post('/', requireAuth, async (req, res) => {
  try {
    const test = await MockTest.create(req.body || {});
    return res.status(201).json({ test });
  } catch (err) {
    return res.status(500).json({ message: 'Error creating test', error: err.message });
  }
});

export default router;
