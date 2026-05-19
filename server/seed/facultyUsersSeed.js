/* global process */
import dotenv from 'dotenv';
import { connectMongo } from '../db/connectMongo.js';
import FacultyUser from '../models/FacultyUser.js';

dotenv.config();

export const facultyUsersSeed = [
  {
    uid: 'FACULTY-001',
    email: 'dr.rahman@campushub.edu',
    fullName: 'Dr. Tarek Rahman',
    role: 'faculty',
    department: 'Computer Science and Engineering',
    designation: 'Professor',
    officeLocation: 'Room 405, Engineering Building',
    contactInfo: '+8801700000001',
    avatarUrl: '',
  },
  {
    uid: 'FACULTY-002',
    email: 'nusrat.jahan@campushub.edu',
    fullName: 'Nusrat Jahan',
    role: 'faculty',
    department: 'Computer Science and Engineering',
    designation: 'Assistant Professor',
    officeLocation: 'Room 412, Engineering Building',
    contactInfo: '+8801700000002',
    avatarUrl: '',
  },
  {
    uid: 'FACULTY-003',
    email: 'dr.ahmed@campushub.edu',
    fullName: 'Dr. Faisal Ahmed',
    role: 'faculty',
    department: 'Electrical and Electronic Engineering',
    designation: 'Associate Professor',
    officeLocation: 'Room 305, Engineering Building',
    contactInfo: '+8801700000003',
    avatarUrl: '',
  },
  {
    uid: 'FACULTY-004',
    email: 'salman.khan@campushub.edu',
    fullName: 'Salman Khan',
    role: 'faculty',
    department: 'Business Administration',
    designation: 'Lecturer',
    officeLocation: 'Room 210, Business Building',
    contactInfo: '+8801700000004',
    avatarUrl: '',
  },
  {
    uid: 'FACULTY-005',
    email: 'dr.sultana@campushub.edu',
    fullName: 'Dr. Farhana Sultana',
    role: 'faculty',
    department: 'Civil Engineering',
    designation: 'Professor',
    officeLocation: 'Room 501, Engineering Building',
    contactInfo: '+8801700000005',
    avatarUrl: '',
  },
];

const upsertMany = async (model, items, keyFields) => {
  const ops = items.map((item) => ({
    updateOne: {
      filter: keyFields.reduce((acc, field) => {
        acc[field] = item[field];
        return acc;
      }, {}),
      update: { $set: item },
      upsert: true,
    },
  }));

  if (ops.length) {
    await model.bulkWrite(ops);
  }
};

const run = async () => {
  try {
    await connectMongo();
    await upsertMany(FacultyUser, facultyUsersSeed, ['uid']);
    console.log('Faculty users seed data populated successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding faculty users failed:', error);
    process.exit(1);
  }
};

// Only run automatically if this script is executed directly 
// e.g., via `node server/seed/facultyUsersSeed.js`
if (process.argv[1] && process.argv[1].endsWith('facultyUsersSeed.js')) {
  run();
}
