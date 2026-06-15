import admin from '../../lib/firebaseAdmin.js';
import { connectMongo } from '../../lib/connectMongo.js';
import Scholarship from '../../server/models/Scholarship.js';
import ScholarshipApplication from '../../server/models/ScholarshipApplication.js';
import UserProfile from '../../server/models/UserProfile.js';

const fallbackScholarships = [
  {
    title: 'Google Scholarship for Computer Science',
    provider: 'Google',
    description:
      'Scholarship for outstanding computer science students pursuing undergraduate degrees.',
    amount: '10000',
    type: 'Merit-based',
    deadline: '15/03/2026',
    countries: ['USA', 'Canada', 'India', 'Bangladesh'],
    applicants: 2450,
    awards: 50,
    categories: ['Technology'],
    eligibility: 'Undergraduate CS students with GPA 3.5+',
    isNew: true,
  },
  {
    title: 'Microsoft AI & ML Research Grant',
    provider: 'Microsoft',
    description:
      'Support for innovative AI and Machine Learning research projects.',
    amount: '15000',
    type: 'Research-based',
    deadline: '28/02/2026',
    countries: ['Global'],
    applicants: 1200,
    awards: 25,
    categories: ['Research'],
    eligibility: 'Graduate students in AI/ML with research proposal',
    isNew: true,
  },
  {
    title: 'UIU Merit Scholarship',
    provider: 'United International University',
    description: 'Tuition waiver for top academic performers in each department.',
    amount: '5000',
    type: 'Merit-based',
    deadline: '20/03/2026',
    countries: ['Bangladesh'],
    applicants: 980,
    awards: 120,
    categories: ['Education'],
    eligibility: 'Top 10 percent CGPA with no failing grades',
    isNew: false,
  },
  {
    title: 'Future Leaders Scholarship',
    provider: 'BrightPath Foundation',
    description: 'Funding for students with strong leadership and community impact.',
    amount: '8000',
    type: 'Diversity',
    deadline: '10/04/2026',
    countries: ['Bangladesh', 'India'],
    applicants: 560,
    awards: 30,
    categories: ['Diversity'],
    eligibility: 'Community leadership and minimum CGPA 3.0',
    isNew: true,
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

      const { scholarshipId, name, email } = req.body || {};
      if (!scholarshipId) {
        return res.status(400).json({ message: 'scholarshipId is required' });
      }

      const application = await ScholarshipApplication.create({ scholarshipId, name, email });
      return res.status(201).json({ application });
    } catch (error) {
      return res.status(401).json({ message: 'Unauthorized', error: error?.message || '' });
    }
  }

  if (req.method === 'GET') {
    const scholarships = await Scholarship.find().sort({ createdAt: -1 }).lean();
    return res.json({ scholarships: scholarships.length ? scholarships : fallbackScholarships });
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

      const scholarship = await Scholarship.create(req.body || {});
      return res.status(201).json({ scholarship });
    } catch (error) {
      return res.status(401).json({ message: 'Unauthorized', error: error?.message || '' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
