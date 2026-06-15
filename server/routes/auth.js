import express from 'express'
import admin from '../firebaseAdmin.js'
import UserProfile from '../models/UserProfile.js'
import StudentUser from '../models/StudentUser.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

const buildUserPayload = (decoded, profile) => ({
  uid: decoded.uid,
  email: decoded.email,
  name: profile?.fullName || decoded.name || decoded.email,
  picture: decoded.picture || null,
  role: profile?.role || 'student',
  profile: profile
    ? {
        fullName: profile.fullName,
        role: profile.role,
        department: profile.department,
        year: profile.year,
        semester: profile.semester,
        gpa: profile.gpa,
        avatarUrl: profile.avatarUrl,
      }
    : null,
})

const ensureUserProfile = async (decoded) => {
  const fullName = decoded.name || decoded.email || 'Student'
  
  let role = 'student'
  if (decoded.email && decoded.email.toLowerCase().includes('faculty')) {
    role = 'faculty'
  } else if (decoded.email && decoded.email.toLowerCase().includes('admin')) {
    role = 'admin'
  }

  const update = {
    email: decoded.email,
    avatarUrl: decoded.picture || '',
    role
  }

  if (decoded.name) {
    update.fullName = decoded.name
  }

  const setOnInsert = {}
  if (!decoded.name) {
    setOnInsert.fullName = fullName
  }

  const profile = await UserProfile.findOneAndUpdate(
    { uid: decoded.uid },
    {
      $set: update,
      $setOnInsert: setOnInsert,
    },
    { new: true, upsert: true },
  ).lean()

  return profile
}

router.get('/resolve-id', async (req, res) => {
  const id = (req.query.id || '').trim();
  if (!id) {
    return res.status(400).json({ message: 'ID is required' });
  }

  if (id.includes('@')) {
    return res.json({ email: id });
  }

  if (id.toUpperCase().startsWith('FAC')) {
    return res.json({ email: 'faculty@campushub.edu' });
  }

  if (id.toUpperCase().startsWith('ADM')) {
    return res.json({ email: 'admin@campushub.edu' });
  }

  try {
    const student = await StudentUser.findOne({ studentId: id }).lean();
    if (student) {
      return res.json({ email: student.email });
    }
    return res.status(404).json({ message: 'User ID not found' });
  } catch (err) {
    return res.status(500).json({ message: 'Database error', error: err.message });
  }
});

router.post('/login', async (req, res) => {
  const { idToken } = req.body
  if (!idToken) {
    return res.status(400).json({ message: 'idToken is required' })
  }

  try {
    let decoded;
    if (process.env.NODE_ENV !== 'production' && idToken.startsWith('mock-')) {
      const email = idToken.replace('mock-', '');
      decoded = {
        uid: `mock-uid-${email}`,
        email: email,
        name: `Mock User`,
        picture: ''
      };
    } else {
      if (idToken.startsWith('mock-')) {
        return res.status(401).json({ message: 'Mock tokens are not allowed in production' });
      }
      decoded = await admin.auth().verifyIdToken(idToken)
    }
    const profile = await ensureUserProfile(decoded)

    return res.json({
      message: 'Login verified',
      user: buildUserPayload(decoded, profile),
    })
  } catch (error) {
    console.error('Login error:', error)
    return res.status(401).json({ message: 'Invalid idToken', error: error.message })
  }
})

router.post('/register', async (req, res) => {
  const { idToken } = req.body
  if (!idToken) {
    return res.status(400).json({ message: 'idToken is required' })
  }

  try {
    let decoded;
    if (process.env.NODE_ENV !== 'production' && idToken.startsWith('mock-')) {
      const email = idToken.replace('mock-', '');
      decoded = {
        uid: `mock-uid-${email}`,
        email: email,
        name: `Mock User`,
        picture: ''
      };
    } else {
      if (idToken.startsWith('mock-')) {
        return res.status(401).json({ message: 'Mock tokens are not allowed in production' });
      }
      decoded = await admin.auth().verifyIdToken(idToken)
    }
    const profile = await ensureUserProfile(decoded)

    return res.status(201).json({
      message: 'Registration verified',
      user: buildUserPayload(decoded, profile),
    })
  } catch (error) {
    console.error('Register error:', error)
    return res.status(401).json({ message: 'Invalid idToken', error: error.message })
  }
})

router.get('/me', requireAuth, async (req, res) => {
  try {
    const profile = req.user?.uid
      ? await UserProfile.findOne({ uid: req.user.uid }).lean()
      : null

    return res.json({
      user: buildUserPayload(req.user, profile),
    })
  } catch {
    return res.json({
      user: buildUserPayload(req.user, null),
    })
  }
})

export default router
