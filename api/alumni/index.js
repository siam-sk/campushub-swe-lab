import { connectMongo } from '../lib/connectMongo.js';
import AlumniProfile from '../../server/models/AlumniProfile.js';

const fallbackAlumni = [
  {
    name: 'Dr. Rafiqul Islam',
    role: 'Senior Software Engineer',
    company: 'Google',
    location: 'California, USA',
    batch: 'Batch of 2010',
    skills: ['Machine Learning', 'Cloud Computing', 'System Design'],
    highlight: 'Published 15+ research papers, TEDx Speaker',
    tags: ['Mentoring'],
  },
  {
    name: 'Sabrina Ahmed',
    role: 'Product Manager',
    company: 'Microsoft',
    location: 'Seattle, USA',
    batch: 'Batch of 2015',
    skills: ['Product Strategy', 'AI/ML', 'Leadership'],
    highlight: 'Led teams of 50+ engineers',
    tags: ['Mentoring'],
  },
  {
    name: 'Kamal Hassan',
    role: 'Founder & CEO',
    company: 'TechStart BD',
    location: 'Dhaka, Bangladesh',
    batch: 'Batch of 2012',
    skills: ['Entrepreneurship', 'Fundraising', 'Marketing'],
    highlight: 'Raised $5M in funding, Forbes 30 Under 30',
    tags: ['Mentoring'],
  },
  {
    name: 'Nadia Khan',
    role: 'Data Scientist',
    company: 'Amazon',
    location: 'London, UK',
    batch: 'Batch of 2018',
    skills: ['Data Science', 'Python', 'Analytics'],
    highlight: 'Built analytics tools used by 3 global teams',
    tags: ['Mentoring'],
  },
  {
    name: 'Mahmud Rahman',
    role: 'Engineering Manager',
    company: 'Tesla',
    location: 'Texas, USA',
    batch: 'Batch of 2014',
    skills: ['Leadership', 'Systems', 'Scalability'],
    highlight: 'Scaled infrastructure for 2M users',
    tags: ['Mentoring'],
  },
  {
    name: 'Fatima Begum',
    role: 'UX Design Lead',
    company: 'Apple',
    location: 'Cupertino, USA',
    batch: 'Batch of 2016',
    skills: ['UX', 'Product Design', 'Design Systems'],
    highlight: 'Led design system for flagship product',
    tags: ['Mentoring'],
  },
];

export default async function handler(req, res) {
  await connectMongo();

  if (req.method === 'GET') {
    const alumni = await AlumniProfile.find().sort({ createdAt: -1 }).lean();
    return res.json({ alumni: alumni.length ? alumni : fallbackAlumni });
  }

  if (req.method === 'POST') {
    const profile = await AlumniProfile.create(req.body || {});
    return res.status(201).json({ profile });
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
