/* global process */
import 'dotenv/config';
import admin from '../firebaseAdmin.js';
import { studentUsersSeed } from './studentUsersSeed.js';

const testPassword = process.env.TEST_USER_PASSWORD || 'CampusHub@123';

const runSeed = async () => {
  let created = 0;
  let updated = 0;

  for (const student of studentUsersSeed) {
    try {
      const existing = await admin.auth().getUserByEmail(student.email);

      await admin.auth().updateUser(existing.uid, {
        displayName: student.fullName,
        disabled: false,
      });

      await admin.auth().setCustomUserClaims(existing.uid, {
        role: 'student',
        studentId: student.studentId,
      });

      updated += 1;
    } catch (error) {
      if (error.code !== 'auth/user-not-found') {
        throw error;
      }

      const createdUser = await admin.auth().createUser({
        email: student.email,
        password: testPassword,
        displayName: student.fullName,
        emailVerified: true,
        disabled: false,
      });

      await admin.auth().setCustomUserClaims(createdUser.uid, {
        role: 'student',
        studentId: student.studentId,
      });

      created += 1;
    }
  }

  console.log(`Firebase users created: ${created}`);
  console.log(`Firebase users updated: ${updated}`);
  console.log(`Test login password: ${testPassword}`);
};

runSeed().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
