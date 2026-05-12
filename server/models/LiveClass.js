import mongoose from 'mongoose';

const liveClassSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    instructor: { type: String, default: '' },
    durationMinutes: { type: Number, default: 0 },
    attendees: { type: Number, default: 0 },
    capacity: { type: Number, default: 0 },
    status: { type: String, default: 'upcoming' },
    startTime: { type: Date, default: Date.now },
    coverImage: { type: String, default: '' },
  },
  { timestamps: true },
);

export default mongoose.models.LiveClass || mongoose.model('LiveClass', liveClassSchema);
