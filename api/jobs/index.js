import { connectMongo } from '../../lib/connectMongo.js';
import Job from '../../server/models/Job.js';
import JobApplication from '../../server/models/JobApplication.js';

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

export default async function handler(req, res) {
  await connectMongo();

  const action = req.query.action?.[0] || req.query.action;
  if (action === 'apply') {
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

  if (req.method === 'GET') {
    const jobs = await Job.find().sort({ createdAt: -1 }).lean();
    return res.json({ jobs: jobs.length ? jobs : fallbackJobs });
  }

  if (req.method === 'POST') {
    const job = await Job.create(req.body || {});
    return res.status(201).json({ job });
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
