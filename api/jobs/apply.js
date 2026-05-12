import { connectMongo } from '../lib/connectMongo.js';
import JobApplication from '../../server/models/JobApplication.js';

export default async function handler(req, res) {
  await connectMongo();

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { jobId, name, email, resumeUrl } = req.body || {};
  if (!jobId) {
    return res.status(400).json({ message: 'jobId is required' });
  }

  const application = await JobApplication.create({ jobId, name, email, resumeUrl });
  return res.status(201).json({ application });
}
