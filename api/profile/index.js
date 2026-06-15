import admin from '../../lib/firebaseAdmin.js';
import { connectMongo } from '../../lib/connectMongo.js';
import UserProfile from '../../server/models/UserProfile.js';
import StudentUser from '../../server/models/StudentUser.js';
import FacultyUser from '../../server/models/FacultyUser.js';
import Course from '../../server/models/Course.js';
import Enrollment from '../../server/models/Enrollment.js';

const compileAdminProfile = async (user, decoded) => {
  const fullName = user?.fullName || decoded.name || decoded.email.split('@')[0];
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
      email: decoded.email,
      department: dept,
      phone: user?.phone || '',
      bio: user?.bio || '',
      skills: user?.skills || [],
      avatarUrl: user?.avatarUrl || '',
    },
  };
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

const compileStudentProfile = (user, student, decoded) => {
  const cgpa = user?.gpa || student?.gpa || 3.44;
  const fullName = user?.fullName || student?.fullName || decoded.name || decoded.email.split('@')[0];
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

const compileFacultyProfile = (user, faculty, decoded) => {
  const fullName = user?.fullName || faculty?.fullName || decoded.name || decoded.email.split('@')[0];
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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
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
    let user = await UserProfile.findOne({ uid: decoded.uid }).lean();
    const role = user?.role || 'student';

    // GET: Load authenticated user profile details
    if (req.method === 'GET') {
      if (role === 'admin') {
        const profileData = await compileAdminProfile(user, decoded);
        return res.json({ profile: profileData });
      } else if (role === 'faculty') {
        let faculty = await FacultyUser.findOne({ email: decoded.email }).lean();
        const profileData = compileFacultyProfile(user, faculty, decoded);
        return res.json({ profile: profileData });
      } else {
        let student = await StudentUser.findOne({ email: decoded.email }).lean();
        const profileData = compileStudentProfile(user, student, decoded);
        return res.json({ profile: profileData });
      }
    }

    // POST: Save updates to the user profile
    if (req.method === 'POST') {
      const { phone, bio, dob, skills, linkedinUrl, avatarUrl } = req.body || {};

      const updateFields = {};
      if (phone !== undefined) updateFields.phone = phone;
      if (bio !== undefined) updateFields.bio = bio;
      if (dob !== undefined) updateFields.dob = dob;
      if (skills !== undefined) updateFields.skills = Array.isArray(skills) ? skills : [];
      if (linkedinUrl !== undefined) updateFields.linkedinUrl = linkedinUrl;
      if (avatarUrl !== undefined) updateFields.avatarUrl = avatarUrl;

      // Update UserProfile
      user = await UserProfile.findOneAndUpdate(
        { uid: decoded.uid },
        { $set: updateFields },
        { new: true, upsert: true }
      ).lean();

      const updatedRole = user?.role || 'student';

      if (updatedRole === 'admin') {
        const profileData = await compileAdminProfile(user, decoded);
        return res.json({ profile: profileData, message: 'Profile updated successfully' });
      } else if (updatedRole === 'faculty') {
        let faculty = await FacultyUser.findOne({ email: decoded.email }).lean();
        const profileData = compileFacultyProfile(user, faculty, decoded);
        return res.json({ profile: profileData, message: 'Profile updated successfully' });
      } else {
        let student = await StudentUser.findOne({ email: decoded.email }).lean();
        const profileData = compileStudentProfile(user, student, decoded);
        return res.json({ profile: profileData, message: 'Profile updated successfully' });
      }
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('API Profile handler error:', error);
    return res.status(401).json({ message: 'Unauthorized', error: error?.message || '' });
  }
}
