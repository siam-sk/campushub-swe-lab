import express from 'express';
import FacultyUser from '../models/FacultyUser.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const faculty = await FacultyUser.find({});
    res.json(faculty);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
