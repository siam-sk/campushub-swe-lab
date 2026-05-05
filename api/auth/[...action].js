import admin from '../lib/firebaseAdmin.js';

const getUserPayload = (decoded) => ({
  uid: decoded.uid,
  email: decoded.email,
  name: decoded.name || decoded.email,
  picture: decoded.picture || null,
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const action = req.query.action?.[0] || req.query.action || 'login';

  try {
    if (action === 'me') {
      const header = req.headers.authorization || '';
      const token = header.startsWith('Bearer ') ? header.slice(7) : null;

      if (!token) {
        return res.status(401).json({ message: 'Missing auth token' });
      }

      const decoded = await admin.auth().verifyIdToken(token);
      return res.json({ user: getUserPayload(decoded) });
    }

    const { idToken } = req.body || {};

    if (!idToken) {
      return res.status(400).json({ message: 'idToken is required' });
    }

    const decoded = await admin.auth().verifyIdToken(idToken);

    return res.status(action === 'register' ? 201 : 200).json({
      message: action === 'register' ? 'Registration verified' : 'Login verified',
      user: getUserPayload(decoded),
    });
  } catch {
    return res.status(401).json({ message: 'Invalid idToken' });
  }
}