import admin from '../../lib/firebaseAdmin.js';
import { connectMongo } from '../../lib/connectMongo.js';
import Enrollment from '../../server/models/Enrollment.js';
import Assignment from '../../server/models/Assignment.js';
import AssignmentSubmission from '../../server/models/AssignmentSubmission.js';
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
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

    // Extract assignment ID from path or query params
    const urlPath = (req.originalUrl || req.url || '').split('?')[0];
    const match = urlPath.match(/\/api\/assignments\/([a-fA-F0-9]{24})/);
    const assignmentId = match
      ? match[1]
      : req.params?.id || (req.query.action && req.query.action.match(/^[a-fA-F0-9]{24}$/) ? req.query.action : null);

    // Check user profile for role
    const profile = await UserProfile.findOne({ uid: decoded.uid }).lean();
    const isFaculty = profile?.role === 'faculty';

    // PUT Request: Edit Assignment or Grade Submission (Faculty only)
    if (req.method === 'PUT') {
      const gradeMatch = urlPath.match(/\/api\/assignments\/submissions\/([a-fA-F0-9]{24})/);
      if (gradeMatch) {
        if (!isFaculty) {
          return res.status(403).json({ message: 'Only faculty can grade submissions' });
        }
        const submissionId = gradeMatch[1];
        const submission = await AssignmentSubmission.findById(submissionId);
        if (!submission) {
          return res.status(404).json({ message: 'Submission not found' });
        }
        const assignment = await Assignment.findById(submission.assignmentId);
        if (!assignment) {
          return res.status(404).json({ message: 'Assignment not found' });
        }
        const course = await Course.findOne({ _id: assignment.courseId, facultyEmail: userEmail }).lean();
        if (!course) {
          return res.status(403).json({ message: 'You are not the instructor for this course' });
        }

        const { marks, feedback } = req.body || {};
        if (marks === undefined || marks === null) {
          return res.status(400).json({ message: 'Marks are required' });
        }
        const marksNum = Number(marks);
        if (isNaN(marksNum)) {
          return res.status(400).json({ message: 'Marks must be a number' });
        }

        submission.marks = marksNum;
        submission.feedback = (feedback || '').trim();
        submission.gradedAt = new Date();
        await submission.save();

        return res.json({
          message: 'Submission graded successfully',
          submission,
        });
      }

      if (!isFaculty) {
        return res.status(403).json({ message: 'Only faculty can edit assignments' });
      }

      if (!assignmentId) {
        return res.status(400).json({ message: 'Assignment ID is required' });
      }

      const { title, description, deadline } = req.body || {};

      if (!title || !description || !deadline) {
        return res.status(400).json({ message: 'title, description, and deadline are required' });
      }

      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) {
        return res.status(404).json({ message: 'Assignment not found' });
      }

      // Verify faculty owns the course of this assignment
      const course = await Course.findOne({ _id: assignment.courseId, facultyEmail: userEmail }).lean();
      if (!course) {
        return res.status(403).json({ message: 'You are not the instructor for this course' });
      }

      // Update assignment
      assignment.title = title.trim();
      assignment.description = description.trim();
      assignment.deadline = new Date(deadline);
      await assignment.save();

      return res.json({
        message: 'Assignment updated successfully',
        assignment,
      });
    }

    // DELETE Request: Delete Assignment with Cascade Delete (Faculty only)
    if (req.method === 'DELETE') {
      if (!isFaculty) {
        return res.status(403).json({ message: 'Only faculty can delete assignments' });
      }

      if (!assignmentId) {
        return res.status(400).json({ message: 'Assignment ID is required' });
      }

      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) {
        return res.status(404).json({ message: 'Assignment not found' });
      }

      // Verify faculty owns the course of this assignment
      const course = await Course.findOne({ _id: assignment.courseId, facultyEmail: userEmail }).lean();
      if (!course) {
        return res.status(403).json({ message: 'You are not the instructor for this course' });
      }

      // Cascade Delete: Submissions first
      await AssignmentSubmission.deleteMany({ assignmentId });

      // Delete the Assignment itself
      await Assignment.findByIdAndDelete(assignmentId);

      // Decrement assignment count on course
      await Course.findByIdAndUpdate(assignment.courseId, { $inc: { assignments: -1 } });

      return res.json({
        message: 'Assignment deleted successfully',
      });
    }

    // GET Request: Retrieve assignments or list submissions (Faculty or Student)
    if (req.method === 'GET') {
      const listMatch = urlPath.match(/\/api\/assignments\/([a-fA-F0-9]{24})\/submissions/);
      if (listMatch) {
        if (!isFaculty) {
          return res.status(403).json({ message: 'Only faculty can view submissions' });
        }
        const targetAssignmentId = listMatch[1];
        const assignment = await Assignment.findById(targetAssignmentId);
        if (!assignment) {
          return res.status(404).json({ message: 'Assignment not found' });
        }
        const course = await Course.findOne({ _id: assignment.courseId, facultyEmail: userEmail }).lean();
        if (!course) {
          return res.status(403).json({ message: 'You are not the instructor for this course' });
        }

        const submissions = await AssignmentSubmission.find({ assignmentId: targetAssignmentId }).sort({ submittedAt: -1 }).lean();
        const studentEmails = submissions.map((s) => s.studentEmail);
        const profiles = await UserProfile.find({ email: { $in: studentEmails } }).lean();
        const profileMap = new Map(profiles.map((p) => [p.email, p.fullName || p.name || '']));

        const result = submissions.map((s) => ({
          id: s._id,
          studentName: profileMap.get(s.studentEmail) || 'Unknown Student',
          studentEmail: s.studentEmail,
          submissionText: s.submissionText,
          submittedAt: s.submittedAt,
          marks: s.marks ?? 0,
          feedback: s.feedback ?? '',
          gradedAt: s.gradedAt || null
        }));

        return res.json({ submissions: result });
      }

      const { courseId } = req.query;

      if (isFaculty) {
        // Faculty: Get assignments taught by this instructor
        const courses = await Course.find({ facultyEmail: userEmail }).lean();
        const courseIds = courses.map((c) => c._id.toString());

        if (courseId && !courseIds.includes(courseId)) {
          return res.status(403).json({ message: 'You are not the instructor for this course' });
        }

        const filter = {};
        if (courseId) {
          filter.courseId = courseId;
        } else {
          filter.courseId = { $in: courseIds };
        }

        const assignments = await Assignment.find(filter)
          .populate('courseId')
          .sort({ deadline: 1 })
          .lean();

        const result = await Promise.all(
          assignments.map(async (a) => {
            const submissionsCount = await AssignmentSubmission.countDocuments({
              assignmentId: a._id,
            });
            return {
              id: a._id,
              title: a.title,
              description: a.description,
              deadline: a.deadline,
              courseId: a.courseId?._id || a.courseId,
              courseCode: a.courseId?.code || '',
              courseTitle: a.courseId?.title || '',
              submissionsCount,
            };
          })
        );

        return res.json({ assignments: result, count: result.length });
      } else {
        // Student: Retrieve assignments for enrolled courses
        const enrollments = await Enrollment.find({ studentEmail: userEmail }).lean();
        const enrolledCourseIds = enrollments.map((e) => e.courseId.toString());

        if (courseId && !enrolledCourseIds.includes(courseId)) {
          return res.status(403).json({ message: 'You are not enrolled in this course' });
        }

        const filter = {};
        if (courseId) {
          filter.courseId = courseId;
        } else {
          filter.courseId = { $in: enrolledCourseIds };
        }

        const assignments = await Assignment.find(filter)
          .populate('courseId')
          .sort({ deadline: 1 })
          .lean();

        const submissions = await AssignmentSubmission.find({
          studentEmail: userEmail,
          assignmentId: { $in: assignments.map((a) => a._id) },
        }).lean();

        const submissionMap = new Map(
          submissions.map((s) => [s.assignmentId.toString(), s])
        );

        const result = assignments.map((a) => {
          const submission = submissionMap.get(a._id.toString());
          return {
            id: a._id,
            title: a.title,
            description: a.description,
            deadline: a.deadline,
            courseCode: a.courseId?.code || '',
            courseTitle: a.courseId?.title || '',
            status: submission ? 'Submitted' : 'Pending',
            submittedAt: submission ? submission.submittedAt : null,
            submissionText: submission ? submission.submissionText : null,
          };
        });

        return res.json({ assignments: result, count: result.length });
      }
    }

    // POST Request: Create assignment (Faculty) or Submit assignment (Student)
    if (req.method === 'POST') {
      if (isFaculty) {
        // Faculty: Create assignment
        const { courseId, title, description, deadline } = req.body || {};

        if (!courseId || !title || !description || !deadline) {
          return res.status(400).json({ message: 'courseId, title, description, and deadline are required' });
        }

        const course = await Course.findOne({ _id: courseId, facultyEmail: userEmail }).lean();
        if (!course) {
          return res.status(403).json({ message: 'You are not the instructor for this course' });
        }

        const assignment = new Assignment({
          courseId,
          title,
          description,
          deadline: new Date(deadline),
        });

        await assignment.save();

        // Increment assignment count on course
        await Course.findByIdAndUpdate(courseId, { $inc: { assignments: 1 } });

        return res.status(201).json({
          message: 'Assignment created successfully',
          assignment,
        });
      } else {
        // Student: Submit assignment
        const { assignmentId, submissionText } = req.body || {};

        if (!assignmentId || !submissionText) {
          return res.status(400).json({ message: 'Assignment ID and submission text are required' });
        }

        const assignment = await Assignment.findById(assignmentId).lean();
        if (!assignment) {
          return res.status(404).json({ message: 'Assignment not found' });
        }

        const enrollment = await Enrollment.findOne({
          studentEmail: userEmail,
          courseId: assignment.courseId,
        }).lean();

        if (!enrollment) {
          return res.status(403).json({ message: 'You are not enrolled in the course for this assignment' });
        }

        const submission = await AssignmentSubmission.findOneAndUpdate(
          { assignmentId, studentEmail: userEmail },
          { $set: { submissionText, submittedAt: new Date() } },
          { upsert: true, new: true }
        );

        return res.status(201).json({
          message: 'Assignment submitted successfully',
          submission,
        });
      }
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    return res.status(401).json({ message: 'Invalid auth token', error: error?.message || '' });
  }
}
