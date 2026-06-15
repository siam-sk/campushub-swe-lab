import admin from '../../lib/firebaseAdmin.js';
import { connectMongo } from '../../lib/connectMongo.js';
import UserProfile from '../../server/models/UserProfile.js';
import StudentUser from '../../server/models/StudentUser.js';
import FacultyUser from '../../server/models/FacultyUser.js';
import Course from '../../server/models/Course.js';
import Enrollment from '../../server/models/Enrollment.js';

const getFallbackStudentId = (email) => {
  if (!email || !email.endsWith('@campushub.edu')) return '';
  const parts = email.split('@')[0].split('.');
  if (parts.length >= 4) {
    const dept = parts[2].toUpperCase();
    const serial = parts[3];
    if (dept && serial && !isNaN(serial)) {
      return `${dept}-26-${serial}`;
    }
  }
  return '';
};

const getFallbackFacultyId = (email) => {
  if (!email || !email.endsWith('@campushub.edu')) return '';
  if (email.startsWith('faculty@')) return 'FAC-26-001';
  const name = email.split('@')[0];
  if (name === 'dr.rahman') return 'FAC-26-001';
  if (name === 'nusrat.jahan') return 'FAC-26-002';
  if (name === 'dr.ahmed') return 'FAC-26-003';
  if (name === 'salman.khan') return 'FAC-26-004';
  if (name === 'dr.sultana') return 'FAC-26-005';
  return '';
};

const enrichUsersWithIds = async (usersList) => {
  if (!usersList || !usersList.length) return [];
  const emails = usersList.map(u => u.email);
  
  const students = await StudentUser.find({ email: { $in: emails } }).lean();
  const studentsMap = {};
  students.forEach(s => {
    studentsMap[s.email] = s.studentId;
  });

  const faculty = await FacultyUser.find({ email: { $in: emails } }).lean();
  const facultyMap = {};
  faculty.forEach(f => {
    const suffix = f.uid.replace('FACULTY-', '');
    facultyMap[f.email] = `FAC-26-${suffix}`;
  });

  return usersList.map(u => {
    return {
      ...u,
      studentId: studentsMap[u.email] || getFallbackStudentId(u.email),
      facultyId: facultyMap[u.email] || getFallbackFacultyId(u.email),
    };
  });
};

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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  await connectMongo();

  const token = getTokenFromHeader(req);
  if (!token) {
    return res.status(401).json({ message: 'Missing auth token' });
  }

  try {
    const decoded = await decodeToken(token);
    const profile = await UserProfile.findOne({ uid: decoded.uid }).lean();
    
    if (!profile || profile.role !== 'admin') {
      return res.status(403).json({ message: 'Insufficient role permissions' });
    }

    const action = req.query.action?.[0] || req.query.action || 'users';
    
    let resolvedAction = action;
    let targetUid = '';
    let targetCourseId = '';

    if (action.startsWith('users/')) {
      const parts = action.split('/');
      targetUid = parts[1];
      resolvedAction = 'users-detail';
      if (parts[2] === 'status') {
        resolvedAction = 'users-status';
      }
    } else if (action.startsWith('courses/')) {
      const parts = action.split('/');
      targetCourseId = parts[1];
      resolvedAction = 'courses-detail';
      if (parts[2] === 'assign') {
        resolvedAction = 'courses-assign';
      } else if (parts[2] === 'roster') {
        resolvedAction = 'courses-roster';
      } else if (parts[2] === 'enroll') {
        resolvedAction = 'courses-enroll';
      }
    }

    // 1. List Users
    if (resolvedAction === 'users' && req.method === 'GET') {
      const role = req.query.role || 'student';
      const q = (req.query.q || '').trim();
      const dept = (req.query.dept || '').trim();

      const query = { role };

      if (q) {
        const studentEmails = await StudentUser.find({
          studentId: new RegExp(q, 'i')
        }).distinct('email');

        const facultySearchPattern = q.toUpperCase().replace(/FAC-26-/i, 'FACULTY-');
        const facultyEmails = await FacultyUser.find({
          $or: [
            { uid: new RegExp(q, 'i') },
            { uid: new RegExp(facultySearchPattern, 'i') }
          ]
        }).distinct('email');

        const matchedEmails = [...studentEmails, ...facultyEmails];

        query.$or = [
          { fullName: new RegExp(q, 'i') },
          { email: new RegExp(q, 'i') },
          { email: { $in: matchedEmails } }
        ];
      }

      if (dept) {
        query.department = dept;
      }

      const users = await UserProfile.find(query).lean();
      const enriched = await enrichUsersWithIds(users);
      return res.json({ users: enriched });
    }

    // 2. View User Details
    if (resolvedAction === 'users-detail' && req.method === 'GET') {
      const user = await UserProfile.findOne({ uid: targetUid }).lean();
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      const enriched = await enrichUsersWithIds([user]);
      return res.json({ user: enriched[0] });
    }

    // 3. Edit User
    if (resolvedAction === 'users-detail' && req.method === 'PUT') {
      const { fullName, department, year, semester, phone, bio } = req.body || {};

      const updatedProfile = await UserProfile.findOneAndUpdate(
        { uid: targetUid },
        { $set: { fullName, department, year, semester, phone, bio } },
        { new: true }
      ).lean();

      if (!updatedProfile) {
        return res.status(404).json({ message: 'User profile not found' });
      }

      if (updatedProfile.role === 'student') {
        await StudentUser.findOneAndUpdate(
          { email: updatedProfile.email },
          { $set: { fullName, department, year, semester } }
        );
      } else if (updatedProfile.role === 'faculty') {
        await FacultyUser.findOneAndUpdate(
          { email: updatedProfile.email },
          { $set: { fullName, department } }
        );
      }

      return res.json({ message: 'User updated successfully', profile: updatedProfile });
    }

    // 4. Update Status
    if (resolvedAction === 'users-status' && req.method === 'POST') {
      const { status } = req.body || {};

      if (!['active', 'suspended'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status value' });
      }

      const updatedProfile = await UserProfile.findOneAndUpdate(
        { uid: targetUid },
        { $set: { status } },
        { new: true }
      ).lean();

      if (!updatedProfile) {
        return res.status(404).json({ message: 'User profile not found' });
      }

      if (updatedProfile.role === 'student') {
        await StudentUser.findOneAndUpdate(
          { email: updatedProfile.email },
          { $set: { status } }
        );
      } else if (updatedProfile.role === 'faculty') {
        await FacultyUser.findOneAndUpdate(
          { email: updatedProfile.email },
          { $set: { status } }
        );
      }

      return res.json({ message: 'User status updated successfully', profile: updatedProfile });
    }

    // 5. GET List Courses
    if (resolvedAction === 'courses' && req.method === 'GET') {
      const courses = await Course.find().lean();
      const facultyEmails = courses.map(c => c.facultyEmail).filter(Boolean);
      const facultyList = await FacultyUser.find({ email: { $in: facultyEmails } }).lean();
      const facultyMap = {};
      facultyList.forEach(f => {
        facultyMap[f.email.toLowerCase()] = f.fullName;
      });

      const courseIds = courses.map(c => c._id);
      const enrollments = await Enrollment.aggregate([
        { $match: { courseId: { $in: courseIds } } },
        { $group: { _id: '$courseId', count: { $sum: 1 } } }
      ]);
      const enrollmentsMap = {};
      enrollments.forEach(e => {
        enrollmentsMap[e._id.toString()] = e.count;
      });

      const enrichedCourses = courses.map(c => ({
        ...c,
        id: c._id.toString(),
        facultyName: c.facultyEmail ? (facultyMap[c.facultyEmail.toLowerCase()] || c.facultyEmail) : 'Unassigned',
        studentCount: enrollmentsMap[c._id.toString()] || 0,
      }));

      return res.json({ courses: enrichedCourses });
    }

    // 6. POST Create Course
    if (resolvedAction === 'courses' && req.method === 'POST') {
      const { title, code, dept, footer, accent } = req.body || {};
      if (!title || !code) {
        return res.status(400).json({ message: 'Title and code are required' });
      }

      const existingCourse = await Course.findOne({ code }).lean();
      if (existingCourse) {
        return res.status(400).json({ message: 'Course code already exists' });
      }

      const course = await Course.create({
        title,
        code,
        dept: dept || 'Dept. of CSE',
        footer: footer || '',
        accent: accent || 'blue',
        materials: 0,
        assignments: 0,
        facultyEmail: null
      });

      return res.status(201).json({ message: 'Course created successfully', course });
    }

    // 7. PUT Edit Course
    if (resolvedAction === 'courses-detail' && req.method === 'PUT') {
      const { title, code, dept, footer, accent } = req.body || {};

      if (code) {
        const existingCourse = await Course.findOne({ code, _id: { $ne: targetCourseId } }).lean();
        if (existingCourse) {
          return res.status(400).json({ message: 'Course code already exists' });
        }
      }

      const course = await Course.findByIdAndUpdate(
        targetCourseId,
        { $set: { title, code, dept, footer, accent } },
        { new: true }
      ).lean();

      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }

      return res.json({ message: 'Course updated successfully', course });
    }

    // 8. POST Assign Faculty
    if (resolvedAction === 'courses-assign' && req.method === 'POST') {
      const { facultyEmail } = req.body || {};

      const normalizedEmail = facultyEmail ? facultyEmail.trim().toLowerCase() : null;
      if (normalizedEmail) {
        const faculty = await UserProfile.findOne({ email: normalizedEmail, role: 'faculty' }).lean();
        if (!faculty) {
          return res.status(404).json({ message: 'Faculty user not found with this email' });
        }
      }

      const course = await Course.findByIdAndUpdate(
        targetCourseId,
        { $set: { facultyEmail: normalizedEmail } },
        { new: true }
      ).lean();

      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }

      return res.json({ message: 'Faculty assigned successfully', course });
    }

    // 9. GET Course Roster
    if (resolvedAction === 'courses-roster' && req.method === 'GET') {
      const course = await Course.findById(targetCourseId).lean();
      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }

      const enrollments = await Enrollment.find({ courseId: targetCourseId }).lean();
      const studentEmails = enrollments.map(e => e.studentEmail);

      const students = await StudentUser.find({ email: { $in: studentEmails } }).lean();
      const studentsMap = {};
      students.forEach(s => {
        studentsMap[s.email.toLowerCase()] = s;
      });

      const userProfiles = await UserProfile.find({ email: { $in: studentEmails } }).lean();
      const profileMap = {};
      userProfiles.forEach(p => {
        profileMap[p.email.toLowerCase()] = p;
      });

      const roster = enrollments.map(e => {
        const emailLower = e.studentEmail.toLowerCase();
        const student = studentsMap[emailLower];
        const profile = profileMap[emailLower];
        return {
          studentId: student?.studentId || getFallbackStudentId(e.studentEmail),
          fullName: student?.fullName || profile?.fullName || e.studentEmail.split('@')[0],
          department: student?.department || profile?.department || 'N/A',
          email: e.studentEmail
        };
      });

      return res.json({ roster });
    }

    // 10. POST Enroll Student
    if (resolvedAction === 'courses-enroll' && req.method === 'POST') {
      const { studentId } = req.body || {};

      if (!studentId) {
        return res.status(400).json({ message: 'Student ID is required' });
      }

      const course = await Course.findById(targetCourseId).lean();
      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }

      const student = await StudentUser.findOne({ studentId: studentId.trim() }).lean();
      if (!student) {
        return res.status(404).json({ message: 'Student not found with this Student ID' });
      }

      const studentEmailLower = student.email.toLowerCase();

      const existingEnrollment = await Enrollment.findOne({
        courseId: targetCourseId,
        studentEmail: studentEmailLower
      }).lean();

      if (existingEnrollment) {
        return res.status(400).json({ message: 'Student is already enrolled in this course' });
      }

      const enrollment = await Enrollment.create({
        studentEmail: studentEmailLower,
        courseId: targetCourseId,
        progress: 0,
        schedule: course.footer || ''
      });

      return res.status(201).json({ message: 'Student enrolled successfully', enrollment });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Admin Serverless API handler error:', error);
    return res.status(401).json({ message: 'Unauthorized', error: error?.message || '' });
  }
}
