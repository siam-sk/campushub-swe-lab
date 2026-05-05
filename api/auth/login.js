import { handleAuthAction } from '../lib/authHandler.js';

export default async function handler(req, res) {
  return handleAuthAction(req, res, 'login');
}