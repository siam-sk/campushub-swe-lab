import StudentUser from '../../server/models/StudentUser.js';

export default async function handler(req, res) {
  try {
    const students = await StudentUser.find()
      .sort({ createdAt: 1 })
      .select('studentId fullName email department year semester gpa status dashboardMeta')
      .lean();

    return res.json({
      students,
      count: students.length,
      source: 'mongodb',
    });
  } catch {
    return res.status(500).json({
      students: [],
      count: 0,
      source: 'error',
      message: 'Unable to fetch students',
    });
  }
}