import { connectMongo } from '../lib/connectMongo.js';
import AssistantMessage from '../../server/models/AssistantMessage.js';

const fallbackMessages = [
  {
    sender: 'assistant',
    body: 'Hello! I am your AI study assistant. How can I help you today?',
  },
  {
    sender: 'assistant',
    body: 'I can explain concepts, solve problems, debug code, and answer questions.',
  },
];

export default async function handler(req, res) {
  await connectMongo();

  if (req.method === 'GET') {
    const messages = await AssistantMessage.find({ sessionId: 'default' })
      .sort({ createdAt: 1 })
      .lean();
    return res.json({ messages: messages.length ? messages : fallbackMessages });
  }

  if (req.method === 'POST') {
    const { sender, body } = req.body || {};
    if (!body) {
      return res.status(400).json({ message: 'body is required' });
    }

    const message = await AssistantMessage.create({
      sessionId: 'default',
      sender: sender || 'user',
      body,
    });

    return res.status(201).json({ message });
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
