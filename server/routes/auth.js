import express from 'express'
import admin from '../firebaseAdmin.js'

const router = express.Router()

const getTokenFromHeader = (req) => {
  const header = req.headers.authorization || ''
  if (header.startsWith('Bearer ')) {
    return header.slice(7)
  }
  return null
}

const requireAuth = async (req, res, next) => {
  const token = getTokenFromHeader(req)
  if (!token) {
    return res.status(401).json({ message: 'Missing auth token' })
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token)
    req.user = decoded
    return next()
  } catch {
    return res.status(401).json({ message: 'Invalid auth token' })
  }
}

router.post('/login', async (req, res) => {
  const { idToken } = req.body
  if (!idToken) {
    return res.status(400).json({ message: 'idToken is required' })
  }

  try {
    const decoded = await admin.auth().verifyIdToken(idToken)
    return res.json({
      message: 'Login verified',
      user: {
        uid: decoded.uid,
        email: decoded.email,
        name: decoded.name || decoded.email,
        picture: decoded.picture || null,
      },
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
    return res.status(201).json({
      message: 'Registration verified',
      user: {
        uid: decoded.uid,
        email: decoded.email,
        name: decoded.name || decoded.email,
        picture: decoded.picture || null,
      },
    })
  } catch {
    return res.status(401).json({ message: 'Invalid idToken' })
  }
})

router.get('/me', requireAuth, (req, res) => {
  return res.json({
    user: {
      uid: req.user.uid,
      email: req.user.email,
      name: req.user.name || req.user.email,
      picture: req.user.picture || null,
    },
  })
})

export default router
