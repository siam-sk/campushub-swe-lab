import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Auth from './pages/Auth';
import DashboardLayout from './layouts/DashboardLayout';
import DashboardHome from './pages/dashboard/Home';
import CoursesPage from './pages/dashboard/Courses';
import NotesLibrary from './pages/dashboard/NotesLibrary';
import Messages from './pages/dashboard/Messages';
import DashboardSectionPage from './pages/dashboard/SectionPage';
import NoticeBoard from './pages/dashboard/NoticeBoard';
import Landing from './pages/Landing';
import RequireRole from './components/RequireRole';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />
        <Route
          path="/dashboard"
          element={
            <RequireRole allowedRoles={['student', 'faculty', 'admin']}>
              <DashboardLayout />
            </RequireRole>
          }
        >
          <Route index element={<CoursesPage />} />
          <Route
            path="notice-board"
            element={<NoticeBoard />}
          />
          <Route
            path="notes-library"
            element={<NotesLibrary />}
          />
          <Route
            path="messages"
            element={<Messages />}
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
