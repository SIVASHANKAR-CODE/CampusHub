import { useState, useMemo, useCallback, useEffect, Suspense } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useQuery } from '@tanstack/react-query';
import { notificationsAPI } from '../services/api';
import { preloadRoute } from '../utils/routePrefetch';
import {
  Home, FileText, ClipboardList, Bell, User, Sun, Moon, LogOut,
  BookOpen, Bus, Building, Users, Calendar, Search, Megaphone,
  MessageSquare, Bot, Menu, X, Compass
} from 'lucide-react';
import Avatar from '../components/common/Avatar';
import './StudentLayout.css';

function ContentSkeleton() {
  return (
    <div style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', width: '100%', boxSizing: 'border-box' }}>
      <div className="skeleton" style={{ height: '28px', width: 'min(200px, 60%)', borderRadius: 'var(--radius-md)' }} />
      <div className="skeleton" style={{ height: '16px', width: 'min(280px, 80%)', borderRadius: 'var(--radius-sm)' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
        {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '100px', borderRadius: 'var(--radius-md)' }} />)}
      </div>
      <div className="skeleton" style={{ height: '180px', borderRadius: 'var(--radius-md)', marginTop: 'var(--space-2)' }} />
    </div>
  );
}

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
      { to: '/student/profile', label: 'Profile', icon: User },
    ],
    services: baseServiceLinks,
    bottomItems: [
      { to: '/student', label: 'Home', icon: Home, end: true },
      { to: '/student/attendance', label: 'Attendance', icon: ClipboardList },
      { to: '/student/ai', label: 'AI Assistant', icon: Bot },
      { to: '/student/notifications', label: 'Alerts', icon: Bell },
    ],
    notifPath: '/student/notifications',
  },
};

export default function StudentLayout() {
  const { user, profile, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

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

  // Close drawer whenever the route changes
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  // Handle ESC key to close drawer
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && drawerOpen) {
        setDrawerOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [drawerOpen]);

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [drawerOpen]);

  // Preload the current route's chunk on direct navigation
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
      {/* ─── Mobile / Tablet Topbar Header (< 1024px) ─────────────── */}
      <header className="mobile-topbar mobile-only">
        <div className="mobile-topbar-left">
          <button
            type="button"
            className="mobile-menu-trigger"
            onClick={() => setDrawerOpen((prev) => !prev)}
            aria-label={drawerOpen ? 'Close navigation drawer' : 'Open navigation drawer'}
            aria-expanded={drawerOpen}
          >
            <Menu size={22} />
          </button>
          <NavLink to={navConfig.mainItems[0]?.to || '/student'} className="mobile-brand-title">
            <span>CampusHub</span>
          </NavLink>
        </div>

        <div className="mobile-topbar-right">
          <NavLink
            to={navConfig.notifPath}
            className="mobile-topbar-btn"
            aria-label="View notifications"
          >
            <Bell size={20} />
            {unreadCount > 0 && <span className="bottom-notif-dot" />}
          </NavLink>
          <button
            type="button"
            className="mobile-topbar-btn"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
          </button>
        </div>
      </header>

      {/* ─── Mobile Slide-over Drawer (< 1024px) ─────────────────── */}
      {drawerOpen && (
        <div
          className="drawer-backdrop"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside className={`mobile-drawer ${drawerOpen ? 'open' : ''}`} aria-label="Mobile navigation drawer">
        <div className="drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
            <Avatar
              src={profile?.photoUrl || profile?.profilePhoto || user?.photoUrl}
              name={profile?.name || user?.name}
              size={42}
            />
            <div className="drawer-user-info" style={{ minWidth: 0 }}>
              <div className="drawer-brand">CampusHub</div>
              {profile?.name && <div className="drawer-username">{profile.name}</div>}
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
              {user?.role && <div className="sidebar-role">{user.role?.replace('_', ' ')}</div>}
            </div>
          </div>
          <button
            type="button"
            className="drawer-close-btn"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close navigation drawer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="drawer-body">
          <div className="sidebar-section-label">Navigation</div>
          {navConfig.mainItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setDrawerOpen(false)}
              onMouseEnter={() => preloadRoute(to)}
              onTouchStart={() => preloadRoute(to)}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} /> <span>{label}</span>
            </NavLink>
          ))}

          {filteredServices.length > 0 && (
            <>
              <div className="sidebar-section-label">All Services</div>
              {filteredServices.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setDrawerOpen(false)}
                  onMouseEnter={() => preloadRoute(to)}
                  onTouchStart={() => preloadRoute(to)}
                  className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                >
                  <Icon size={18} /> <span>{label}</span>
                </NavLink>
              ))}
            </>
          )}
        </div>

        <div className="drawer-footer">
          <NavLink
            to={navConfig.notifPath}
            onClick={() => setDrawerOpen(false)}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Bell size={18} />
            <span>Notifications</span>
            {unreadCount > 0 && <span className="notif-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
          </NavLink>
          <button type="button" className="sidebar-link" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          <button type="button" className="sidebar-link logout" onClick={handleLogout}>
            <LogOut size={18} /> <span>Sign out</span>
          </button>
        </div>
      </aside>

      <aside className="sidebar desktop-only" aria-label="Desktop primary sidebar">
        <div className="sidebar-header">
          <span className="sidebar-logo">CampusHub</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
            <Avatar
              src={profile?.photoUrl || profile?.profilePhoto || user?.photoUrl}
              name={profile?.name || user?.name}
              size={36}
              style={{ boxShadow: 'var(--shadow-sm)' }}
            />
            <div style={{ minWidth: 0, flex: 1 }}>
              {profile?.name && <div className="sidebar-user" style={{ marginTop: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{profile.name}</div>}
              {regNo && (
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  background: 'var(--brand-muted, #e0e7ff)',
                  color: 'var(--brand, #4338ca)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  display: 'inline-block',
                  marginTop: '2px',
                  letterSpacing: '0.5px'
                }}>
                  {regNo}
                </span>
              )}
              {user?.role && <div className="sidebar-role" style={{ marginTop: '2px' }}>{user.role?.replace('_', ' ')}</div>}
            </div>
          </div>
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
          <button type="button" className="sidebar-link" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          <button type="button" className="sidebar-link logout" onClick={handleLogout}>
            <LogOut size={18} /> <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* ─── Main Content ────────────────────────────────────────── */}
      <main className="main-content">
        <Suspense fallback={<ContentSkeleton />}>
          <Outlet />
        </Suspense>
      </main>

      {/* ─── Mobile Bottom Navigation (< 1024px) ─────────────────── */}
      <nav className="bottom-nav mobile-only" aria-label="Mobile bottom navigation bar">
        {navConfig.bottomItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onMouseEnter={() => preloadRoute(to)}
            onTouchStart={() => preloadRoute(to)}
            onFocus={() => preloadRoute(to)}
            className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
          >
            <div className="bottom-nav-icon-wrap">
              <Icon size={20} />
              {(label === 'Notifications' || label === 'Alerts') && unreadCount > 0 && (
                <span className="bottom-notif-dot" />
              )}
            </div>
            <span className="bottom-nav-label">{label}</span>
          </NavLink>
        ))}

        {/* More/Services Drawer Trigger */}
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className={`bottom-nav-item ${drawerOpen ? 'active' : ''}`}
          aria-label="Open full menu and services"
        >
          <div className="bottom-nav-icon-wrap">
            <Compass size={20} />
          </div>
          <span className="bottom-nav-label">More</span>
        </button>
      </nav>
    </div>
  );
}
