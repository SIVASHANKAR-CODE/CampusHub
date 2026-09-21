import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { timetableAPI, attendanceAPI } from '../../services/api';
import { Clock, Users, BookOpen, ChevronRight, AlertTriangle, CheckCircle } from 'lucide-react';

function Skeleton({ width = '100%', height = '1rem' }) {
  return <div className="skeleton" style={{ width, height, borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-2)' }} />;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function FacultyDashboard() {
  const { profile, user } = useAuth();
  const todayName = DAYS[new Date().getDay()];

  const { data: timetable, isLoading: ttLoading } = useQuery({
    queryKey: ['faculty-timetable'],
    queryFn: async () => {
      const { data } = await timetableAPI.faculty();
      return data.data;
    },
    staleTime: 60000,
  });

  const todaySlots = timetable?.filter(slot => slot.day === todayName) ?? [];

  return (
    <div style={{ maxWidth: '800px' }}>
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Welcome, {profile?.name?.split(' ')[0] || 'Faculty'}</h1>
        <p className="page-subtitle">{todayName} — {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>

      {/* Role badge */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <span className="badge badge-info" style={{ fontSize: 'var(--text-xs)', textTransform: 'capitalize' }}>
          {user?.role?.replace('_', ' ')}
        </span>
      </div>

      {/* Today's Schedule */}
      <section style={{ marginBottom: 'var(--space-6)' }}>
        <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-4)' }}>
          <h2 className="section-title" style={{ margin: 0 }}>Today's Schedule</h2>
          <Link to="/faculty/attendance" style={{ fontSize: 'var(--text-sm)', color: 'var(--brand)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            Mark Attendance <ChevronRight size={14} />
          </Link>
        </div>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {ttLoading ? (
            <div style={{ padding: 'var(--space-6)' }}>
              <Skeleton height="2.5rem" />
              <Skeleton height="2.5rem" />
              <Skeleton height="2.5rem" />
            </div>
          ) : todaySlots.length === 0 ? (
            <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--ink-faint)' }}>
              <CheckCircle size={32} style={{ margin: '0 auto var(--space-3)', color: 'var(--success)' }} />
              <p style={{ fontSize: 'var(--text-sm)' }}>No classes scheduled for today</p>
            </div>
          ) : (
            todaySlots.map((slot, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 'var(--space-4)',
                padding: 'var(--space-4) var(--space-5)',
                borderBottom: i < todaySlots.length - 1 ? '1px solid var(--line)' : 'none'
              }}>
                <div style={{
                  display: 'flex', flexDirection: 'column', gap: '2px',
                  minWidth: '110px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--brand)' }}>
                    Period {slot.period}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: 'var(--text-xs)', color: 'var(--ink-faint)' }}>
                    <Clock size={11} />
                    {slot.startTime}–{slot.endTime}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--ink)' }}>{slot.subject}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-muted)', marginTop: '2px' }}>
                    {slot.department} • Year {slot.year} • Sec {slot.section} {slot.room ? `• ${slot.room}` : ''}
                  </div>
                </div>
                <Link
                  to="/faculty/attendance"
                  state={{ slot }}
                  style={{
                    padding: '6px 14px', borderRadius: 'var(--radius-md)',
                    background: 'var(--brand-muted)', color: 'var(--brand)',
                    fontSize: 'var(--text-xs)', fontWeight: 600,
                    textDecoration: 'none'
                  }}
                >
                  Mark Period {slot.period}
                </Link>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="section-title">Quick Actions</h2>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: 'var(--space-3)'
        }}>
          {[
            { to: '/faculty/attendance', icon: Users, label: 'Mark Attendance', color: 'var(--brand)' },
            { to: '/faculty/notifications', icon: BookOpen, label: 'Notifications', color: 'var(--info)' },
          ].map(({ to, icon: Icon, label, color }) => (
            <Link key={to} to={to} style={{
              background: 'var(--surface-raised)', border: '1px solid var(--line)',
              borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)',
              display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
              gap: 'var(--space-3)', boxShadow: 'var(--shadow-card)',
              transition: 'box-shadow var(--transition-base)'
            }}>
              <div style={{
                background: color + '20', borderRadius: 'var(--radius-md)',
                padding: 'var(--space-2)'
              }}>
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
