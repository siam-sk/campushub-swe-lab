import admin from '../../lib/firebaseAdmin.js';
import { connectMongo } from '../../lib/connectMongo.js';
import Course from '../../server/models/Course.js';
import Enrollment from '../../server/models/Enrollment.js';
import UserProfile from '../../server/models/UserProfile.js';
import Assignment from '../../server/models/Assignment.js';
import AssignmentSubmission from '../../server/models/AssignmentSubmission.js';
import Attendance from '../../server/models/Attendance.js';
import Result from '../../server/models/Result.js';

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
      name: 'Mock User',
    };
  }
  if (token.startsWith('mock-')) {
    throw new Error('Mock tokens are not allowed in production');
  }
  return await admin.auth().verifyIdToken(token);
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const token = getTokenFromHeader(req);
  if (!token) {
    return res.status(401).json({ message: 'Missing auth token' });
  }

  try {
    const decoded = await decodeToken(token);
    await connectMongo();

    const userEmail = decoded.email;
    
    // Parse URL and params
    const urlPath = (req.originalUrl || req.url || '').split('?')[0];
    const isStudentsAction = req.query.action === 'students' || urlPath.endsWith('/students');
    const isResultsAction = req.query.action === 'results' || urlPath.endsWith('/results');

    // Extract course ID
    let courseId = req.query.id || req.params?.id;
    if (!courseId) {
      const match = urlPath.match(/\/api\/courses\/([a-fA-F0-9]{24})/);
      if (match) {
        courseId = match[1];
      }
    }

    // Check user profile for role
    const profile = await UserProfile.findOne({ uid: decoded.uid }).lean();
    const isFaculty = profile?.role === 'faculty';

    if (isResultsAction) {
      if (!isFaculty) {
        return res.status(403).json({ message: 'Only faculty can view course results' });
      }

      if (!courseId) {
        return res.status(400).json({ message: 'Course ID is required' });
      }

      // Verify the course exists and the requesting faculty is assigned to it
      const course = await Course.findOne({ _id: courseId, facultyEmail: userEmail }).lean();
      if (!course) {
        return res.status(403).json({ message: 'You are not the instructor for this course' });
      }

      // Fetch enrolled students
      const enrollments = await Enrollment.find({ courseId }).lean();
      const studentEmails = enrollments.map((e) => e.studentEmail);

      const studentProfiles = await UserProfile.find({ email: { $in: studentEmails } }).lean();
      const profileMap = new Map(studentProfiles.map((p) => [p.email.toLowerCase(), p.fullName]));

      // 1. Calculate Assignment Scores
      const assignments = await Assignment.find({ courseId }).lean();
      const totalAssignments = assignments.length;

      const submissions = await AssignmentSubmission.find({
        assignmentId: { $in: assignments.map((a) => a._id) },
        studentEmail: { $in: studentEmails },
      }).lean();

      const submissionCounts = {};
      submissions.forEach((sub) => {
        const emailKey = sub.studentEmail.toLowerCase();
        submissionCounts[emailKey] = (submissionCounts[emailKey] || 0) + 1;
      });

      // 2. Calculate Attendance Scores
      const attendanceRecords = await Attendance.find({
        courseId,
        studentEmail: { $in: studentEmails },
      }).lean();

      const attendanceStats = {};
      attendanceRecords.forEach((att) => {
        const emailKey = att.studentEmail.toLowerCase();
        if (!attendanceStats[emailKey]) {
          attendanceStats[emailKey] = { total: 0, attended: 0 };
        }
        attendanceStats[emailKey].total++;
        if (att.status === 'Present' || att.status === 'Late') {
          attendanceStats[emailKey].attended++;
        }
      });

      // 3. Fetch Existing Published Results
      const publishedResults = await Result.find({
        studentEmail: { $in: studentEmails },
        courseCode: course.code,
      }).lean();

      const publishedMarksMap = new Map(
        publishedResults.map((r) => [r.studentEmail.toLowerCase(), r.marks])
      );

      // Build student results roster list
      const studentsResultsList = studentEmails.map((email) => {
        const emailKey = email.toLowerCase();
        const att = attendanceStats[emailKey] || { total: 0, attended: 0 };
        const subCount = submissionCounts[emailKey] || 0;

        const assignmentScore = totalAssignments > 0 ? Math.round((subCount / totalAssignments) * 100) : 100;
        const attendanceScore = att.total > 0 ? Math.round((att.attended / att.total) * 100) : 100;
        const finalScore = publishedMarksMap.get(emailKey) ?? null;

        return {
          studentName: profileMap.get(emailKey) || email.split('@')[0],
          studentEmail: email,
          assignmentScore,
          attendanceScore,
          finalScore,
        };
      });

      return res.json({ students: studentsResultsList });
    }

    if (isStudentsAction) {
      if (!isFaculty) {
        return res.status(403).json({ message: 'Only faculty can view student rosters' });
      }

      if (!courseId) {
        return res.status(400).json({ message: 'Course ID is required' });
      }

      // Verify the course exists and the requesting faculty is assigned to it
      const course = await Course.findOne({ _id: courseId, facultyEmail: userEmail }).lean();
      if (!course) {
        return res.status(403).json({ message: 'You are not the instructor for this course' });
      }

      // Fetch enrolled students
      const enrollments = await Enrollment.find({ courseId }).lean();
      const studentEmails = enrollments.map((e) => e.studentEmail);

      const studentProfiles = await UserProfile.find({ email: { $in: studentEmails } }).lean();
      const profileMap = new Map(studentProfiles.map((p) => [p.email.toLowerCase(), p.fullName]));

      const studentsList = studentEmails.map((email) => ({
        name: profileMap.get(email.toLowerCase()) || email.split('@')[0],
        email: email,
      }));

      return res.json({ students: studentsList });
    }

    // Standard Course retrieval logic
    if (isFaculty) {
      if (courseId) {
        // Fetch specific course details taught by this faculty member
        const course = await Course.findOne({ _id: courseId, facultyEmail: userEmail }).lean();
        if (!course) {
          return res.status(404).json({ message: 'Course not found or you are not the instructor' });
        }

        const studentCount = await Enrollment.countDocuments({ courseId });

        return res.json({
          ...course,
          id: course._id,
          students: studentCount,
        });
      } else {
        // Fetch all courses taught by the authenticated faculty member
        const courses = await Course.find({ facultyEmail: userEmail }).lean();

        const facultyCourses = await Promise.all(
          courses.map(async (c) => {
            const studentCount = await Enrollment.countDocuments({ courseId: c._id });
            return {
              id: c._id,
              title: c.title,
              code: c.code,
              dept: c.dept,
              footer: c.footer,
              accent: c.accent,
              materials: c.materials,
              assignments: c.assignments,
              students: studentCount,
            };
          })
        );

        return res.json({ courses: facultyCourses, count: facultyCourses.length });
      }
    } else {
      // Student Course list/details logic
      if (courseId) {
        const enrollment = await Enrollment.findOne({ studentEmail: userEmail, courseId })
          .populate('courseId')
          .lean();

        if (!enrollment) {
          return res.status(404).json({ message: 'Course not found or student not enrolled' });
        }

        const courseData = {
          ...enrollment.courseId,
          id: enrollment.courseId._id,
          progress: enrollment.progress,
          schedule: enrollment.schedule,
        };

        return res.json(courseData);
      } else {
        const enrollments = await Enrollment.find({ studentEmail: userEmail })
          .populate('courseId')
          .lean();

        const studentCourses = enrollments
          .filter((e) => e.courseId)
          .map((e) => ({
            id: e.courseId._id,
            title: e.courseId.title,
            code: e.courseId.code,
            dept: e.courseId.dept,
            footer: e.courseId.footer,
            accent: e.courseId.accent,
            materials: e.courseId.materials,
            assignments: e.courseId.assignments,
            progress: e.progress,
            schedule: e.schedule,
          }));

        return res.json({ courses: studentCourses, count: studentCourses.length });
      }
    }
  } catch (error) {
    return res.status(401).json({ message: 'Invalid auth token', error: error?.message || '' });
  }
}
