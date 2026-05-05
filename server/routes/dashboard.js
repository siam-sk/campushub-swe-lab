import express from 'express';
import DashboardHome from '../models/DashboardHome.js';
import StudentUser from '../models/StudentUser.js';

const router = express.Router();

const fallbackHome = {
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

router.get('/home', async (req, res) => {
  try {
    const userEmail = req.query.email;

    // If user email provided, fetch their specific student data
    if (userEmail) {
      const student = await StudentUser.findOne({ email: userEmail }).lean();

      if (student) {
        return res.json({
          page: {
            greetingName: student.fullName.split(' ')[0], // First name only
            greetingMessage: "Here's what's happening with your studies today",
            stats: [
              { title: 'My Courses', value: student.dashboardMeta?.coursesEnrolled || '0', note: 'Enrolled', icon: '📘', accent: 'blue' },
              { title: 'New Notices', value: student.dashboardMeta?.noticesUnread || '0', note: 'Unread', icon: '🔔', accent: 'orange' },
              { title: 'Messages', value: student.dashboardMeta?.messagesUnread || '0', note: 'New', icon: '💬', accent: 'green' },
              { title: 'GPA', value: (student.gpa || 0).toFixed(2), note: student.year, icon: '📈', accent: 'purple' },
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
          },
          source: 'mongodb-user',
        });
      }
    }

    // Fall back to generic home data
    const dashboardHome = await DashboardHome.findOne({ key: 'home' }).lean();

    return res.json({
      page: dashboardHome || fallbackHome,
      source: dashboardHome ? 'mongodb' : 'fallback',
    });
  } catch {
    return res.json({
      page: fallbackHome,
      source: 'fallback',
    });
  }
});

router.get('/students', async (req, res) => {
  try {
    const students = await StudentUser.find()
      .sort({ createdAt: 1 })
      .select('studentId fullName email department year semester gpa status dashboardMeta')
      .lean();

    return res.json({
      students,
      count: students.length,
      source: 'mongodb',
    });
  } catch {
    return res.status(500).json({
      students: [],
      count: 0,
      source: 'error',
      message: 'Unable to fetch students',
    });
  }
});

export default router;
