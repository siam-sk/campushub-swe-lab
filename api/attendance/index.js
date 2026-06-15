import admin from '../../lib/firebaseAdmin.js';
import { connectMongo } from '../../lib/connectMongo.js';
import Enrollment from '../../server/models/Enrollment.js';
import Attendance from '../../server/models/Attendance.js';
import Course from '../../server/models/Course.js';
import UserProfile from '../../server/models/UserProfile.js';

const getTokenFromHeader = (req) => {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
};

const decodeToken = async (token) => {
  if (process.env.NODE_ENV !== 'production' && token.startsWith('mock-')) {
    const email = token.replace('mock-', '');
    return {
      uid: `mock-uid-${email}`,
      email: email,
      name: 'Mock User',
    };
  }
  if (token.startsWith('mock-')) {
    throw new Error('Mock tokens are not allowed in production');
  }
  return await admin.auth().verifyIdToken(token);
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const token = getTokenFromHeader(req);
  if (!token) {
    return res.status(401).json({ message: 'Missing auth token' });
  }

  try {
    const decoded = await decodeToken(token);
    await connectMongo();
    const userEmail = decoded.email;

    // Check user profile for role
    const profile = await UserProfile.findOne({ uid: decoded.uid }).lean();
    const isFaculty = profile?.role === 'faculty';

    // POST Request: Bulk Save Attendance (Faculty only)
    if (req.method === 'POST') {
      if (!isFaculty) {
        return res.status(403).json({ message: 'Only faculty can mark attendance' });
      }

      const { courseId, date, records } = req.body || {};

      if (!courseId || !date || !Array.isArray(records)) {
        return res.status(400).json({ message: 'courseId, date, and records (array) are required' });
      }

      // Verify faculty owns the course
      const course = await Course.findOne({ _id: courseId, facultyEmail: userEmail }).lean();
      if (!course) {
        return res.status(403).json({ message: 'You are not the instructor for this course' });
      }

      // Normalize date to midnight/start-of-day
      const attendanceDate = new Date(date);
      attendanceDate.setHours(0, 0, 0, 0);

      // Construct bulkWrite operations
      const bulkOps = records.map((rec) => {
        if (!rec.studentEmail || !rec.status) {
          throw new Error('Invalid record format: studentEmail and status are required');
        }
        return {
          updateOne: {
            filter: {
              studentEmail: rec.studentEmail,
              courseId: courseId,
              date: attendanceDate,
            },
            update: {
              $set: {
                status: rec.status,
              },
            },
            upsert: true,
          },
        };
      });

      if (bulkOps.length > 0) {
        await Attendance.bulkWrite(bulkOps);
      }

      return res.status(200).json({
        message: 'Attendance saved successfully',
        savedCount: bulkOps.length,
      });
    }

    // GET Request: Retrieve attendance (Student only)
    if (req.method === 'GET') {
      if (isFaculty) {
        return res.status(403).json({ message: 'Faculty members cannot view student attendance summaries via this endpoint' });
      }

      // Fetch student's enrollments to verify authorized courses
      const enrollments = await Enrollment.find({ studentEmail: userEmail }).populate('courseId').lean();
      const enrolledCourseIds = enrollments.map((e) => e.courseId._id.toString());

      const { courseId } = req.query;

      if (courseId) {
        if (!enrolledCourseIds.includes(courseId)) {
          return res.status(403).json({ message: 'You are not enrolled in this course' });
        }
      }

      const filter = { studentEmail: userEmail };
      if (courseId) {
        filter.courseId = courseId;
      } else {
        filter.courseId = { $in: enrolledCourseIds };
      }

      const records = await Attendance.find(filter)
        .populate('courseId')
        .sort({ date: -1 })
        .lean();

      // Calculate overall stats
      let total = 0;
      let present = 0;
      let absent = 0;
      let late = 0;

      // Calculate per-course stats
      const courseStatsMap = {};

      // Initialize map with all enrolled courses so we return 0% instead of empty for courses with no records
      for (const e of enrollments) {
        if (e.courseId) {
          courseStatsMap[e.courseId._id.toString()] = {
            courseCode: e.courseId.code,
            courseTitle: e.courseId.title,
            accent: e.courseId.accent || 'blue',
            total: 0,
            present: 0,
            absent: 0,
            late: 0,
            percentage: 100, // Default to 100% if no classes held yet
          };
        }
      }

      for (const r of records) {
        const cId = r.courseId?._id?.toString() || r.courseId?.toString();
        if (!cId) continue;

        total++;
        if (r.status === 'Present') present++;
        else if (r.status === 'Absent') absent++;
        else if (r.status === 'Late') late++;

        if (courseStatsMap[cId]) {
          const cs = courseStatsMap[cId];
          cs.total++;
          if (r.status === 'Present') cs.present++;
          else if (r.status === 'Absent') cs.absent++;
          else if (r.status === 'Late') cs.late++;
        }
      }

      const overallPercentage = total > 0 ? Math.round(((present + late) / total) * 100) : 100;

      for (const cId in courseStatsMap) {
        const cs = courseStatsMap[cId];
        cs.percentage = cs.total > 0 ? Math.round(((cs.present + cs.late) / cs.total) * 100) : 100;
      }

      return res.json({
        records: records.map((r) => ({
          id: r._id,
          date: r.date,
          status: r.status,
          courseCode: r.courseId?.code || '',
          courseTitle: r.courseId?.title || '',
        })),
        stats: {
          overall: {
            percentage: overallPercentage,
            present,
            absent,
            late,
            total,
          },
          courses: Object.values(courseStatsMap),
        },
      });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    return res.status(401).json({ message: 'Invalid auth token', error: error?.message || '' });
  }
}
