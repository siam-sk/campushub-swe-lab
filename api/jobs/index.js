import admin from '../../lib/firebaseAdmin.js';
import { connectMongo } from '../../lib/connectMongo.js';
import Job from '../../server/models/Job.js';
import JobApplication from '../../server/models/JobApplication.js';
import UserProfile from '../../server/models/UserProfile.js';

const fallbackJobs = [
  {
    title: 'Frontend Developer Intern',
    company: 'Tech Innovations Ltd.',
    description: 'Looking for React.js developers with good understanding of modern web technologies.',
    tags: ['React', 'JavaScript', 'Tailwind CSS'],
    type: 'Internship',
    location: 'Dhaka, Bangladesh',
    salaryRange: 'BDT 15000 - 20000',
    deadline: 'Jan 25, 2026',
    isNew: true,
    isFeatured: true,
  },
  {
    title: 'Full Stack Developer',
    company: 'Digital Solutions BD',
    description: 'Join our team to build scalable web applications using MERN stack.',
    tags: ['Node.js', 'MongoDB', 'Express', 'React'],
    type: 'Full-time',
    location: 'Dhaka, Bangladesh',
    salaryRange: 'BDT 60000 - 80000',
    deadline: 'Feb 01, 2026',
    isNew: true,
  },
  {
    title: 'UI/UX Designer',
    company: 'PixelCraft Studio',
    description: 'Design clean and accessible UI for mobile and web products.',
    tags: ['Figma', 'Design Systems', 'User Research'],
    type: 'Part-time',
    location: 'Remote',
    salaryRange: 'BDT 30000 - 45000',
    deadline: 'Feb 05, 2026',
  },
  {
    title: 'Backend Engineer',
    company: 'CloudWorks',
    description: 'Build robust APIs and services for campus tools and analytics.',
    tags: ['Node.js', 'PostgreSQL', 'Docker'],
    type: 'Full-time',
    location: 'Chattogram, Bangladesh',
    salaryRange: 'BDT 70000 - 90000',
    deadline: 'Feb 10, 2026',
    isFeatured: true,
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
  if (action === 'apply') {
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    const token = getTokenFromHeader(req);
    if (!token) {
      return res.status(401).json({ message: 'Missing auth token' });
    }

    try {
      await decodeToken(token);

      const { jobId, name, email, resumeUrl } = req.body || {};
      if (!jobId) {
        return res.status(400).json({ message: 'jobId is required' });
      }

      const application = await JobApplication.create({ jobId, name, email, resumeUrl });
      return res.status(201).json({ application });
    } catch (error) {
      return res.status(401).json({ message: 'Unauthorized', error: error?.message || '' });
    }
  }

  if (req.method === 'GET') {
    const jobs = await Job.find().sort({ createdAt: -1 }).lean();
    return res.json({ jobs: jobs.length ? jobs : fallbackJobs });
  }

  if (req.method === 'POST') {
    const token = getTokenFromHeader(req);
    if (!token) {
      return res.status(401).json({ message: 'Missing auth token' });
    }

    try {
      const decoded = await decodeToken(token);
      const profile = await UserProfile.findOne({ uid: decoded.uid }).lean();
      const role = profile?.role || 'student';

      if (!['faculty', 'admin'].includes(role)) {
        return res.status(403).json({ message: 'Insufficient role permissions' });
      }

      const job = await Job.create(req.body || {});
      return res.status(201).json({ job });
    } catch (error) {
      return res.status(401).json({ message: 'Unauthorized', error: error?.message || '' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
