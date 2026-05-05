import mongoose from 'mongoose';

const statSchema = new mongoose.Schema(
  {
    title: String,
    value: String,
    note: String,
    icon: String,
    accent: String,
  },
  { _id: false },
);

const courseSchema = new mongoose.Schema(
  {
    name: String,
    code: String,
    progress: Number,
    schedule: String,
    accent: String,
  },
  { _id: false },
);

const noticeSchema = new mongoose.Schema(
  {
    title: String,
    time: String,
    label: String,
  },
  { _id: false },
);

const eventSchema = new mongoose.Schema(
  {
    title: String,
    date: String,
    type: String,
    accent: String,
  },
  { _id: false },
);

const dashboardHomeSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    greetingName: { type: String, default: 'John' },
    greetingMessage: { type: String, default: "Here's what's happening with your studies today" },
    stats: { type: [statSchema], default: [] },
    courses: { type: [courseSchema], default: [] },
    notices: { type: [noticeSchema], default: [] },
    events: { type: [eventSchema], default: [] },
  },
  { timestamps: true },
);

export default mongoose.models.DashboardHome || mongoose.model('DashboardHome', dashboardHomeSchema);
