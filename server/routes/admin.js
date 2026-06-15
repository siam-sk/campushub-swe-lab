import express from 'express';
import UserProfile from '../models/UserProfile.js';
import StudentUser from '../models/StudentUser.js';
import FacultyUser from '../models/FacultyUser.js';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import { requireAuth, loadUserProfile, requireRole } from '../middleware/auth.js';

const router = express.Router();

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

// 1. GET List Users
router.get('/users', requireAuth, loadUserProfile, requireRole(['admin']), async (req, res) => {
  const role = req.query.role || 'student';
  const q = (req.query.q || '').trim();
  const dept = (req.query.dept || '').trim();

  try {
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
  } catch (err) {
    return res.status(500).json({ message: 'Error fetching users', error: err.message });
  }
});

// 2. GET User Details
router.get('/users/:uid', requireAuth, loadUserProfile, requireRole(['admin']), async (req, res) => {
  const { uid } = req.params;

  try {
    const user = await UserProfile.findOne({ uid }).lean();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const enriched = await enrichUsersWithIds([user]);
    return res.json({ user: enriched[0] });
  } catch (err) {
    return res.status(500).json({ message: 'Error fetching user details', error: err.message });
  }
});

// 3. PUT Edit User
router.put('/users/:uid', requireAuth, loadUserProfile, requireRole(['admin']), async (req, res) => {
  const { uid } = req.params;
  const { fullName, department, year, semester, phone, bio } = req.body;

  try {
    const profile = await UserProfile.findOneAndUpdate(
      { uid },
      { $set: { fullName, department, year, semester, phone, bio } },
      { new: true }
    ).lean();

    if (!profile) {
      return res.status(404).json({ message: 'User profile not found' });
    }

    if (profile.role === 'student') {
      await StudentUser.findOneAndUpdate(
        { email: profile.email },
        { $set: { fullName, department, year, semester } }
      );
    } else if (profile.role === 'faculty') {
      await FacultyUser.findOneAndUpdate(
        { email: profile.email },
        { $set: { fullName, department } }
      );
    }

    return res.json({ message: 'User updated successfully', profile });
  } catch (err) {
    return res.status(500).json({ message: 'Error updating user', error: err.message });
  }
});

// 4. POST Update Status (Suspend / Activate)
router.post('/users/:uid/status', requireAuth, loadUserProfile, requireRole(['admin']), async (req, res) => {
  const { uid } = req.params;
  const { status } = req.body;

  if (!['active', 'suspended'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status value' });
  }

  try {
    const profile = await UserProfile.findOneAndUpdate(
      { uid },
      { $set: { status } },
      { new: true }
    ).lean();

    if (!profile) {
      return res.status(404).json({ message: 'User profile not found' });
    }

    if (profile.role === 'student') {
      await StudentUser.findOneAndUpdate(
        { email: profile.email },
        { $set: { status } }
      );
    } else if (profile.role === 'faculty') {
      await FacultyUser.findOneAndUpdate(
        { email: profile.email },
        { $set: { status } }
      );
    }

    return res.json({ message: 'User status updated successfully', profile });
  } catch (err) {
    return res.status(500).json({ message: 'Error updating user status', error: err.message });
  }
});

// 5. GET List Courses
router.get('/courses', requireAuth, loadUserProfile, requireRole(['admin']), async (req, res) => {
  try {
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
  } catch (err) {
    return res.status(500).json({ message: 'Error fetching courses', error: err.message });
  }
});

// 6. POST Create Course
router.post('/courses', requireAuth, loadUserProfile, requireRole(['admin']), async (req, res) => {
  const { title, code, dept, footer, accent } = req.body;
  if (!title || !code) {
    return res.status(400).json({ message: 'Title and code are required' });
  }

  try {
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
  } catch (err) {
    return res.status(500).json({ message: 'Error creating course', error: err.message });
  }
});

// 7. PUT Edit Course
router.put('/courses/:id', requireAuth, loadUserProfile, requireRole(['admin']), async (req, res) => {
  const { id } = req.params;
  const { title, code, dept, footer, accent } = req.body;

  try {
    if (code) {
      const existingCourse = await Course.findOne({ code, _id: { $ne: id } }).lean();
      if (existingCourse) {
        return res.status(400).json({ message: 'Course code already exists' });
      }
    }

    const course = await Course.findByIdAndUpdate(
      id,
      { $set: { title, code, dept, footer, accent } },
      { new: true }
    ).lean();

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    return res.json({ message: 'Course updated successfully', course });
  } catch (err) {
    return res.status(500).json({ message: 'Error updating course', error: err.message });
  }
});

// 8. POST Assign/Reassign Faculty
router.post('/courses/:id/assign', requireAuth, loadUserProfile, requireRole(['admin']), async (req, res) => {
  const { id } = req.params;
  const { facultyEmail } = req.body;

  try {
    const normalizedEmail = facultyEmail ? facultyEmail.trim().toLowerCase() : null;
    if (normalizedEmail) {
      const faculty = await UserProfile.findOne({ email: normalizedEmail, role: 'faculty' }).lean();
      if (!faculty) {
        return res.status(404).json({ message: 'Faculty user not found with this email' });
      }
    }

    const course = await Course.findByIdAndUpdate(
      id,
      { $set: { facultyEmail: normalizedEmail } },
      { new: true }
    ).lean();

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    return res.json({ message: 'Faculty assigned successfully', course });
  } catch (err) {
    return res.status(500).json({ message: 'Error assigning faculty', error: err.message });
  }
});

// 9. GET Course Roster
router.get('/courses/:id/roster', requireAuth, loadUserProfile, requireRole(['admin']), async (req, res) => {
  const { id } = req.params;

  try {
    const course = await Course.findById(id).lean();
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const enrollments = await Enrollment.find({ courseId: id }).lean();
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
  } catch (err) {
    return res.status(500).json({ message: 'Error fetching roster', error: err.message });
  }
});

// 10. POST Enroll Student
router.post('/courses/:id/enroll', requireAuth, loadUserProfile, requireRole(['admin']), async (req, res) => {
  const { id } = req.params;
  const { studentId } = req.body;

  if (!studentId) {
    return res.status(400).json({ message: 'Student ID is required' });
  }

  try {
    const course = await Course.findById(id).lean();
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const student = await StudentUser.findOne({ studentId: studentId.trim() }).lean();
    if (!student) {
      return res.status(404).json({ message: 'Student not found with this Student ID' });
    }

    const studentEmailLower = student.email.toLowerCase();

    // Check existing enrollment
    const existingEnrollment = await Enrollment.findOne({
      courseId: id,
      studentEmail: studentEmailLower
    }).lean();

    if (existingEnrollment) {
      return res.status(400).json({ message: 'Student is already enrolled in this course' });
    }

    const enrollment = await Enrollment.create({
      studentEmail: studentEmailLower,
      courseId: id,
      progress: 0,
      schedule: course.footer || ''
    });

    return res.status(201).json({ message: 'Student enrolled successfully', enrollment });
  } catch (err) {
    return res.status(500).json({ message: 'Error enrolling student', error: err.message });
  }
});

export default router;
