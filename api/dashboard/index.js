import StudentUser from '../../server/models/StudentUser.js';
import UserProfile from '../../server/models/UserProfile.js';
import Enrollment from '../../server/models/Enrollment.js';
import Course from '../../server/models/Course.js';
import Notice from '../../server/models/Notice.js';
import Message from '../../server/models/Message.js';
import Result from '../../server/models/Result.js';
import Assignment from '../../server/models/Assignment.js';
import AssignmentSubmission from '../../server/models/AssignmentSubmission.js';
import FacultyUser from '../../server/models/FacultyUser.js';
import { connectMongo } from '../../lib/connectMongo.js';

const getRelativeTime = (date) => {
  if (!date) return '';
  const diffMs = Date.now() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

export default async function handler(req, res) {
  const action = req.query.action?.[0] || req.query.action;

  try {
    await connectMongo();
  } catch (err) {
    return res.status(500).json({ message: 'Database connection error', error: err.message });
  }

  if (action === 'students') {
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
  }

  if (action && action !== 'home') {
    return res.status(404).json({ message: 'Not found' });
  }

  const userEmail = req.query.email;

  try {
    if (!userEmail) {
      return res.json({
        page: {
          greetingName: 'User',
          greetingMessage: 'Welcome to CampusHub',
          stats: [
            { title: 'My Courses', value: '0', note: 'No courses', icon: '📘', accent: 'blue' },
            { title: 'New Notices', value: '0', note: 'No notices', icon: '🔔', accent: 'orange' },
            { title: 'Messages', value: '0', note: 'No messages', icon: '💬', accent: 'green' },
            { title: 'GPA', value: '0.00', note: 'N/A', icon: '📈', accent: 'purple' },
          ],
          courses: [],
          notices: [],
          events: [],
        },
        source: 'empty',
      });
    }

    // Determine the user's role
    let role = 'student';
    let fullName = 'User';
    let uid = '';

    const profile = await UserProfile.findOne({ email: userEmail }).lean();
    if (profile) {
      role = profile.role;
      fullName = profile.fullName;
      uid = profile.uid;
    } else {
      const faculty = await FacultyUser.findOne({ email: userEmail }).lean();
      if (faculty) {
        role = 'faculty';
        fullName = faculty.fullName;
        uid = faculty.uid;
      } else {
        const student = await StudentUser.findOne({ email: userEmail }).lean();
        if (student) {
          role = 'student';
          fullName = student.fullName;
          uid = student.studentId;
        }
      }
    }

    const greetingName = fullName.split(' ')[0] || fullName;

    if (role === 'faculty') {
      // 1. Fetch courses taught by faculty
      const facultyCourses = await Course.find({ facultyEmail: userEmail }).lean();
      const courseIds = facultyCourses.map((c) => c._id);

      // 2. Total students enrolled across those courses
      const totalStudentsCount = await Enrollment.countDocuments({ courseId: { $in: courseIds } });

      // 3. Assignments created
      const assignments = await Assignment.find({ courseId: { $in: courseIds } }).lean();
      const assignmentIds = assignments.map((a) => a._id);

      // 4. Pending grading count (submissions where gradedAt is not set)
      const pendingGradingCount = await AssignmentSubmission.countDocuments({
        assignmentId: { $in: assignmentIds },
        gradedAt: { $exists: false },
      });

      // 5. Recent submissions
      const recentSubmissionsRaw = await AssignmentSubmission.find({
        assignmentId: { $in: assignmentIds },
      })
        .sort({ submittedAt: -1 })
        .limit(5)
        .lean();

      // Find student names for submissions
      const studentEmails = recentSubmissionsRaw.map((s) => s.studentEmail);
      const studentProfiles = await UserProfile.find({ email: { $in: studentEmails } }).lean();
      const studentProfileMap = new Map(studentProfiles.map((p) => [p.email.toLowerCase(), p.fullName]));

      const submissions = recentSubmissionsRaw.map((s) => {
        const assignment = assignments.find((a) => a._id.toString() === s.assignmentId.toString());
        return {
          id: s._id,
          studentName: studentProfileMap.get(s.studentEmail.toLowerCase()) || s.studentEmail.split('@')[0],
          studentEmail: s.studentEmail,
          assignmentTitle: assignment ? assignment.title : 'Assignment',
          courseCode: assignment && assignment.courseId ? facultyCourses.find((c) => c._id.toString() === assignment.courseId.toString())?.code || '' : '',
          submittedAt: s.submittedAt,
          marks: s.marks,
          graded: !!s.gradedAt,
        };
      });

      // 6. Recent notices for faculty
      const recentNoticesRaw = await Notice.find({
        $or: [
          { audienceRoles: { $size: 0 } },
          { audienceRoles: { $in: ['faculty'] } },
        ],
      })
        .sort({ publishAt: -1, createdAt: -1 })
        .limit(5)
        .lean();

      const notices = recentNoticesRaw.map((n) => ({
        title: n.title,
        time: getRelativeTime(n.publishAt || n.createdAt),
        label: n.category,
      }));

      // Calculate students per course mapping for rendering on courses list
      const courseStudentCounts = {};
      for (const cid of courseIds) {
        courseStudentCounts[cid.toString()] = await Enrollment.countDocuments({ courseId: cid });
      }

      return res.json({
        role: 'faculty',
        page: {
          greetingName,
          greetingMessage: 'Here is your teaching overview for today',
          stats: [
            { title: 'Total Courses', value: String(facultyCourses.length), note: 'Taught by you', icon: '📘', accent: 'blue' },
            { title: 'Total Students', value: String(totalStudentsCount), note: `Across ${facultyCourses.length} courses`, icon: '👥', accent: 'orange' },
            { title: 'Assignments', value: String(assignments.length), note: 'Created by you', icon: '📝', accent: 'purple' },
            { title: 'Pending Grading', value: String(pendingGradingCount), note: 'Submissions to grade', icon: '⏳', accent: 'green' },
          ],
          courses: facultyCourses.map((c) => ({
            id: c._id,
            title: c.title,
            code: c.code,
            dept: c.dept,
            footer: c.footer,
            accent: c.accent,
            students: courseStudentCounts[c._id.toString()] || 0,
          })),
          submissions,
          notices,
        },
        source: 'mongodb-faculty',
      });
    } else {
      // Student Dashboard
      // 1. My Courses = enrolled course count
      const enrolledCount = await Enrollment.countDocuments({ studentEmail: userEmail });

      // 2. New Notices = notice count
      const noticesCount = await Notice.countDocuments({
        $or: [
          { audienceRoles: { $size: 0 } },
          { audienceRoles: { $in: ['student'] } },
        ],
      });

      // 3. Messages = unique conversations count
      let conversationCount = 0;
      if (uid) {
        const userMsgs = await Message.find({
          $or: [{ senderId: uid }, { receiverId: uid }],
        }).lean();
        const uniquePartners = new Set();
        userMsgs.forEach((m) => {
          uniquePartners.add(m.senderId === uid ? m.receiverId : m.senderId);
        });
        conversationCount = uniquePartners.size;
      }

      // 4. GPA = calculated CGPA
      let totalAttemptedCredits = 0;
      let totalWeightedPoints = 0;
      const allResults = await Result.find({ studentEmail: userEmail }).lean();
      for (const r of allResults) {
        totalAttemptedCredits += r.credit;
        totalWeightedPoints += r.gradePoint * r.credit;
      }
      const cgpa = totalAttemptedCredits > 0 ? Number((totalWeightedPoints / totalAttemptedCredits).toFixed(2)) : 0.0;

      // 5. Recent Courses = enrolled courses
      const enrollments = await Enrollment.find({ studentEmail: userEmail }).populate('courseId').lean();
      const courses = enrollments
        .filter((e) => e.courseId)
        .map((e) => ({
          id: e.courseId._id,
          name: e.courseId.title,
          code: e.courseId.code,
          progress: e.progress || 0,
          schedule: e.schedule || 'No schedule set',
          accent: e.courseId.accent || 'blue',
        }));

      // 6. Recent Notices = latest notices
      const recentNoticesRaw = await Notice.find({
        $or: [
          { audienceRoles: { $size: 0 } },
          { audienceRoles: { $in: ['student'] } },
        ],
      })
        .sort({ publishAt: -1, createdAt: -1 })
        .limit(3)
        .lean();

      const notices = recentNoticesRaw.map((n) => ({
        title: n.title,
        time: getRelativeTime(n.publishAt || n.createdAt),
        label: n.category,
      }));

      // 7. Recent Events = latest events/exams notices
      const eventNoticesRaw = await Notice.find({
        category: { $in: ['Exam', 'Event'] },
        $or: [
          { audienceRoles: { $size: 0 } },
          { audienceRoles: { $in: ['student'] } },
        ],
      })
        .sort({ publishAt: -1, createdAt: -1 })
        .limit(3)
        .lean();

      const events = eventNoticesRaw.map((n) => ({
        title: n.title,
        date: new Date(n.publishAt || n.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        type: n.category,
        accent: n.category === 'Exam' ? 'red' : 'orange',
      }));

      return res.json({
        role: 'student',
        page: {
          greetingName,
          greetingMessage: "Here's what's happening with your studies today",
          stats: [
            { title: 'My Courses', value: String(enrolledCount), note: 'Enrolled', icon: '📘', accent: 'blue' },
            { title: 'New Notices', value: String(noticesCount), note: 'Total notices', icon: '🔔', accent: 'orange' },
            { title: 'Messages', value: String(conversationCount), note: 'Conversations', icon: '💬', accent: 'green' },
            { title: 'GPA', value: cgpa.toFixed(2), note: 'Calculated CGPA', icon: '📈', accent: 'purple' },
          ],
          courses,
          notices,
          events,
        },
        source: 'mongodb-student',
      });
    }
  } catch (err) {
    return res.json({
      error: err.message,
    });
  }
}
