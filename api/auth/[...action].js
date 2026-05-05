import { handleAuthAction } from '../lib/authHandler.js';

export default async function handler(req, res) {
  const action = req.query.action?.[0] || req.query.action || 'login';
  return handleAuthAction(req, res, action);
}