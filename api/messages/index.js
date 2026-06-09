import { connectMongo } from '../../lib/connectMongo.js';
import mongoose from 'mongoose';

// Simple Message Schema
const messageSchema = new mongoose.Schema({
  conversationId: String,
  sender: String,
  body: String,
  incoming: Boolean,
  time: String,
  timestamp: { type: Date, default: Date.now }
});

const Message = mongoose.models.Message || mongoose.model('Message', messageSchema);

export default async function handler(req, res) {
  await connectMongo();

  const { conversationId } = req.query;

  if (req.method === 'GET') {
    if (!conversationId) return res.status(400).json({ message: 'conversationId required' });
    const messages = await Message.find({ conversationId }).sort({ timestamp: 1 }).limit(50).lean();
    return res.json({ messages });
  }

  if (req.method === 'POST') {
    const { sender, body, incoming, conversationId: bodyId } = req.body;
    const msg = await Message.create({
      conversationId: conversationId || bodyId,
      sender,
      body,
      incoming: !!incoming,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    return res.status(201).json({ message: msg });
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
