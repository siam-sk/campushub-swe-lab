import express from 'express';
import UserProfile from '../models/UserProfile.js';
import Message from '../models/Message.js';
import StudentUser from '../models/StudentUser.js';
import FacultyUser from '../models/FacultyUser.js';
import { requireAuth } from '../middleware/auth.js';

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
  
  // Fetch matching students
  const students = await StudentUser.find({ email: { $in: emails } }).lean();
  const studentsMap = {};
  students.forEach(s => {
    studentsMap[s.email] = s.studentId;
  });

  // Fetch matching faculty
  const faculty = await FacultyUser.find({ email: { $in: emails } }).lean();
  const facultyMap = {};
  faculty.forEach(f => {
    const suffix = f.uid.replace('FACULTY-', '');
    facultyMap[f.email] = `FAC-26-${suffix}`;
  });

  return usersList.map(u => {
    const enriched = {
      ...u,
      studentId: studentsMap[u.email] || getFallbackStudentId(u.email),
      facultyId: facultyMap[u.email] || getFallbackFacultyId(u.email),
    };
    if (u.role === 'admin') {
      enriched.adminId = 'ADM-26-001';
    }
    return enriched;
  });
};

// 1. GET User Search
router.get('/users', requireAuth, async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) {
    return res.json({ users: [] });
  }

  try {
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

    const users = await UserProfile.find({
      uid: { $ne: req.user.uid },
      $or: [
        { fullName: new RegExp(q, 'i') },
        { email: new RegExp(q, 'i') },
        { email: { $in: matchedEmails } }
      ],
      role: { $in: ['student', 'faculty', 'admin'] },
    })
      .limit(15)
      .lean();

    const enriched = await enrichUsersWithIds(users);

    return res.json({
      users: enriched.map((u) => ({
        id: u.uid,
        fullName: u.fullName,
        email: u.email,
        role: u.role,
        studentId: u.studentId,
        facultyId: u.facultyId,
        adminId: u.adminId,
      })),
    });
  } catch (err) {
    return res.status(500).json({ message: 'Error searching users', error: err.message });
  }
});

// 2. GET Chat History or Conversation List
router.get('/', requireAuth, async (req, res) => {
  const { userA, userB } = req.query;
  const currentUid = req.user.uid;

  try {
    // If userB parameter is present, fetch direct conversation history between userA and userB
    if (userB) {
      const partnerA = userA || currentUid;
      const partnerB = userB;

      // Enforce access control check: user must be one of the participants
      if (currentUid !== partnerA && currentUid !== partnerB) {
        return res.status(403).json({ message: 'Forbidden: You are not authorized to view this conversation' });
      }

      const messages = await Message.find({
        $or: [
          { senderId: partnerA, receiverId: partnerB },
          { senderId: partnerB, receiverId: partnerA },
        ],
      })
        .sort({ timestamp: 1 })
        .lean();

      return res.json({ messages });
    }

    // If no query parameters, fetch list of unique conversation threads involving current user
    const msgs = await Message.find({
      $or: [{ senderId: currentUid }, { receiverId: currentUid }],
    })
      .sort({ timestamp: -1 })
      .lean();

    const partnerIds = msgs.map((m) => m.senderId === currentUid ? m.receiverId : m.senderId);
    const uniquePartnerIds = [...new Set(partnerIds)];

    const profiles = await UserProfile.find({ uid: { $in: uniquePartnerIds } }).lean();
    const enrichedProfiles = await enrichUsersWithIds(profiles);
    const profilesMap = {};
    enrichedProfiles.forEach((p) => {
      profilesMap[p.uid] = p;
    });

    const partnersMap = {};
    msgs.forEach((m) => {
      const partnerId = m.senderId === currentUid ? m.receiverId : m.senderId;
      const partnerName = m.senderId === currentUid ? m.receiverName : m.senderName;
      const profile = profilesMap[partnerId];
      if (!partnersMap[partnerId]) {
        partnersMap[partnerId] = {
          id: partnerId,
          name: partnerName || 'User',
          email: profile?.email || '',
          studentId: profile?.studentId || '',
          facultyId: profile?.facultyId || '',
          role: profile?.role || '',
          preview: m.body,
          time: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestamp: m.timestamp,
        };
      }
    });

    const conversations = Object.values(partnersMap);
    return res.json({ conversations });
  } catch (err) {
    return res.status(500).json({ message: 'Error loading conversations', error: err.message });
  }
});

// 3. POST Send Message
router.post('/', requireAuth, async (req, res) => {
  const { receiverId, receiverName, body } = req.body || {};
  if (!receiverId || !body) {
    return res.status(400).json({ message: 'receiverId and body are required' });
  }

  try {
    const profile = await UserProfile.findOne({ uid: req.user.uid }).lean();
    const currentName = profile?.fullName || req.user.name || req.user.email || 'Anonymous';

    const msg = await Message.create({
      senderId: req.user.uid,
      receiverId,
      senderName: currentName,
      receiverName: receiverName || 'User',
      body,
      timestamp: new Date(),
    });

    return res.status(201).json({ message: msg });
  } catch (err) {
    return res.status(500).json({ message: 'Error sending message', error: err.message });
  }
});

export default router;
