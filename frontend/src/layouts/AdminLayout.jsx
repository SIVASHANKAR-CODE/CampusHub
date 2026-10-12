import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  LayoutDashboard, Users, MessageSquare, Building, Bus,
  Users2, Calendar, Megaphone, BookOpen, Brain, FileText,
  Sun, Moon, LogOut, Settings, GraduationCap, Clock, CreditCard
} from 'lucide-react';

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
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{
        position: 'fixed', top: 0, left: 0, width: 'var(--sidebar-width)', height: '100vh',
        background: 'var(--surface-raised)', borderRight: '1px solid var(--line)',
        display: 'flex', flexDirection: 'column', overflowY: 'auto', zIndex: 100
      }}>
        <div style={{ padding: '24px 16px 16px', borderBottom: '1px solid var(--line)' }}>
          <div style={{ fontWeight: 700, fontSize: 'var(--text-xl)', color: 'var(--brand)' }}>CampusHub</div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)', marginTop: '4px', textTransform: 'capitalize' }}>Admin Panel</div>
        </div>
        <nav style={{ flex: 1, padding: '12px' }}>
          {adminNavLinks.map(({ to, icon: Icon, label, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', borderRadius: '8px', marginBottom: '2px', fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--ink-muted)', textDecoration: 'none' }}>
              <Icon size={17} /> {label}
            </NavLink>
          ))}
        </nav>
        <div style={{ padding: '12px', borderTop: '1px solid var(--line)' }}>
          <button onClick={toggleTheme} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', borderRadius: '8px', fontSize: 'var(--text-sm)', color: 'var(--ink-muted)', width: '100%', marginBottom: '4px' }}>
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />} {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
          <button onClick={async () => { await logout(); navigate('/'); }} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', borderRadius: '8px', fontSize: 'var(--text-sm)', color: 'var(--danger)', width: '100%' }}>
            <LogOut size={17} /> Sign out
          </button>
        </div>
      </aside>
      <main style={{ flex: 1, marginLeft: 'var(--sidebar-width)', padding: 'var(--space-6)', minWidth: 0, boxSizing: 'border-box' }}>
        <div className="page-container">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
