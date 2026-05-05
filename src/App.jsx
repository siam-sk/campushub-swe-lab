import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Auth from './pages/Auth';
import DashboardLayout from './layouts/DashboardLayout';
import DashboardHome from './pages/dashboard/Home';
import DashboardSectionPage from './pages/dashboard/SectionPage';
import Landing from './pages/Landing';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardHome />} />
          <Route
            path="notice-board"
            element={
              <DashboardSectionPage
                title="Notice Board"
                eyebrow="All campus updates"
                description="Announcements, exam changes, deadlines, and faculty notices will live here."
              />
            }
          />
          <Route
            path="notes-library"
            element={
              <DashboardSectionPage
                title="Notes Library"
                eyebrow="Study materials"
                description="Shared notes, PDFs, and revision packs will be organized in this section."
              />
            }
          />
          <Route
            path="messages"
            element={
              <DashboardSectionPage
                title="Messages"
                eyebrow="Peer communication"
                description="Direct messages, class chats, and group discussions will appear here."
              />
            }
          />
          <Route
            path="community"
            element={
              <DashboardSectionPage
                title="Community"
                eyebrow="Campus network"
                description="Clubs, communities, and student groups will be added in the next page pass."
              />
            }
          />
          <Route
            path="profile"
            element={
              <DashboardSectionPage
                title="Profile"
                eyebrow="Student profile"
                description="Profile details, academic settings, and account preferences will live here."
              />
            }
          />
          <Route
            path="club"
            element={
              <DashboardSectionPage
                title="Club"
                eyebrow="Student clubs"
                description="Club memberships, events, and member tools will be wired in this section."
              />
            }
          />
          <Route
            path="premium"
            element={
              <DashboardSectionPage
                title="Premium"
                eyebrow="Upgrade area"
                description="Premium tools and future paid features will be defined once the dashboard pages are finalized."
              />
            }
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
