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
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import Assignment from '../models/Assignment.js';
import AssignmentSubmission from '../models/AssignmentSubmission.js';
import Attendance from '../models/Attendance.js';
import Result from '../models/Result.js';

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
    questions: 3,
    durationMinutes: 60,
    difficulty: 'Medium',
    avgScore: 72,
    participants: 245,
    questionsList: [
      {
        questionText: 'What is the worst-case time complexity of Quick Sort?',
        options: ['O(n)', 'O(n log n)', 'O(n²)', 'O(log n)'],
        correctOptionIndex: 2,
      },
      {
        questionText: 'Which data structure uses LIFO (Last In First Out)?',
        options: ['Queue', 'Stack', 'Heap', 'Tree'],
        correctOptionIndex: 1,
      },
      {
        questionText: 'Which traversal visits binary tree nodes in sorted order?',
        options: ['Pre-order', 'Post-order', 'In-order', 'Level-order'],
        correctOptionIndex: 2,
      },
    ],
  },
  {
    title: 'Database Management Systems',
    courseCode: 'CSE 301',
    questions: 3,
    durationMinutes: 45,
    difficulty: 'Easy',
    avgScore: 78,
    participants: 189,
    questionsList: [
      {
        questionText: 'What does SQL stand for?',
        options: ['Structured Query Language', 'Structured Question Language', 'Simple Query Language', 'Standard Query Language'],
        correctOptionIndex: 0,
      },
      {
        questionText: 'Which normal form deals with multi-valued dependency?',
        options: ['1NF', '2NF', '3NF', '4NF'],
        correctOptionIndex: 3,
      },
      {
        questionText: 'What database property ensures that a transaction is all-or-nothing?',
        options: ['Atomicity', 'Consistency', 'Isolation', 'Durability'],
        correctOptionIndex: 0,
      },
    ],
  },
  {
    title: 'Operating Systems Concepts',
    courseCode: 'CSE 302',
    questions: 0,
    durationMinutes: 50,
    difficulty: 'Medium',
    avgScore: 74,
    participants: 210,
    questionsList: [],
  },
  {
    title: 'Computer Networks',
    courseCode: 'CSE 303',
    questions: 0,
    durationMinutes: 60,
    difficulty: 'Hard',
    avgScore: 69,
    participants: 198,
    questionsList: [],
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
  const conn = await connectMongo();
  if (!conn.connected) {
    console.log('Skipping seed:', conn.reason);
    process.exit(0);
  }

  await upsertMany(Club, clubs, ['name']);
  await upsertMany(Job, jobs, ['title', 'company']);
  await upsertMany(MockTest, mockTests, ['title']);
  await upsertMany(LiveClass, liveClasses, ['title']);
  await upsertMany(AlumniProfile, alumniProfiles, ['name']);
  await upsertMany(Scholarship, scholarships, ['title']);

  await ProfilePage.findOneAndUpdate(
    { key: 'default' },
    { $set: profilePage },
    { upsert: true },
  );

  await SettingsPage.findOneAndUpdate(
    { userId: 'default' },
    {
      $set: {
        userId: 'default',
        theme: settingsPage.appearance?.theme || 'orange',
        darkMode: settingsPage.appearance?.darkMode || false,
        notificationsEnabled: settingsPage.notifications?.push || true,
        emailNotifications: settingsPage.notifications?.email || true,
        smsNotifications: true,
        language: 'English',
        accentColor: settingsPage.appearance?.theme || 'orange',
      }
    },
    { upsert: true },
  );

  if ((await AssistantMessage.countDocuments({ sessionId: 'default' })) === 0) {
    await AssistantMessage.insertMany(assistantMessages);
  }

  const demoCourses = [
    {
      title: 'Data Structures & Algorithms',
      code: 'CSE 3411',
      dept: 'Dept. of CSE',
      footer: 'Fall 25 CSE 3411/CSI 311 (H): Data Structures & Algo',
      accent: 'orange',
      materials: 12,
      assignments: 3,
      facultyEmail: 'faculty@campushub.edu',
    },
    {
      title: 'Electronics',
      code: 'CSE 2123',
      dept: 'Dept. of CSE',
      footer: 'Fall 25 CSE 123/EEE 2123 (E): Electronics',
      accent: 'blue',
      materials: 8,
      assignments: 1,
      facultyEmail: 'dr.rahman@campushub.edu',
    },
    {
      title: 'System Analysis',
      code: 'CSE 3412',
      dept: 'Dept. of CSE',
      footer: 'Fall 25 CSE 3412/CSI 312 (A): System Analysis',
      accent: 'sunset',
      materials: 5,
      assignments: 2,
      facultyEmail: 'faculty@campushub.edu',
    },
    {
      title: 'Web Programming',
      code: 'CSE 4165',
      dept: 'Dept. of CSE',
      footer: 'Fall 25 CSE 4165/CSE 465 (K): Web Programming',
      accent: 'amber',
      materials: 15,
      assignments: 4,
      facultyEmail: 'faculty@campushub.edu',
    },
    {
      title: 'Probability',
      code: 'CSE 2205',
      dept: 'Dept. of CSE',
      footer: 'Fall 25 MATH 2205/STAT 205 (D): Probability',
      accent: 'gold',
      materials: 6,
      assignments: 1,
      facultyEmail: 'nusrat.jahan@campushub.edu',
    },
    {
      title: 'Data Structures & Algorithms Lab',
      code: 'CSE 3412-lab',
      dept: 'Dept. of CSE',
      footer: 'Fall 25 CSE 3412/CSI 312 (Lab): DS&A Lab',
      accent: 'gold',
      materials: 4,
      assignments: 5,
      facultyEmail: 'faculty@campushub.edu',
    },
  ];

  await upsertMany(Course, demoCourses, ['code']);

  const students = [
    'student@campushub.edu',
    'john.student@campushub.edu',
    'tanvir.hasan@campushub.edu',
  ];

  const dbCourses = await Course.find();
  const demoEnrollments = [];

  for (const email of students) {
    let idx = 0;
    for (const course of dbCourses) {
      if (idx % 2 === 0) {
        demoEnrollments.push({
          studentEmail: email,
          courseId: course._id,
          progress: 40 + (idx * 10) % 60,
          schedule: idx === 0 ? 'Today, 2:00 PM' : idx === 2 ? 'Tomorrow, 10:00 AM' : 'Wednesday, 11:00 AM',
        });
      }
      idx++;
    }
  }

  await Enrollment.deleteMany({ studentEmail: { $in: students } });
  await Enrollment.insertMany(demoEnrollments);

  await Assignment.deleteMany({});
  await AssignmentSubmission.deleteMany({});

  const demoAssignments = [];
  for (const course of dbCourses) {
    demoAssignments.push({
      courseId: course._id,
      title: `${course.title} Assignment 1`,
      description: `Implement the core concepts discussed in the introductory lectures of ${course.code}.`,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    demoAssignments.push({
      courseId: course._id,
      title: `${course.title} Midterm Project`,
      description: `Submit your midterm project proposal for review in ${course.code}.`,
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    });
  }
  await Assignment.insertMany(demoAssignments);

  await Attendance.deleteMany({});
  const demoAttendance = [];
  const statuses = ['Present', 'Present', 'Present', 'Present', 'Absent', 'Late'];

  for (const enrollment of demoEnrollments) {
    for (let i = 0; i < 10; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const status = statuses[(enrollment.progress + i) % statuses.length];

      demoAttendance.push({
        studentEmail: enrollment.studentEmail,
        courseId: enrollment.courseId,
        date,
        status,
      });
    }
  }
  await Attendance.insertMany(demoAttendance);

  // Seed Results
  await Result.deleteMany({});
  const demoResults = [];
  const gradeScale = [
    { grade: 'A', gp: 4.0 },
    { grade: 'A-', gp: 3.7 },
    { grade: 'B+', gp: 3.3 },
    { grade: 'B', gp: 3.0 },
    { grade: 'B-', gp: 2.7 },
    { grade: 'C+', gp: 2.3 },
    { grade: 'C', gp: 2.0 },
    { grade: 'C-', gp: 1.7 },
    { grade: 'D+', gp: 1.3 },
    { grade: 'D', gp: 1.0 },
    { grade: 'F', gp: 0.0 }
  ];

  const coursesTemplate = [
    { sem: 'Semester 1', code: 'CSE 1111', title: 'Structured Programming', credit: 3, baseIdx: 0 },
    { sem: 'Semester 1', code: 'CSE 1112', title: 'Structured Programming Lab', credit: 1, baseIdx: 1 },
    { sem: 'Semester 1', code: 'MATH 1151', title: 'Calculus I', credit: 3, baseIdx: 2 },
    { sem: 'Semester 1', code: 'ENG 1011', title: 'English Composition', credit: 3, baseIdx: 0 },

    { sem: 'Semester 2', code: 'CSE 2111', title: 'Object Oriented Programming', credit: 3, baseIdx: 3 },
    { sem: 'Semester 2', code: 'CSE 2112', title: 'Object Oriented Programming Lab', credit: 1, baseIdx: 0 },
    { sem: 'Semester 2', code: 'CSE 2213', title: 'Discrete Mathematics', credit: 3, baseIdx: 4 },
    { sem: 'Semester 2', code: 'MATH 2183', title: 'Linear Algebra', credit: 3, baseIdx: 2 },

    { sem: 'Semester 3', code: 'CSE 3411', title: 'Data Structures & Algorithms', credit: 3, baseIdx: 1 },
    { sem: 'Semester 3', code: 'CSE 3412-lab', title: 'Data Structures & Algorithms Lab', credit: 1, baseIdx: 0 },
    { sem: 'Semester 3', code: 'CSE 2123', title: 'Electronics', credit: 3, baseIdx: 3 },
    { sem: 'Semester 3', code: 'CSE 2205', title: 'Probability & Statistics', credit: 3, baseIdx: 4 },

    { sem: 'Semester 4', code: 'CSE 3412', title: 'System Analysis', credit: 3, baseIdx: 0 },
    { sem: 'Semester 4', code: 'CSE 4165', title: 'Web Programming', credit: 3, baseIdx: 1 },
    { sem: 'Semester 4', code: 'CSE 3011', title: 'Database Management Systems', credit: 3, baseIdx: 2 },
    { sem: 'Semester 4', code: 'CSE 3012', title: 'Database Management Systems Lab', credit: 1, baseIdx: 0 },
  ];

  for (const email of students) {
    const studentOffset = email.startsWith('john') ? 1 : email.startsWith('tanvir') ? 2 : 0;
    for (const c of coursesTemplate) {
      const gradeObj = gradeScale[(c.baseIdx + studentOffset) % gradeScale.length];
      demoResults.push({
        studentEmail: email,
        semester: c.sem,
        courseCode: c.code,
        courseTitle: c.title,
        credit: c.credit,
        grade: gradeObj.grade,
        gradePoint: gradeObj.gp
      });
    }
  }

  await Result.insertMany(demoResults);

  console.log('Demo data seeded.');
  process.exit(0);
};

run().catch((error) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});
