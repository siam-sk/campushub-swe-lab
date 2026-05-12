import { connectMongo } from '../lib/connectMongo.js';
import Scholarship from '../../server/models/Scholarship.js';

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

export default async function handler(req, res) {
  await connectMongo();

  if (req.method === 'GET') {
    const scholarships = await Scholarship.find().sort({ createdAt: -1 }).lean();
    return res.json({ scholarships: scholarships.length ? scholarships : fallbackScholarships });
  }

  if (req.method === 'POST') {
    const scholarship = await Scholarship.create(req.body || {});
    return res.status(201).json({ scholarship });
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
