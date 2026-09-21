import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { GraduationCap, Loader } from 'lucide-react';
import PWAInstallPrompt from './components/PWAInstallPrompt';

// Layouts
import StudentLayout from './layouts/StudentLayout';
import AdminLayout from './layouts/AdminLayout';
import AuthLayout from './layouts/AuthLayout';

// Public pages (eager for instant first paint)
import Landing from './pages/Landing';
import Login from './pages/Login';

// Student pages (lazy loaded on demand)
const StudentDashboard = lazy(() => import('./pages/student/Dashboard'));
const StudentFees = lazy(() => import('./pages/student/Fees'));
const StudentAttendance = lazy(() => import('./pages/student/Attendance'));
const StudentExams = lazy(() => import('./pages/student/Exams'));
const StudentResults = lazy(() => import('./pages/student/Results'));
const StudentTimetable = lazy(() => import('./pages/student/Timetable'));
const StudentLeave = lazy(() => import('./pages/student/Leave'));
const StudentComplaints = lazy(() => import('./pages/student/Complaints'));
const StudentHostel = lazy(() => import('./pages/student/Hostel'));
const StudentTransport = lazy(() => import('./pages/student/Transport'));
const StudentClubs = lazy(() => import('./pages/student/Clubs'));
const StudentEvents = lazy(() => import('./pages/student/Events'));
const StudentAnnouncements = lazy(() => import('./pages/student/Announcements'));
const StudentLibrary = lazy(() => import('./pages/student/Library'));
const StudentQuestionPapers = lazy(() => import('./pages/student/QuestionPapers'));
const StudentLostFound = lazy(() => import('./pages/student/LostFound'));
const StudentAI = lazy(() => import('./pages/student/AIAssistant'));
const StudentNotifications = lazy(() => import('./pages/student/Notifications'));
const StudentProfile = lazy(() => import('./pages/student/Profile'));

// Faculty pages
const FacultyDashboard = lazy(() => import('./pages/faculty/Dashboard'));
const FacultyAttendance = lazy(() => import('./pages/faculty/Attendance'));

// Mentor pages
const MentorDashboard = lazy(() => import('./pages/mentor/Dashboard'));
const MentorLeaveReview = lazy(() => import('./pages/mentor/LeaveReview'));

// Admin pages
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminStudents = lazy(() => import('./pages/admin/Students'));
const AdminExams = lazy(() => import('./pages/admin/Exams'));
const AdminTimetable = lazy(() => import('./pages/admin/Timetable'));
const AdminFees = lazy(() => import('./pages/admin/Fees'));
const AdminComplaints = lazy(() => import('./pages/admin/Complaints'));
const AdminHostel = lazy(() => import('./pages/admin/Hostel'));
const AdminTransport = lazy(() => import('./pages/admin/Transport'));
const AdminClubs = lazy(() => import('./pages/admin/Clubs'));
const AdminEvents = lazy(() => import('./pages/admin/Events'));
const AdminAnnouncements = lazy(() => import('./pages/admin/Announcements'));
const AdminLibrary = lazy(() => import('./pages/admin/Library'));
const AdminQuestionPapers = lazy(() => import('./pages/admin/QuestionPapers'));
const AdminKnowledge = lazy(() => import('./pages/admin/Knowledge'));
const AdminAuditLogs = lazy(() => import('./pages/admin/AuditLogs'));

// Maintenance
const MaintenanceDashboard = lazy(() => import('./pages/maintenance/Dashboard'));

// Driver
const DriverDashboard = lazy(() => import('./pages/driver/Dashboard'));

// Not Found
const NotFound = lazy(() => import('./pages/NotFound'));

function LoadingScreen() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
      height: '100vh',
      background: 'var(--surface)',
      color: 'var(--ink-muted)',
      fontWeight: 600,
      letterSpacing: '0.02em',
      flexDirection: 'column'
    }}>
      <GraduationCap size={32} style={{ color: 'var(--brand)' }} />
      <span style={{ color: 'var(--brand)', fontSize: '1.1rem', fontWeight: 700 }}>CampusHub</span>
      <Loader size={18} style={{ color: 'var(--brand)', animation: 'spin 1s linear infinite' }} />
      <span>Loading</span>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function RequireAuth({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/login" replace />;
  return children;
}

function RoleRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  const redirectMap = {
    student: '/student',
    faculty: '/faculty',
    mentor: '/mentor',
    admin: '/admin',
    maintenance: '/maintenance',
    driver: '/driver',
    transport_staff: '/admin',
    security: '/admin',
    club_president: '/student',
  };
  return <Navigate to={redirectMap[user.role] || '/login'} replace />;
}

export default function App() {
  return (
    <>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<AuthLayout><Login /></AuthLayout>} />

        {/* Role-based redirect */}
        <Route path="/dashboard" element={<RoleRedirect />} />

        {/* ─── Student ───────────────────────────────────── */}
        <Route path="/student" element={<RequireAuth allowedRoles={['student', 'club_president']}><StudentLayout /></RequireAuth>}>
          <Route index element={<StudentDashboard />} />
          <Route path="fees" element={<StudentFees />} />
          <Route path="attendance" element={<StudentAttendance />} />
          <Route path="exams" element={<StudentExams />} />
          <Route path="results" element={<StudentResults />} />
          <Route path="timetable" element={<StudentTimetable />} />
          <Route path="leave" element={<StudentLeave />} />
          <Route path="complaints" element={<StudentComplaints />} />
          <Route path="hostel" element={<StudentHostel />} />
          <Route path="transport" element={<StudentTransport />} />
          <Route path="clubs" element={<StudentClubs />} />
          <Route path="events" element={<StudentEvents />} />
          <Route path="announcements" element={<StudentAnnouncements />} />
          <Route path="library" element={<StudentLibrary />} />
          <Route path="question-papers" element={<StudentQuestionPapers />} />
          <Route path="lost-found" element={<StudentLostFound />} />
          <Route path="ai" element={<StudentAI />} />
          <Route path="notifications" element={<StudentNotifications />} />
          <Route path="profile" element={<StudentProfile />} />
        </Route>

        {/* ─── Faculty ───────────────────────────────────── */}
        <Route path="/faculty" element={<RequireAuth allowedRoles={['faculty']}><StudentLayout /></RequireAuth>}>
          <Route index element={<FacultyDashboard />} />
          <Route path="attendance" element={<FacultyAttendance />} />
          <Route path="notifications" element={<StudentNotifications />} />
        </Route>

        {/* ─── Mentor ────────────────────────────────────── */}
        <Route path="/mentor" element={<RequireAuth allowedRoles={['mentor']}><StudentLayout /></RequireAuth>}>
          <Route index element={<MentorDashboard />} />
          <Route path="leave" element={<MentorLeaveReview />} />
          <Route path="notifications" element={<StudentNotifications />} />
        </Route>

        {/* ─── Admin ─────────────────────────────────────── */}
        <Route path="/admin" element={<RequireAuth allowedRoles={['admin', 'transport_staff', 'security']}><AdminLayout /></RequireAuth>}>
          <Route index element={<AdminDashboard />} />
          <Route path="students" element={<AdminStudents />} />
          <Route path="exams" element={<AdminExams />} />
          <Route path="timetable" element={<AdminTimetable />} />
          <Route path="fees" element={<AdminFees />} />
          <Route path="complaints" element={<AdminComplaints />} />
          <Route path="hostel" element={<AdminHostel />} />
          <Route path="transport" element={<AdminTransport />} />
          <Route path="clubs" element={<AdminClubs />} />
          <Route path="events" element={<AdminEvents />} />
          <Route path="announcements" element={<AdminAnnouncements />} />
          <Route path="library" element={<AdminLibrary />} />
          <Route path="question-papers" element={<AdminQuestionPapers />} />
          <Route path="knowledge" element={<AdminKnowledge />} />
          <Route path="audit-logs" element={<AdminAuditLogs />} />
        </Route>

        {/* ─── Maintenance ───────────────────────────────── */}
        <Route path="/maintenance" element={<RequireAuth allowedRoles={['maintenance']}><StudentLayout /></RequireAuth>}>
          <Route index element={<MaintenanceDashboard />} />
          <Route path="notifications" element={<StudentNotifications />} />
        </Route>

        {/* ─── Driver ────────────────────────────────────── */}
        <Route path="/driver" element={<RequireAuth allowedRoles={['driver']}><StudentLayout /></RequireAuth>}>
          <Route index element={<DriverDashboard />} />
          <Route path="notifications" element={<StudentNotifications />} />
        </Route>

        <Route path="*" element={<Suspense fallback={<LoadingScreen />}><NotFound /></Suspense>} />
      </Routes>
      <PWAInstallPrompt />
    </>
  );
}
