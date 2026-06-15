import admin from '../../lib/firebaseAdmin.js';
import { connectMongo } from '../../lib/connectMongo.js';
import UserProfile from '../../server/models/UserProfile.js';
import Message from '../../server/models/Message.js';
import StudentUser from '../../server/models/StudentUser.js';
import FacultyUser from '../../server/models/FacultyUser.js';

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
    const profile = await UserProfile.findOne({ uid: decoded.uid }).lean();
    const currentUid = decoded.uid;
    const currentName = profile?.fullName || decoded.name || decoded.email || 'Anonymous';

    const action = req.query.action?.[0] || req.query.action;

    // 1. GET User Search
    if (action === 'users' && req.method === 'GET') {
      const q = (req.query.q || '').trim();
      if (!q) {
        return res.json({ users: [] });
      }

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

      // Search student/faculty matching regex search, excluding current user
      const users = await UserProfile.find({
        uid: { $ne: currentUid },
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
    }

    // 2. GET Chat History or Conversation List
    if (req.method === 'GET') {
      const { userA, userB } = req.query;

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
    }

    // 3. POST Send Message
    if (req.method === 'POST') {
      const { receiverId, receiverName, body } = req.body || {};
      if (!receiverId || !body) {
        return res.status(400).json({ message: 'receiverId and body are required' });
      }

      const msg = await Message.create({
        senderId: currentUid,
        receiverId,
        senderName: currentName,
        receiverName: receiverName || 'User',
        body,
        timestamp: new Date(),
      });

      return res.status(201).json({ message: msg });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('API Messages handler error:', error);
    return res.status(401).json({ message: 'Unauthorized', error: error?.message || '' });
  }
}
