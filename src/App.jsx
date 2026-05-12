import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Auth from './pages/Auth';
import DashboardLayout from './layouts/DashboardLayout';
import DashboardHome from './pages/dashboard/Home';
import CoursesPage from './pages/dashboard/Courses';
import NotesLibrary from './pages/dashboard/NotesLibrary';
import Messages from './pages/dashboard/Messages';
import NoticeBoard from './pages/dashboard/NoticeBoard';
import ProfilePage from './pages/dashboard/Profile';
import ClubsPage from './pages/dashboard/Clubs';
import JobBoardPage from './pages/dashboard/JobBoard';
import MockTestsPage from './pages/dashboard/MockTests';
import LiveClassesPage from './pages/dashboard/LiveClasses';
import AssistantPage from './pages/dashboard/Assistant';
import AlumniPage from './pages/dashboard/Alumni';
import ScholarshipsPage from './pages/dashboard/Scholarships';
import SettingsPage from './pages/dashboard/Settings';
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
          <Route index element={<DashboardHome />} />
          <Route path="courses" element={<CoursesPage />} />
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
            path="profile"
            element={<ProfilePage />}
          />
          <Route
            path="club"
            element={<ClubsPage />}
          />
          <Route path="job-board" element={<JobBoardPage />} />
          <Route path="mock-tests" element={<MockTestsPage />} />
          <Route path="live-classes" element={<LiveClassesPage />} />
          <Route path="ai-assistant" element={<AssistantPage />} />
          <Route path="alumni" element={<AlumniPage />} />
          <Route path="scholarships" element={<ScholarshipsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
