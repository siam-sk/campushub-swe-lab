import express from 'express'
import admin from '../firebaseAdmin.js'
import UserProfile from '../models/UserProfile.js'
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
  const update = {
    email: decoded.email,
    avatarUrl: decoded.picture || '',
  }

  if (decoded.name) {
    update.fullName = decoded.name
  }

  const profile = await UserProfile.findOneAndUpdate(
    { uid: decoded.uid },
    {
      $set: update,
      $setOnInsert: {
        fullName,
        role: 'student',
      },
    },
    { new: true, upsert: true },
  ).lean()

  return profile
}

router.post('/login', async (req, res) => {
  const { idToken } = req.body
  if (!idToken) {
    return res.status(400).json({ message: 'idToken is required' })
  }

  try {
    const decoded = await admin.auth().verifyIdToken(idToken)
    const profile = await ensureUserProfile(decoded)

    return res.json({
      message: 'Login verified',
      user: buildUserPayload(decoded, profile),
    })
  } catch {
    return res.status(401).json({ message: 'Invalid idToken' })
  }
})

router.post('/register', async (req, res) => {
  const { idToken } = req.body
  if (!idToken) {
    return res.status(400).json({ message: 'idToken is required' })
  }

  try {
    const decoded = await admin.auth().verifyIdToken(idToken)
    const profile = await ensureUserProfile(decoded)

    return res.status(201).json({
      message: 'Registration verified',
      user: buildUserPayload(decoded, profile),
    })
  } catch {
    return res.status(401).json({ message: 'Invalid idToken' })
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
