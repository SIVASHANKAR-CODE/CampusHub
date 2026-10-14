import { useMemo, useCallback, useEffect, Suspense } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useQuery } from '@tanstack/react-query';
import { notificationsAPI } from '../services/api';
import { preloadRoute, preloadStudentRoutes } from '../utils/routePrefetch';
import {
  Home, FileText, ClipboardList, Bell, User, Sun, Moon, LogOut,
  BookOpen, Bus, Building, Users, Calendar, Map, Search, Megaphone,
  MessageSquare, Bot, Loader
} from 'lucide-react';
import './StudentLayout.css';

function ContentSkeleton() {
  return (
    <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div className="skeleton" style={{ height: '28px', width: '180px', borderRadius: 'var(--radius-md)' }} />
      <div className="skeleton" style={{ height: '16px', width: '260px', borderRadius: 'var(--radius-sm)' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-3)', marginTop: 'var(--space-3)' }}>
        {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: '100px', borderRadius: 'var(--radius-md)' }} />)}
      </div>
      <div className="skeleton" style={{ height: '200px', borderRadius: 'var(--radius-md)', marginTop: 'var(--space-2)' }} />
    </div>
  );
}

const studentNavItems = [
  { to: '/student', label: 'Home', icon: Home, end: true },
  { to: '/student/attendance', label: 'Attendance', icon: ClipboardList },
  { to: '/student/ai', label: 'AI Assistant', icon: Bot },
  { to: '/student/notifications', label: 'Notifications', icon: Bell },
  { to: '/student/profile', label: 'Profile', icon: User },
];

const baseServiceLinks = [
  { to: '/student/fees', label: 'Fees', icon: FileText },
  { to: '/student/exams', label: 'Exams', icon: ClipboardList },
  { to: '/student/timetable', label: 'Timetable', icon: Calendar },
  { to: '/student/results', label: 'Results', icon: BookOpen },
  { to: '/student/leave', label: 'Leave & OD', icon: FileText },
  { to: '/student/complaints', label: 'Complaints', icon: MessageSquare },
  { to: '/student/hostel', label: 'Hostel', icon: Building, accommodation: 'hosteller' },
  { to: '/student/transport', label: 'Transport', icon: Bus, accommodation: 'day_scholar' },
  { to: '/student/library', label: 'Library', icon: BookOpen },
  { to: '/student/clubs', label: 'Clubs', icon: Users },
  { to: '/student/events', label: 'Events', icon: Calendar },
  { to: '/student/announcements', label: 'Announcements', icon: Megaphone },
  { to: '/student/lost-found', label: 'Lost & Found', icon: Search },
  { to: '/student/question-papers', label: 'Question Papers', icon: FileText },
];

const roleNavConfigs = {
  faculty: {
    mainItems: [
      { to: '/faculty', label: 'Schedule', icon: Home, end: true },
      { to: '/faculty/attendance', label: 'Mark Attendance', icon: ClipboardList },
    ],
    services: [],
    bottomItems: [
      { to: '/faculty', label: 'Schedule', icon: Home, end: true },
      { to: '/faculty/attendance', label: 'Attendance', icon: ClipboardList },
      { to: '/faculty/notifications', label: 'Alerts', icon: Bell },
    ],
    notifPath: '/faculty/notifications',
  },
  mentor: {
    mainItems: [
      { to: '/mentor', label: 'Dashboard', icon: Home, end: true },
      { to: '/mentor/leave', label: 'Leave Reviews', icon: FileText },
    ],
    services: [],
    bottomItems: [
      { to: '/mentor', label: 'Dashboard', icon: Home, end: true },
      { to: '/mentor/leave', label: 'Leave Reviews', icon: FileText },
      { to: '/mentor/notifications', label: 'Alerts', icon: Bell },
    ],
    notifPath: '/mentor/notifications',
  },
  maintenance: {
    mainItems: [
      { to: '/maintenance', label: 'Complaints & Tasks', icon: Home, end: true },
    ],
    services: [],
    bottomItems: [
      { to: '/maintenance', label: 'Tasks', icon: Home, end: true },
      { to: '/maintenance/notifications', label: 'Alerts', icon: Bell },
    ],
    notifPath: '/maintenance/notifications',
  },
  driver: {
    mainItems: [
      { to: '/driver', label: 'Trips & Location', icon: Bus, end: true },
    ],
    services: [],
    bottomItems: [
      { to: '/driver', label: 'Trips', icon: Bus, end: true },
      { to: '/driver/notifications', label: 'Alerts', icon: Bell },
    ],
    notifPath: '/driver/notifications',
  },
  student: {
    mainItems: [
      { to: '/student', label: 'Home', icon: Home, end: true },
      { to: '/student/attendance', label: 'Attendance', icon: ClipboardList },
      { to: '/student/ai', label: 'AI Assistant', icon: Bot },
    ],
    services: baseServiceLinks,
    bottomItems: studentNavItems,
    notifPath: '/student/notifications',
  },
};

export default function StudentLayout() {
  const { user, profile, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const role = user?.role || 'student';
  const navConfig = roleNavConfigs[role] || roleNavConfigs.student;

  const filteredServices = useMemo(() => {
    return (navConfig.services || []).filter((item) => {
      if (item.accommodation === 'hosteller') {
        return profile?.hostelStatus === 'hosteller';
      }
      if (item.accommodation === 'day_scholar') {
        return profile?.hostelStatus === 'day_scholar' || !profile?.hostelStatus;
      }
      return true;
    });
  }, [navConfig.services, profile?.hostelStatus]);

  // Idle prefetch: preload all student routes on mount during idle time
  useEffect(() => {
    if (role === 'student' || role === 'club_president') {
      const idleId = typeof requestIdleCallback === 'function'
        ? requestIdleCallback(() => preloadStudentRoutes(), { timeout: 3000 })
        : setTimeout(() => preloadStudentRoutes(), 2000);
      return () => {
        if (typeof cancelIdleCallback === 'function' && typeof idleId === 'number') {
          cancelIdleCallback(idleId);
        }
      };
    }
  }, [role]);

  // Preload the current route's chunk (for direct URL navigation)
  useEffect(() => {
    const currentPath = location.pathname;
    const allRoutes = [...(navConfig.mainItems || []), ...filteredServices];
    const exactMatch = allRoutes.find((item) => item.to === currentPath);
    if (exactMatch) {
      preloadRoute(exactMatch.to);
    }
  }, [location.pathname, navConfig.mainItems, filteredServices]);

  const { data: notifData } = useQuery({
    queryKey: ['notifications-count', user?.id, user?.role],
    queryFn: async () => {
      const { data } = await notificationsAPI.list({ limit: 1 });
      return data.data?.unread || 0;
    },
    staleTime: 60000,
    refetchInterval: 60000,
    refetchOnWindowFocus: false,
  });

  const unreadCount = notifData || 0;

  const handleLogout = useCallback(async () => {
    await logout();
    navigate('/');
  }, [logout, navigate]);

  const regNo = profile?.regNo || profile?.registrationNumber;

  return (
    <div className="app-layout">
      {/* ─── Desktop Sidebar ───────────────────── */}
      <aside className="sidebar desktop-only">
        <div className="sidebar-header">
          <span className="sidebar-logo">CampusHub</span>
          {profile?.name && <span className="sidebar-user">{profile.name}</span>}
          {regNo && (
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              background: 'var(--brand-muted, #e0e7ff)',
              color: 'var(--brand, #4338ca)',
              padding: '2px 8px',
              borderRadius: '4px',
              display: 'inline-block',
              marginTop: '4px',
              letterSpacing: '0.5px'
            }}>
              {regNo}
            </span>
          )}
          {user?.role && <span className="sidebar-role">{user.role?.replace('_', ' ')}</span>}
        </div>

        <nav className="sidebar-nav">
          {navConfig.mainItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onMouseEnter={() => preloadRoute(to)}
              onFocus={() => preloadRoute(to)}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} /> <span>{label}</span>
            </NavLink>
          ))}

          {filteredServices.length > 0 && (
            <>
              <div className="sidebar-section-label">Services</div>
              {filteredServices.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onMouseEnter={() => preloadRoute(to)}
                  onFocus={() => preloadRoute(to)}
                  className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                >
                  <Icon size={18} /> <span>{label}</span>
                </NavLink>
              ))}
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <NavLink
            to={navConfig.notifPath}
            onMouseEnter={() => preloadRoute(navConfig.notifPath)}
            onFocus={() => preloadRoute(navConfig.notifPath)}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Bell size={18} />
            <span>Notifications</span>
            {unreadCount > 0 && <span className="notif-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
          </NavLink>
          <button className="sidebar-link" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          <button className="sidebar-link logout" onClick={handleLogout}>
            <LogOut size={18} /> <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* ─── Main Content ──────────────────────── */}
      <main className="main-content">
        <Suspense fallback={<ContentSkeleton />}>
          <Outlet />
        </Suspense>
      </main>

      {/* ─── Mobile Bottom Navigation ──────────── */}
      <nav className="bottom-nav mobile-only">
        {navConfig.bottomItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onMouseEnter={() => preloadRoute(to)}
            onFocus={() => preloadRoute(to)}
            className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
          >
            <div className="bottom-nav-icon-wrap">
              <Icon size={22} />
              {(label === 'Notifications' || label === 'Alerts') && unreadCount > 0 && (
                <span className="bottom-notif-dot" />
              )}
            </div>
            <span className="bottom-nav-label">{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
