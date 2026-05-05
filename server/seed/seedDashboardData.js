/* global process */
import 'dotenv/config';
import mongoose from 'mongoose';
import { connectMongo } from '../db/connectMongo.js';
import DashboardHome from '../models/DashboardHome.js';
import StudentUser from '../models/StudentUser.js';
import { studentUsersSeed } from './studentUsersSeed.js';

const dashboardHomeSeed = {
  key: 'home',
  greetingName: 'John',
  greetingMessage: "Here's what's happening with your studies today",
  stats: [
    { title: 'My Courses', value: '6', note: '+2 this semester', icon: '📘', accent: 'blue' },
    { title: 'New Notices', value: '5', note: '3 unread', icon: '🔔', accent: 'orange' },
    { title: 'Messages', value: '12', note: '3 new', icon: '💬', accent: 'green' },
    { title: 'GPA', value: '3.75', note: '↑ 0.15', icon: '📈', accent: 'purple' },
  ],
  courses: [
    {
      name: 'Data Structures & Algorithms',
      code: 'CSE 201',
      progress: 75,
      schedule: 'Today, 2:00 PM',
      accent: 'blue',
    },
    {
      name: 'Database Management Systems',
      code: 'CSE 301',
      progress: 60,
      schedule: 'Tomorrow, 10:00 AM',
      accent: 'green',
    },
    {
      name: 'Operating Systems',
      code: 'CSE 302',
      progress: 45,
      schedule: 'Wednesday, 11:00 AM',
      accent: 'purple',
    },
  ],
  notices: [
    { title: 'Holiday Notice', time: '2 hours ago', label: 'Holiday' },
    { title: 'Exam Schedule Updated', time: '5 hours ago', label: 'Exam' },
    { title: 'Library Timing Change', time: '1 day ago', label: 'General' },
  ],
  events: [
    { title: 'Mid-term Examination', date: 'Jan 15, 2026', type: 'Exam', accent: 'red' },
    { title: 'Tech Fest 2026', date: 'Jan 20, 2026', type: 'Event', accent: 'orange' },
    { title: 'Project Submission', date: 'Jan 25, 2026', type: 'Deadline', accent: 'yellow' },
  ],
};

const runSeed = async () => {
  const mongoState = await connectMongo();

  if (!mongoState.connected) {
    throw new Error(`MongoDB is not ready for seeding: ${mongoState.reason || 'Unknown reason'}`);
  }

  await DashboardHome.findOneAndUpdate(
    { key: 'home' },
    { $set: dashboardHomeSeed },
    { upsert: true, returnDocument: 'after' },
  );

  const operations = studentUsersSeed.map((student) => ({
    updateOne: {
      filter: { email: student.email },
      update: { $set: student },
      upsert: true,
    },
  }));

  const bulkResult = await StudentUser.bulkWrite(operations);
  const totalStudents = await StudentUser.countDocuments();

  console.log('Dashboard home seeded');
  console.log(`Student records upserted: ${bulkResult.upsertedCount + bulkResult.modifiedCount}`);
  console.log(`Total student records: ${totalStudents}`);
};

runSeed()
  .then(async () => {
    await mongoose.connection.close();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error(error.message);
    await mongoose.connection.close().catch(() => {});
    process.exit(1);
  });
