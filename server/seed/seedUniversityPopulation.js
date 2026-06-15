import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { connectMongo } from '../db/connectMongo.js';
import StudentUser from '../models/StudentUser.js';
import UserProfile from '../models/UserProfile.js';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';

const firstNames = [
  'Liam', 'Olivia', 'Noah', 'Emma', 'Oliver', 'Ava', 'Elijah', 'Charlotte', 
  'William', 'Sophia', 'James', 'Amelia', 'Benjamin', 'Isabella', 'Lucas', 
  'Mia', 'Henry', 'Evelyn', 'Alexander', 'Harper'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 
  'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 
  'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'
];

const departments = [
  { code: 'CSE', name: 'Computer Science and Engineering' },
  { code: 'EEE', name: 'Electrical and Electronic Engineering' },
  { code: 'BBA', name: 'Business Administration' },
  { code: 'CIVIL', name: 'Civil Engineering' },
  { code: 'ENG', name: 'English Literature' },
  { code: 'PHA', name: 'Pharmacy' },
  { code: 'ECO', name: 'Economics' }
];

async function seed() {
  console.log('Starting University Population Seeding...');
  
  try {
    const mongoStatus = await connectMongo();
    if (!mongoStatus.connected) {
      throw new Error(`MongoDB not connected: ${mongoStatus.reason}`);
    }

    // 1. Fetch existing courses to associate enrollments
    const allCourses = await Course.find().lean();
    console.log(`Found ${allCourses.length} courses in the database.`);

    const studentUsers = [];
    const userProfiles = [];
    const enrollments = [];

    // Helper to generate a random subset of courses matching department or fallback
    const getCoursesForStudent = (deptName) => {
      // Try to find courses matching the department name or code
      let deptCourses = allCourses.filter(c => 
        c.dept?.toLowerCase().includes(deptName.toLowerCase()) || 
        c.title?.toLowerCase().includes(deptName.toLowerCase())
      );
      
      // Fallback: if no department-specific courses exist, assign random courses
      if (deptCourses.length === 0) {
        deptCourses = allCourses;
      }
      
      // Select 2 random courses
      if (deptCourses.length === 0) return [];
      const selected = [];
      const shuffled = [...deptCourses].sort(() => 0.5 - Math.random());
      selected.push(shuffled[0]);
      if (shuffled[1]) selected.push(shuffled[1]);
      return selected;
    };

    let deptIndex = 0;
    
    // Generate data
    for (const dept of departments) {
      for (let i = 1; i <= 20; i++) {
        const serial = String(i + 100);
        const studentId = `${dept.code}-26-${serial}`;
        
        const firstName = firstNames[(i - 1) % firstNames.length];
        const lastName = lastNames[(i - 1 + deptIndex) % lastNames.length];
        const fullName = `${firstName} ${lastName}`;
        const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${dept.code.toLowerCase()}.${serial}@campushub.edu`;
        const phone = `+1-555-260-${deptIndex}${serial}`;
        
        const gpa = Number((Math.random() * 1.45 + 2.5).toFixed(2));
        const completedCredits = Math.floor(Math.random() * 16) + 12; // 12 to 27 credits
        const batch = '2026';
        
        const studentObj = {
          studentId,
          fullName,
          email,
          department: dept.name,
          year: '1st Year',
          semester: '1st Semester',
          batch,
          completedCredits,
          gpa,
          status: 'active',
          avatarUrl: '',
          dashboardMeta: { noticesUnread: 0, messagesUnread: 0, coursesEnrolled: 0 }
        };

        const profileObj = {
          uid: `mock-uid-${email}`,
          email,
          fullName,
          role: 'student',
          department: dept.name,
          year: '1st Year',
          semester: '1st Semester',
          batch,
          completedCredits,
          gpa,
          status: 'active',
          avatarUrl: '',
          dob: '2005-06-15',
          phone,
          bio: `Student of ${dept.name}, batch of ${batch}.`,
          skills: ['Learning', 'Communication'],
          linkedinUrl: '',
          dashboardMeta: { noticesUnread: 0, messagesUnread: 0, coursesEnrolled: 0 }
        };

        studentUsers.push(studentObj);
        userProfiles.push(profileObj);

        // Associate enrollments
        const studentCourses = getCoursesForStudent(dept.name);
        studentCourses.forEach((course) => {
          enrollments.push({
            studentEmail: email,
            courseId: course._id,
            progress: 0,
            schedule: course.footer || 'Scheduled'
          });
        });

        // Update enrollment counter on student objects
        studentObj.dashboardMeta.coursesEnrolled = studentCourses.length;
        profileObj.dashboardMeta.coursesEnrolled = studentCourses.length;

      }
      deptIndex++;
    }

    console.log(`Generated ${studentUsers.length} students to insert.`);

    // 2. Perform bulk upsert operations with $setOnInsert to prevent modifying existing data
    const studentOps = studentUsers.map(s => ({
      updateOne: {
        filter: { email: s.email },
        update: { $setOnInsert: s },
        upsert: true
      }
    }));

    const profileOps = userProfiles.map(p => ({
      updateOne: {
        filter: { email: p.email },
        update: { $setOnInsert: p },
        upsert: true
      }
    }));

    const enrollmentOps = enrollments.map(e => ({
      updateOne: {
        filter: { studentEmail: e.studentEmail, courseId: e.courseId },
        update: { $setOnInsert: e },
        upsert: true
      }
    }));

    console.log('Writing StudentUser records...');
    const studentRes = await StudentUser.bulkWrite(studentOps);
    
    console.log('Writing UserProfile records...');
    const profileRes = await UserProfile.bulkWrite(profileOps);

    let enrollmentRes = { upsertedCount: 0, modifiedCount: 0, matchedCount: 0 };
    if (enrollmentOps.length > 0) {
      console.log('Writing Enrollment records...');
      enrollmentRes = await Enrollment.bulkWrite(enrollmentOps);
    }

    // Calculations
    const totalStudentsCreated = studentRes.upsertedCount;
    const totalProfilesCreated = profileRes.upsertedCount;
    const totalEnrollmentsCreated = enrollmentRes.upsertedCount;
    
    const duplicatesStudents = studentRes.matchedCount;
    const duplicatesProfiles = profileRes.matchedCount;
    
    console.log('\n=== SEEDING SUMMARY ===');
    console.log(`Total students created: ${totalStudentsCreated}`);
    console.log(`Total profiles created: ${totalProfilesCreated}`);
    console.log(`Total enrollments created: ${totalEnrollmentsCreated}`);
    console.log(`Duplicate student records (skipped): ${duplicatesStudents}`);
    console.log(`Duplicate profile records (skipped): ${duplicatesProfiles}`);
    console.log(`Failed insertions: 0`);
    console.log('=======================\n');

  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

seed();
