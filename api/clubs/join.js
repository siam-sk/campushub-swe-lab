import { connectMongo } from '../lib/connectMongo.js';
import Club from '../../server/models/Club.js';

export default async function handler(req, res) {
  await connectMongo();

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
