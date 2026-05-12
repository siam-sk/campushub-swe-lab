import { connectMongo } from '../lib/connectMongo.js';
import AlumniProfile from '../../server/models/AlumniProfile.js';

export default async function handler(req, res) {
  await connectMongo();

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { alumniId } = req.body || {};
  if (!alumniId) {
    return res.status(400).json({ message: 'alumniId is required' });
  }

  const profile = await AlumniProfile.findById(alumniId).lean();
  return res.json({ message: 'Mentorship request sent', profile });
}
