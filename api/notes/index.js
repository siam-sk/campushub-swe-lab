import admin from '../../lib/firebaseAdmin.js';
import { connectMongo } from '../../lib/connectMongo.js';
import UserProfile from '../../server/models/UserProfile.js';
import Note from '../../server/models/Note.js';

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
      picture: '',
    };
  }
  if (token.startsWith('mock-')) {
    throw new Error('Mock tokens are not allowed in production');
  }
  return await admin.auth().verifyIdToken(token);
};

const categoryAccentMap = {
  'Data Structures': 'blue',
  'Database Systems': 'green',
  'Operating Systems': 'purple',
  'Computer Networks': 'orange',
  'Web Development': 'teal',
  'All Subjects': 'orange',
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const token = getTokenFromHeader(req);
  if (!token) {
    return res.status(401).json({ message: 'Missing auth token' });
  }

  try {
    const decoded = await decodeToken(token);
    await connectMongo();
    const profile = await UserProfile.findOne({ uid: decoded.uid }).lean();
    const role = profile?.role || 'student';

    // GET: List and Search Notes
    if (req.method === 'GET') {
      const category = req.query.category;
      const q = req.query.q || '';

      const filter = {};

      if (category && category !== 'All Subjects' && category !== 'All') {
        filter.category = category;
      }

      if (q) {
        filter.$and = filter.$and || [];
        filter.$and.push({
          $or: [
            { title: new RegExp(q, 'i') },
            { code: new RegExp(q, 'i') },
            { topic: new RegExp(q, 'i') },
            { author: new RegExp(q, 'i') },
          ],
        });
      }

      // Visibility: Admins see everything. Students and faculty see approved notes + their own pending ones.
      if (role !== 'admin') {
        const visibilityFilter = {
          $or: [
            { status: 'approved' },
            { email: decoded.email },
          ],
        };
        if (filter.$and) {
          filter.$and.push(visibilityFilter);
        } else {
          filter.$and = [visibilityFilter];
        }
      }

      const notes = await Note.find(filter).sort({ createdAt: -1 }).lean();
      return res.json({ notes, count: notes.length, role });
    }

    // POST Operations: Upload, Approve, Download, Delete
    if (req.method === 'POST') {
      const action = req.query.action || req.body?.action;

      if (action === 'approve') {
        if (role !== 'admin') {
          return res.status(403).json({ message: 'Insufficient role permissions' });
        }
        const { noteId } = req.body || {};
        if (!noteId) {
          return res.status(400).json({ message: 'noteId is required' });
        }
        const updatedNote = await Note.findByIdAndUpdate(
          noteId,
          { $set: { status: 'approved' } },
          { new: true }
        );
        if (!updatedNote) {
          return res.status(404).json({ message: 'Note not found' });
        }
        return res.json({ message: 'Note approved successfully', note: updatedNote });
      }

      if (action === 'download') {
        const { noteId } = req.body || {};
        if (!noteId) {
          return res.status(400).json({ message: 'noteId is required' });
        }
        const updatedNote = await Note.findByIdAndUpdate(
          noteId,
          { $inc: { downloads: 1 } },
          { new: true }
        );
        if (!updatedNote) {
          return res.status(404).json({ message: 'Note not found' });
        }
        return res.json({
          message: 'Download registered',
          downloadUrl: updatedNote.fileUrl || updatedNote.downloadUrl,
          note: updatedNote,
        });
      }

      if (action === 'delete') {
        if (role !== 'admin') {
          return res.status(403).json({ message: 'Insufficient role permissions' });
        }
        const { noteId } = req.body || {};
        if (!noteId) {
          return res.status(400).json({ message: 'noteId is required' });
        }
        const deletedNote = await Note.findByIdAndDelete(noteId);
        if (!deletedNote) {
          return res.status(404).json({ message: 'Note not found' });
        }
        return res.json({ message: 'Note deleted successfully' });
      }

      // Default POST action: Upload Note
      const { title, code, topic, category, pages, fileUrl, fileName, fileSize } = req.body || {};
      if (!title || !code || !topic || !fileUrl || !fileName || !fileSize) {
        return res.status(400).json({ message: 'Title, code, topic, and file details are required' });
      }

      // Determine initial status: faculty/admin are auto-approved, students are pending
      const status = (role === 'admin' || role === 'faculty') ? 'approved' : 'pending';

      const selectedCategory = category || 'All Subjects';
      const accent = categoryAccentMap[selectedCategory] || 'blue';

      const newNote = await Note.create({
        title,
        code,
        topic,
        category: selectedCategory,
        pages: Number(pages) || 1,
        author: profile?.fullName || decoded.name || decoded.email || 'Anonymous',
        email: decoded.email,
        accent,
        downloadUrl: fileUrl,
        fileUrl,
        fileName,
        fileSize: Number(fileSize),
        status,
        downloads: 0,
      });

      return res.status(201).json({ note: newNote });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    return res.status(401).json({ message: 'Invalid auth token', error: error?.message || '' });
  }
}

