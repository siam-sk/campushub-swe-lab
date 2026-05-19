import mongoose from 'mongoose';

const facultyUserSchema = new mongoose.Schema(
  {
    uid: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, index: true },
    fullName: { type: String, required: true },
    role: { type: String, default: 'faculty', index: true },
    department: { type: String, default: '' },
    designation: { type: String, default: '' },
    officeLocation: { type: String, default: '' },
    contactInfo: { type: String, default: '' },
    avatarUrl: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.models.FacultyUser || mongoose.model('FacultyUser', facultyUserSchema);
