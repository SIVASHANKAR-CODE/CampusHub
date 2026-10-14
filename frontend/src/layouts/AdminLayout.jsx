import { useState, useEffect, useCallback } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  LayoutDashboard, Users, MessageSquare, Building, Bus,
  Users2, Calendar, Megaphone, BookOpen, Brain, FileText,
  Sun, Moon, LogOut, GraduationCap, Clock, CreditCard,
  Menu, X
} from 'lucide-react';
import Avatar from '../components/common/Avatar';
import { preloadRoute } from '../utils/routePrefetch';
import './AdminLayout.css';

const adminNavLinks = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/students', icon: Users, label: 'Students' },
  { to: '/admin/exams', icon: GraduationCap, label: 'Exams' },
  { to: '/admin/timetable', icon: Clock, label: 'Timetable' },
  { to: '/admin/fees', icon: CreditCard, label: 'Fees' },
  { to: '/admin/complaints', icon: MessageSquare, label: 'Complaints' },
  { to: '/admin/hostel', icon: Building, label: 'Hostel' },
  { to: '/admin/transport', icon: Bus, label: 'Transport' },
  { to: '/admin/clubs', icon: Users2, label: 'Clubs' },
  { to: '/admin/events', icon: Calendar, label: 'Events' },
  { to: '/admin/announcements', icon: Megaphone, label: 'Announcements' },
  { to: '/admin/library', icon: BookOpen, label: 'Library' },
  { to: '/admin/question-papers', icon: FileText, label: 'Question Papers' },
  { to: '/admin/knowledge', icon: Brain, label: 'AI Knowledge' },
  { to: '/admin/audit-logs', icon: FileText, label: 'Audit Logs' },
];

export default function AdminLayout() {
  const { user, profile, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close drawer on route navigation
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  // Handle ESC key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && drawerOpen) {
        setDrawerOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [drawerOpen]);

  // Body scroll lock
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

  const handleLogout = useCallback(async () => {
    await logout();
    navigate('/');
  }, [logout, navigate]);

  return (
    <div className="admin-layout-root">
      {/* ─── Mobile / Tablet Topbar (< 1024px) ─────────────── */}
      <header className="admin-mobile-topbar">
        <div className="admin-mobile-topbar-left">
          <button
            type="button"
            className="admin-menu-trigger"
            onClick={() => setDrawerOpen(prev => !prev)}
            aria-label={drawerOpen ? 'Close navigation drawer' : 'Open navigation drawer'}
            aria-expanded={drawerOpen}
          >
            <Menu size={22} />
          </button>
          <NavLink to="/admin" className="admin-mobile-brand">
            <span className="admin-brand-title">CampusHub</span>
            <span className="admin-brand-badge">Admin</span>
          </NavLink>
        </div>

        <div className="admin-mobile-topbar-right">
          <button
            type="button"
            className="admin-topbar-btn"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
          </button>
          <button
            type="button"
            className="admin-topbar-btn"
            onClick={handleLogout}
            aria-label="Sign out"
            style={{ color: 'var(--danger)' }}
          >
            <LogOut size={19} />
          </button>
        </div>
      </header>

      {/* ─── Mobile Slide-over Drawer (< 1024px) ───────────── */}
      {drawerOpen && (
        <div
          className="admin-drawer-backdrop"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside className={`admin-mobile-drawer ${drawerOpen ? 'open' : ''}`} aria-label="Admin mobile navigation drawer">
        <div className="admin-drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Avatar
              src={profile?.photoUrl || profile?.profilePhoto || user?.photoUrl}
              name={profile?.name || user?.name || 'Admin'}
              size={36}
            />
            <div>
              <div className="admin-sidebar-logo">CampusHub</div>
              <div className="admin-sidebar-sub">{profile?.name || user?.email || 'Administrator'}</div>
            </div>
          </div>
          <button
            type="button"
            className="admin-drawer-close"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close navigation drawer"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="admin-drawer-body">
          {adminNavLinks.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setDrawerOpen(false)}
              onMouseEnter={() => preloadRoute(to)}
              onTouchStart={() => preloadRoute(to)}
              onFocus={() => preloadRoute(to)}
              className={({ isActive }) => `admin-sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} /> <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="admin-drawer-footer">
          <button type="button" className="admin-footer-btn" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          <button type="button" className="admin-footer-btn logout" onClick={handleLogout}>
            <LogOut size={18} /> <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* ─── Desktop Persistent Sidebar (>= 1024px) ────────── */}
      <aside className="admin-sidebar" aria-label="Admin desktop sidebar">
        <div className="admin-sidebar-header">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div>
              <div className="admin-sidebar-logo">CampusHub</div>
              <div className="admin-sidebar-sub">Admin Panel</div>
            </div>
            <Avatar
              src={profile?.photoUrl || profile?.profilePhoto || user?.photoUrl}
              name={profile?.name || user?.name || 'Admin'}
              size={36}
            />
          </div>
        </div>

        <nav className="admin-sidebar-nav">
          {adminNavLinks.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onMouseEnter={() => preloadRoute(to)}
              onTouchStart={() => preloadRoute(to)}
              onFocus={() => preloadRoute(to)}
              className={({ isActive }) => `admin-sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} /> <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <button type="button" className="admin-footer-btn" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          <button type="button" className="admin-footer-btn logout" onClick={handleLogout}>
            <LogOut size={18} /> <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* ─── Main Content ──────────────────────────────────── */}
      <main className="admin-main-content">
        <div className="page-container">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
