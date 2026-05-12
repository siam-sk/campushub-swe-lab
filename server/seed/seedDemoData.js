/* global process */
import dotenv from 'dotenv';
import { connectMongo } from '../db/connectMongo.js';
import Club from '../models/Club.js';
import Job from '../models/Job.js';
import MockTest from '../models/MockTest.js';
import LiveClass from '../models/LiveClass.js';
import AlumniProfile from '../models/AlumniProfile.js';
import Scholarship from '../models/Scholarship.js';
import ProfilePage from '../models/ProfilePage.js';
import SettingsPage from '../models/SettingsPage.js';
import AssistantMessage from '../models/AssistantMessage.js';

dotenv.config();

const clubs = [
  {
    name: 'UIU Robotics Club',
    summary: 'Date & Time: October 20, 2025 · 10:00 AM - 3:00 PM',
    date: 'October 20, 2025',
    time: '10:00 AM - 3:00 PM',
    venue: 'Innovation Lab, Main Campus',
    description:
      'Join us for RoboFest 2025, a day robotics competition where innovation meets engineering excellence.',
    memberCount: 245,
  },
  {
    name: 'UIU Computer Club',
    summary: 'Date & Time: November 5, 2025 · 9:00 AM - 5:00 PM',
    date: 'November 5, 2025',
    time: '9:00 AM - 5:00 PM',
    venue: 'Innovation Lab, Main Campus',
    description:
      'Hack the Future 2025 is an exhilarating 24-hour hackathon for programmers, designers, and innovators.',
    memberCount: 189,
  },
  {
    name: 'UIU Cultural Club',
    summary: 'Date & Time: December 15, 2025 · 5:00 PM - 9:00 PM',
    date: 'December 15, 2025',
    time: '5:00 PM - 9:00 PM',
    venue: 'Playground, 4B&C',
    description: 'Experience the vibrant diversity of our campus at Fusion Fest 2025.',
    memberCount: 312,
  },
  {
    name: 'UIU Photography Club',
    summary: 'Date & Time: January 12, 2026 · 2:00 PM - 6:00 PM',
    date: 'January 12, 2026',
    time: '2:00 PM - 6:00 PM',
    venue: 'Media Lab, Building B',
    description: 'Photo walk and editing workshop for beginners and enthusiasts.',
    memberCount: 178,
  },
  {
    name: 'UIU Debate Society',
    summary: 'Date & Time: January 20, 2026 · 4:00 PM - 7:00 PM',
    date: 'January 20, 2026',
    time: '4:00 PM - 7:00 PM',
    venue: 'Auditorium, Main Campus',
    description: 'Weekly debate sessions and mock tournaments to sharpen public speaking.',
    memberCount: 267,
  },
  {
    name: 'UIU Sports Club',
    summary: 'Date & Time: January 28, 2026 · 3:00 PM - 6:00 PM',
    date: 'January 28, 2026',
    time: '3:00 PM - 6:00 PM',
    venue: 'Sports Ground',
    description: 'Inter-department football and badminton tryouts for the spring season.',
    memberCount: 423,
  },
];

const jobs = [
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

const mockTests = [
  {
    title: 'Data Structures & Algorithms',
    courseCode: 'CSE 201',
    questions: 50,
    durationMinutes: 60,
    difficulty: 'Medium',
    avgScore: 72,
    participants: 245,
  },
  {
    title: 'Database Management Systems',
    courseCode: 'CSE 301',
    questions: 40,
    durationMinutes: 45,
    difficulty: 'Easy',
    avgScore: 78,
    participants: 189,
  },
  {
    title: 'Operating Systems Concepts',
    courseCode: 'CSE 302',
    questions: 45,
    durationMinutes: 50,
    difficulty: 'Medium',
    avgScore: 74,
    participants: 210,
  },
  {
    title: 'Computer Networks',
    courseCode: 'CSE 303',
    questions: 55,
    durationMinutes: 60,
    difficulty: 'Hard',
    avgScore: 69,
    participants: 198,
  },
];

const liveClasses = [
  {
    title: 'Machine Learning Fundamentals',
    instructor: 'Prof. Karim Rahman',
    durationMinutes: 120,
    attendees: 38,
    capacity: 40,
    status: 'live',
    startTime: new Date('2026-01-02T09:00:00.000Z'),
  },
  {
    title: 'Advanced React Patterns',
    instructor: 'Ayesha Rahman',
    durationMinutes: 90,
    attendees: 0,
    capacity: 40,
    status: 'upcoming',
    startTime: new Date('2026-01-05T10:00:00.000Z'),
  },
  {
    title: 'Data Structures Deep Dive',
    instructor: 'Zahid Hasan',
    durationMinutes: 75,
    attendees: 0,
    capacity: 40,
    status: 'upcoming',
    startTime: new Date('2026-01-07T02:00:00.000Z'),
  },
  {
    title: 'Operating Systems Lab Review',
    instructor: 'Nusrat Jahan',
    durationMinutes: 60,
    attendees: 0,
    capacity: 30,
    status: 'upcoming',
    startTime: new Date('2026-01-09T11:00:00.000Z'),
  },
];

const alumniProfiles = [
  {
    name: 'Dr. Rafiqul Islam',
    role: 'Senior Software Engineer',
    company: 'Google',
    location: 'California, USA',
    batch: 'Batch of 2010',
    skills: ['Machine Learning', 'Cloud Computing', 'System Design'],
    highlight: 'Published 15+ research papers, TEDx Speaker',
  },
  {
    name: 'Sabrina Ahmed',
    role: 'Product Manager',
    company: 'Microsoft',
    location: 'Seattle, USA',
    batch: 'Batch of 2015',
    skills: ['Product Strategy', 'AI/ML', 'Leadership'],
    highlight: 'Led teams of 50+ engineers',
  },
  {
    name: 'Kamal Hassan',
    role: 'Founder & CEO',
    company: 'TechStart BD',
    location: 'Dhaka, Bangladesh',
    batch: 'Batch of 2012',
    skills: ['Entrepreneurship', 'Fundraising', 'Marketing'],
    highlight: 'Raised $5M in funding, Forbes 30 Under 30',
  },
  {
    name: 'Nadia Khan',
    role: 'Data Scientist',
    company: 'Amazon',
    location: 'London, UK',
    batch: 'Batch of 2018',
    skills: ['Data Science', 'Python', 'Analytics'],
    highlight: 'Built analytics tools used by 3 global teams',
  },
  {
    name: 'Mahmud Rahman',
    role: 'Engineering Manager',
    company: 'Tesla',
    location: 'Texas, USA',
    batch: 'Batch of 2014',
    skills: ['Leadership', 'Systems', 'Scalability'],
    highlight: 'Scaled infrastructure for 2M users',
  },
  {
    name: 'Fatima Begum',
    role: 'UX Design Lead',
    company: 'Apple',
    location: 'Cupertino, USA',
    batch: 'Batch of 2016',
    skills: ['UX', 'Product Design', 'Design Systems'],
    highlight: 'Led design system for flagship product',
  },
];

const scholarships = [
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
    description: 'Support for innovative AI and Machine Learning research projects.',
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

const profilePage = {
  key: 'default',
  tabs: [
    'Student Accounts',
    'Transport Registration',
    'Admin Control',
    'Scheduler',
    'Result',
    'Registration',
  ],
  stats: {
    cgpa: 3.44,
    completedCredits: 70,
    balance: 0,
  },
  advisor: {
    name: 'Akbor Ali',
    initials: 'AKI',
    email: 'sjsakjd@cse.uiu.ac.bd',
    room: '123 (D)',
    phone: 'xxxxxxxxxxxx',
  },
  resultSummary: {
    labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5'],
    scores: [2.8, 3.0, 3.2, 3.1, 3.4],
  },
  attendanceSummary: {
    label: 'No attendance data available',
  },
  profileInfo: {
    fullName: 'John Smith',
    studentId: '01122XXXX',
    dob: '01 September, 2000',
    phone: '017XXXXXXXXXX',
  },
};

const settingsPage = {
  key: 'default',
  profile: {
    fullName: 'John Student',
    studentId: '2021CSE089',
    email: 'john.student@university.edu',
    phone: '+880 1234-567890',
    department: 'Computer Science & Engineering',
    year: '3rd Year',
    bio: 'Tell us about yourself...',
    avatarUrl: '',
  },
  notifications: {
    push: true,
    email: true,
    notices: true,
    messages: true,
  },
  privacy: {
    publicProfile: true,
    showEmail: false,
    showPhone: false,
  },
  appearance: {
    darkMode: false,
    theme: 'orange',
  },
};

const assistantMessages = [
  { sessionId: 'default', sender: 'assistant', body: 'Hello! I am your AI study assistant.' },
  { sessionId: 'default', sender: 'assistant', body: 'Ask me about concepts, problems, or debugging.' },
];

const upsertMany = async (model, items, keyFields) => {
  const ops = items.map((item) => ({
    updateOne: {
      filter: keyFields.reduce((acc, field) => {
        acc[field] = item[field];
        return acc;
      }, {}),
      update: { $set: item },
      upsert: true,
    },
  }));

  if (ops.length) {
    await model.bulkWrite(ops);
  }
};

const run = async () => {
  await connectMongo();

  await upsertMany(Club, clubs, ['name']);
  await upsertMany(Job, jobs, ['title', 'company']);
  await upsertMany(MockTest, mockTests, ['title']);
  await upsertMany(LiveClass, liveClasses, ['title']);
  await upsertMany(AlumniProfile, alumniProfiles, ['name']);
  await upsertMany(Scholarship, scholarships, ['title']);

  await ProfilePage.findOneAndUpdate(
    { key: 'default' },
    { $set: profilePage, $setOnInsert: { key: 'default' } },
    { upsert: true },
  );

  await SettingsPage.findOneAndUpdate(
    { key: 'default' },
    { $set: settingsPage, $setOnInsert: { key: 'default' } },
    { upsert: true },
  );

  if ((await AssistantMessage.countDocuments({ sessionId: 'default' })) === 0) {
    await AssistantMessage.insertMany(assistantMessages);
  }

  console.log('Demo data seeded.');
  process.exit(0);
};

run().catch((error) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});
