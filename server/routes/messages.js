import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

// Simple Message Schema (Internal to route for simplicity)
const messageSchema = new mongoose.Schema({
  conversationId: String,
  sender: String,
  body: String,
  incoming: Boolean,
  time: String,
  timestamp: { type: Date, default: Date.now }
});

const Message = mongoose.models.Message || mongoose.model('Message', messageSchema);

router.get('/', async (req, res) => {
  const { conversationId } = req.query;
  if (!conversationId) return res.status(400).json({ message: 'conversationId required' });
  
  try {
    const messages = await Message.find({ conversationId }).sort({ timestamp: 1 }).limit(50).lean();
    return res.json({ messages });
  } catch (err) {
    return res.json({ messages: [] });
  }
});

router.post('/', async (req, res) => {
  const { sender, body, incoming, conversationId } = req.body;
  try {
    const msg = await Message.create({
      conversationId,
      sender,
      body,
      incoming: !!incoming,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    return res.status(201).json({ message: msg });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to save message' });
  }
});

export default router;
