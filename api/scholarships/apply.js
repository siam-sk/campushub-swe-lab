import { connectMongo } from '../lib/connectMongo.js';
import ScholarshipApplication from '../../server/models/ScholarshipApplication.js';

export default async function handler(req, res) {
  await connectMongo();

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { scholarshipId, name, email } = req.body || {};
  if (!scholarshipId) {
    return res.status(400).json({ message: 'scholarshipId is required' });
  }

  const application = await ScholarshipApplication.create({ scholarshipId, name, email });
  return res.status(201).json({ application });
}
