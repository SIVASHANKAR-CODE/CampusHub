import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import {
  Users, MessageSquare, Building, Bus, Users2, Calendar,
  BookOpen, ClipboardList, TrendingDown, BarChart2, FileText, Megaphone
} from 'lucide-react';

function StatCard({ label, value, icon: Icon, color = 'var(--brand)', to, sublabel }) {
  const inner = (
    <div className="card" style={{
      display: 'flex', alignItems: 'center', gap: 'var(--space-4)',
      transition: 'box-shadow var(--transition-base)',
      cursor: to ? 'pointer' : 'default'
    }}>
      <div style={{
        background: color + '18', borderRadius: 'var(--radius-md)',
        padding: 'var(--space-3)', flexShrink: 0
      }}>
        <Icon size={22} style={{ color }} />
      </div>
      <div>
        <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--ink)', lineHeight: 1 }}>
          {value != null ? value : <span className="skeleton" style={{ display: 'inline-block', width: '40px', height: '1.5rem', borderRadius: '4px' }} />}
        </div>
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-muted)', marginTop: '2px' }}>{label}</div>
        {sublabel && <div style={{ fontSize: 'var(--text-xs)', color, marginTop: '2px' }}>{sublabel}</div>}
      </div>
    </div>
  );
  return to ? <Link to={to} style={{ textDecoration: 'none' }}>{inner}</Link> : inner;
}

const adminModules = [
  { to: '/admin/students', icon: Users, label: 'Students', color: 'var(--brand)' },
  { to: '/admin/complaints', icon: MessageSquare, label: 'Complaints', color: 'var(--warning)' },
  { to: '/admin/hostel', icon: Building, label: 'Hostel', color: 'var(--info)' },
  { to: '/admin/transport', icon: Bus, label: 'Transport', color: 'var(--success)' },
  { to: '/admin/clubs', icon: Users2, label: 'Clubs', color: '#8B5CF6' },
  { to: '/admin/events', icon: Calendar, label: 'Events', color: '#F59E0B' },
  { to: '/admin/announcements', icon: Megaphone, label: 'Announcements', color: 'var(--danger)' },
  { to: '/admin/library', icon: BookOpen, label: 'Library', color: '#10B981' },
  { to: '/admin/knowledge', icon: BarChart2, label: 'AI Knowledge', color: '#6366F1' },
  { to: '/admin/audit-logs', icon: FileText, label: 'Audit Logs', color: 'var(--ink-muted)' },
];

export default function AdminDashboard() {
  const { data: raw, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async () => {
      const { data } = await adminAPI.dashboard();
      return data.data;
    },
    staleTime: 30000,
  });

  // Normalise both flat and nested API shapes
  const d = raw ?? {};
  const stats = {
    totalStudents:    d.totalStudents ?? d.students?.total,
    hostellers:       d.hostellers    ?? d.students?.hostellers,
    dayScholars:      d.dayScholars   ?? d.students?.dayScholars,
    pendingComplaints:d.pendingComplaints ?? d.complaints?.pending,
    activeComplaints: d.activeComplaints  ?? d.complaints?.active,
    activeBuses:      d.activeBuses   ?? d.transport?.activeBuses,
    totalClubs:       d.totalClubs    ?? d.community?.clubs,
    upcomingExams:    d.upcomingExams ?? d.upcoming?.exams,
    upcomingEvents:   d.upcomingEvents?? d.upcoming?.events,
    pendingLeave:     d.pendingLeave  ?? d.applications?.leave,
    pendingOD:        d.pendingOD     ?? d.applications?.od,
    totalBooks:       d.totalBooks    ?? d.library?.books,
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Admin Dashboard</h1>
        <p className="page-subtitle">
          Campus overview — {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: 'var(--space-4)',
        marginBottom: 'var(--space-8)'
      }}>
        <StatCard label="Total Students" value={stats.totalStudents} icon={Users} color="var(--brand)" to="/admin/students" />
        <StatCard label="Hostellers" value={stats.hostellers} icon={Building} color="var(--info)" to="/admin/hostel"
          sublabel={stats.dayScholars != null ? `${stats.dayScholars} day scholars` : undefined} />
        <StatCard label="Active Buses" value={stats.activeBuses} icon={Bus} color="var(--success)" to="/admin/transport" />
        <StatCard label="Pending Complaints" value={stats.pendingComplaints} icon={MessageSquare} color="var(--warning)" to="/admin/complaints"
          sublabel={stats.pendingComplaints > 0 ? 'Needs attention' : undefined} />
        <StatCard label="Low Attendance" value={0} icon={TrendingDown} color="var(--danger)" sublabel="Students below 80%" />
        <StatCard label="Pending Leave / OD"
          value={(stats.pendingLeave ?? 0) + (stats.pendingOD ?? 0)}
          icon={ClipboardList} color="var(--warning)" />
        <StatCard label="Upcoming Exams" value={stats.upcomingExams} icon={Calendar} color="#F59E0B" />
        <StatCard label="Clubs" value={stats.totalClubs} icon={Users2} color="#8B5CF6" to="/admin/clubs" />
      </div>

      {/* Modules */}
      <section>
        <h2 className="section-title">Management Modules</h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: 'var(--space-3)'
        }}>
          {adminModules.map(({ to, icon: Icon, label, color }) => (
            <Link key={to} to={to} style={{
              background: 'var(--surface-raised)', border: '1px solid var(--line)',
              borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)',
              display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
              gap: 'var(--space-3)', textDecoration: 'none',
              boxShadow: 'var(--shadow-card)',
              transition: 'box-shadow var(--transition-base)',
            }}>
              <div style={{ background: color + '18', borderRadius: 'var(--radius-md)', padding: 'var(--space-2)' }}>
                <Icon size={20} style={{ color }} />
              </div>
              <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--ink)' }}>{label}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
