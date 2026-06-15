import express from 'express';
import UserProfile from '../models/UserProfile.js';
import StudentUser from '../models/StudentUser.js';
import FacultyUser from '../models/FacultyUser.js';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

const compileAdminProfile = async (user, reqUser) => {
  const fullName = user?.fullName || reqUser.name || reqUser.email.split('@')[0];
  const dept = user?.department || 'Administration';

  const [totalStudents, totalFaculty, totalCourses, totalEnrollments] = await Promise.all([
    StudentUser.countDocuments(),
    FacultyUser.countDocuments(),
    Course.countDocuments(),
    Enrollment.countDocuments(),
  ]);

  return {
    role: 'admin',
    tabs: ['Admin Profile', 'Settings'],
    stats: {
      totalStudents,
      totalFaculty,
      totalCourses,
      totalEnrollments,
    },
    profileInfo: {
      fullName,
      email: reqUser.email,
      department: dept,
      phone: user?.phone || '',
      bio: user?.bio || '',
      skills: user?.skills || [],
      avatarUrl: user?.avatarUrl || '',
    },
  };
};

const compileStudentProfile = (user, student, reqUser) => {
  const cgpa = user?.gpa || student?.gpa || 3.44;
  const fullName = user?.fullName || student?.fullName || reqUser.name || reqUser.email.split('@')[0];
  const dept = user?.department || student?.department || 'Computer Science & Engineering';

  return {
    role: 'student',
    tabs: [
      'Student Accounts',
      'Transport Registration',
      'Result',
      'Registration',
    ],
    stats: {
      cgpa,
      completedCredits: student ? 70 : 0,
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
      scores: [2.8, 3.0, 3.2, 3.1, cgpa],
    },
    attendanceSummary: {
      label: 'No attendance data available',
    },
    profileInfo: {
      fullName,
      studentId: student?.studentId || '01122XXXX',
      dob: user?.dob || '',
      phone: user?.phone || '',
      bio: user?.bio || '',
      skills: user?.skills || [],
      linkedinUrl: user?.linkedinUrl || '',
      avatarUrl: user?.avatarUrl || student?.avatarUrl || '',
      department: dept,
      year: user?.year || student?.year || '3rd Year',
    },
  };
};

const compileFacultyProfile = (user, faculty, reqUser) => {
  const fullName = user?.fullName || faculty?.fullName || reqUser.name || reqUser.email.split('@')[0];
  const dept = user?.department || faculty?.department || 'Computer Science & Engineering';
  const designation = faculty?.designation || 'Faculty Member';
  const officeLocation = faculty?.officeLocation || 'N/A';

  return {
    role: 'faculty',
    tabs: [
      'Teaching Profile',
      'Settings',
    ],
    stats: {
      designation,
      officeLocation,
      department: dept,
    },
    profileInfo: {
      fullName,
      dob: user?.dob || '',
      phone: user?.phone || faculty?.contactInfo || '',
      bio: user?.bio || '',
      skills: user?.skills || [],
      linkedinUrl: user?.linkedinUrl || '',
      avatarUrl: user?.avatarUrl || faculty?.avatarUrl || '',
      department: dept,
      designation,
      officeLocation,
    },
  };
};

// GET: Load authenticated user profile details
router.get('/', requireAuth, async (req, res) => {
  try {
    let user = await UserProfile.findOne({ uid: req.user.uid }).lean();
    const role = user?.role || 'student';

    if (role === 'admin') {
      const profileData = await compileAdminProfile(user, req.user);
      return res.json({ profile: profileData });
    } else if (role === 'faculty') {
      let faculty = await FacultyUser.findOne({ email: req.user.email }).lean();
      const profileData = compileFacultyProfile(user, faculty, req.user);
      return res.json({ profile: profileData });
    } else {
      let student = await StudentUser.findOne({ email: req.user.email }).lean();
      const profileData = compileStudentProfile(user, student, req.user);
      return res.json({ profile: profileData });
    }
  } catch (err) {
    return res.status(500).json({ message: 'Error loading profile', error: err.message });
  }
});

// POST: Save updates to the user profile
router.post('/', requireAuth, async (req, res) => {
  const { phone, bio, dob, skills, linkedinUrl, avatarUrl } = req.body || {};

  try {
    const updateFields = {};
    if (phone !== undefined) updateFields.phone = phone;
    if (bio !== undefined) updateFields.bio = bio;
    if (dob !== undefined) updateFields.dob = dob;
    if (skills !== undefined) updateFields.skills = Array.isArray(skills) ? skills : [];
    if (linkedinUrl !== undefined) updateFields.linkedinUrl = linkedinUrl;
    if (avatarUrl !== undefined) updateFields.avatarUrl = avatarUrl;

    // Update UserProfile matching uid securely
    let user = await UserProfile.findOneAndUpdate(
      { uid: req.user.uid },
      { $set: updateFields },
      { new: true, upsert: true }
    ).lean();

    const role = user?.role || 'student';

    if (role === 'admin') {
      const profileData = await compileAdminProfile(user, req.user);
      return res.json({ profile: profileData, message: 'Profile updated successfully' });
    } else if (role === 'faculty') {
      let faculty = await FacultyUser.findOne({ email: req.user.email }).lean();
      const profileData = compileFacultyProfile(user, faculty, req.user);
      return res.json({ profile: profileData, message: 'Profile updated successfully' });
    } else {
      let student = await StudentUser.findOne({ email: req.user.email }).lean();
      const profileData = compileStudentProfile(user, student, req.user);
      return res.json({ profile: profileData, message: 'Profile updated successfully' });
    }
  } catch (err) {
    return res.status(500).json({ message: 'Error updating profile', error: err.message });
  }
});

export default router;
