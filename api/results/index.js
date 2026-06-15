import admin from '../../lib/firebaseAdmin.js';
import { connectMongo } from '../../lib/connectMongo.js';
import Result from '../../server/models/Result.js';
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

const calculateGradeAndGP = (marks) => {
  if (marks >= 90) return { grade: 'A+', gp: 4.00 };
  if (marks >= 85) return { grade: 'A', gp: 3.75 };
  if (marks >= 80) return { grade: 'A-', gp: 3.50 };
  if (marks >= 75) return { grade: 'B+', gp: 3.25 };
  if (marks >= 70) return { grade: 'B', gp: 3.00 };
  if (marks >= 65) return { grade: 'B-', gp: 2.75 };
  if (marks >= 60) return { grade: 'C+', gp: 2.50 };
  if (marks >= 55) return { grade: 'C', gp: 2.25 };
  if (marks >= 50) return { grade: 'D', gp: 2.00 };
  return { grade: 'F', gp: 0.00 };
};

const getCreditsForCourse = (code) => {
  const codeLower = code.toLowerCase();
  if (
    codeLower.includes('lab') ||
    codeLower.includes('1112') ||
    codeLower.includes('2112') ||
    codeLower.includes('3012')
  ) {
    return 1;
  }
  return 3;
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

    // POST Request: Publish Results (Faculty only)
    if (req.method === 'POST') {
      const urlPath = (req.originalUrl || req.url || '').split('?')[0];
      const isPublishAction = req.query.action === 'publish' || urlPath.endsWith('/publish');

      if (!isPublishAction) {
        return res.status(404).json({ message: 'Action not found' });
      }

      if (!isFaculty) {
        return res.status(403).json({ message: 'Only faculty can publish results' });
      }

      const { courseId, semester, results } = req.body || {};

      if (!courseId || !semester || !Array.isArray(results)) {
        return res.status(400).json({ message: 'courseId, semester, and results (array) are required' });
      }

      // Verify faculty owns the course
      const course = await Course.findOne({ _id: courseId, facultyEmail: userEmail }).lean();
      if (!course) {
        return res.status(403).json({ message: 'You are not the instructor for this course' });
      }

      // Construct bulk operations
      const bulkOps = results.map((r) => {
        if (!r.studentEmail || typeof r.marks !== 'number') {
          throw new Error('Invalid result format: studentEmail and marks (number) are required');
        }

        const { grade, gp } = calculateGradeAndGP(r.marks);
        const credit = getCreditsForCourse(course.code);

        return {
          updateOne: {
            filter: {
              studentEmail: r.studentEmail,
              semester: semester,
              courseCode: course.code,
            },
            update: {
              $set: {
                courseTitle: course.title,
                credit: credit,
                grade: grade,
                gradePoint: gp,
                marks: r.marks,
              },
            },
            upsert: true,
          },
        };
      });

      if (bulkOps.length > 0) {
        await Result.bulkWrite(bulkOps);
      }

      return res.status(200).json({
        message: 'Results published successfully',
        publishedCount: bulkOps.length,
      });
    }

    // GET Request: Retrieve results (Student only)
    if (req.method === 'GET') {
      if (isFaculty) {
        return res.status(403).json({ message: 'Faculty members cannot access student transcripts via this endpoint' });
      }

      const { semester } = req.query;

      // Fetch all results for calculations first
      const allResults = await Result.find({ studentEmail: userEmail }).lean();

      // Calculate CGPA and Credits on all courses
      let totalAttemptedCredits = 0;
      let totalCreditsEarned = 0;
      let totalWeightedPoints = 0;
      let completedCoursesCount = 0;

      const semesterDataMap = {};

      for (const r of allResults) {
        totalAttemptedCredits += r.credit;
        totalWeightedPoints += r.gradePoint * r.credit;

        if (r.grade !== 'F') {
          totalCreditsEarned += r.credit;
          completedCoursesCount++;
        }

        // Group for per-semester GPA calculations
        if (!semesterDataMap[r.semester]) {
          semesterDataMap[r.semester] = {
            semester: r.semester,
            attemptedCredits: 0,
            earnedCredits: 0,
            weightedPoints: 0,
            completedCourses: 0,
            courses: [],
          };
        }

        const semGroup = semesterDataMap[r.semester];
        semGroup.attemptedCredits += r.credit;
        semGroup.weightedPoints += r.gradePoint * r.credit;
        if (r.grade !== 'F') {
          semGroup.earnedCredits += r.credit;
          semGroup.completedCourses++;
        }
        semGroup.courses.push({
          id: r._id,
          courseCode: r.courseCode,
          courseTitle: r.courseTitle,
          credit: r.credit,
          grade: r.grade,
          gradePoint: r.gradePoint,
        });
      }

      const cgpa = totalAttemptedCredits > 0 ? Number((totalWeightedPoints / totalAttemptedCredits).toFixed(2)) : 0.0;

      // Build semesters list
      const semestersList = Object.values(semesterDataMap).map((sem) => {
        const gpa = sem.attemptedCredits > 0 ? Number((sem.weightedPoints / sem.attemptedCredits).toFixed(2)) : 0.0;
        return {
          semester: sem.semester,
          gpa,
          earnedCredits: sem.earnedCredits,
          attemptedCredits: sem.attemptedCredits,
          completedCourses: sem.completedCourses,
          courses: sem.courses,
        };
      });

      // Filtered results to return
      let filteredResults = allResults;
      if (semester) {
        filteredResults = allResults.filter((r) => r.semester === semester);
      }

      // Sort filteredResults by semester desc, then course code
      filteredResults.sort((a, b) => {
        const semCompare = b.semester.localeCompare(a.semester);
        if (semCompare !== 0) return semCompare;
        return a.courseCode.localeCompare(b.courseCode);
      });

      return res.json({
        results: filteredResults.map((r) => ({
          id: r._id,
          semester: r.semester,
          courseCode: r.courseCode,
          courseTitle: r.courseTitle,
          credit: r.credit,
          grade: r.grade,
          gradePoint: r.gradePoint,
        })),
        stats: {
          cgpa,
          totalCredits: totalCreditsEarned,
          completedCourses: completedCoursesCount,
          semesters: semestersList.sort((a, b) => b.semester.localeCompare(a.semester)),
        },
      });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    return res.status(401).json({ message: 'Invalid auth token', error: error?.message || '' });
  }
}
