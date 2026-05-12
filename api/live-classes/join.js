import { connectMongo } from '../lib/connectMongo.js';
import LiveClass from '../../server/models/LiveClass.js';

export default async function handler(req, res) {
  await connectMongo();

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
