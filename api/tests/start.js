import { connectMongo } from '../lib/connectMongo.js';
import TestAttempt from '../../server/models/TestAttempt.js';

export default async function handler(req, res) {
  await connectMongo();

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
