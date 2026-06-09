import express from 'express';

const router = express.Router();

// In-memory store for demo purposes
// In a real app, this would save to MongoDB associated with the user ID
let userSettings = {
  profile: {
    fullName: 'John Student',
    studentId: '2021CSE089',
    email: 'john.student@university.edu',
    phone: '+880 1234-567890',
    department: 'Computer Science & Engineering',
    year: '3rd Year',
    bio: 'Tell us about yourself...',
    avatarUrl: ''
  },
  notifications: {
    push: true,
    email: true,
    notices: true,
    messages: true,
  },
  privacy: {
    publicProfile: true,
    showEmail: false,
    showPhone: false,
  },
  appearance: {
    darkMode: false,
    theme: 'orange',
  },
};

router.get('/', (req, res) => {
  res.json({ settings: userSettings });
});

router.post('/', (req, res) => {
  if (req.body) {
    userSettings = { ...userSettings, ...req.body };
    res.status(200).json({ message: 'Settings saved successfully', settings: userSettings });
  } else {
    res.status(400).json({ message: 'Invalid data' });
  }
});

export default router;
