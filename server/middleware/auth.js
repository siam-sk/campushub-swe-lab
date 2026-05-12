import admin from '../firebaseAdmin.js';
import UserProfile from '../models/UserProfile.js';

const getTokenFromHeader = (req) => {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
};

export const requireAuth = async (req, res, next) => {
  const token = getTokenFromHeader(req);
  if (!token) {
    return res.status(401).json({ message: 'Missing auth token' });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid auth token' });
  }
};

export const loadUserProfile = async (req, res, next) => {
  try {
    if (!req.user?.uid) {
      req.profile = null;
      return next();
    }

    const profile = await UserProfile.findOne({ uid: req.user.uid }).lean();
    req.profile = profile;
    return next();
  } catch {
    req.profile = null;
    return next();
  }
};

export const requireRole = (allowedRoles = []) => (req, res, next) => {
  const role = req.profile?.role || 'student';
  if (!allowedRoles.length || allowedRoles.includes(role)) {
    return next();
  }

  return res.status(403).json({ message: 'Insufficient role permissions' });
};
