import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { leaveAPI, attendanceAPI } from '../../services/api';
import {
  Users, ClipboardList, AlertTriangle, ChevronRight,
  TrendingDown, Clock, CheckCircle
} from 'lucide-react';

function StatCard({ label, value, icon: Icon, color = 'var(--brand)', sublabel }) {
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-4)' }}>
      <div style={{
        background: color + '18', borderRadius: 'var(--radius-md)',
        padding: 'var(--space-3)', flexShrink: 0
      }}>
        <Icon size={22} style={{ color }} />
      </div>
      <div>
        <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--ink)' }}>{value ?? '—'}</div>
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-muted)', marginTop: '2px' }}>{label}</div>
        {sublabel && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)', marginTop: '2px' }}>{sublabel}</div>}
      </div>
    </div>
  );
}

export default function MentorDashboard() {
  const { profile } = useAuth();

  const { data: leaveData, isLoading } = useQuery({
    queryKey: ['mentor-leave-mentee'],
    queryFn: async () => {
      const { data } = await leaveAPI.menteeList({ status: 'pending' });
      return data.data;
    },
    staleTime: 30000,
  });

  const pendingLeave = leaveData?.leave?.length ?? 0;
  const pendingOD = leaveData?.od?.length ?? 0;

  return (
    <div style={{ maxWidth: '860px' }}>
      <div className="page-header">
        <h1 className="page-title">Mentor Dashboard</h1>
        <p className="page-subtitle">
          Welcome, {profile?.name?.split(' ')[0] || 'Mentor'} —{' '}
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: 'var(--space-4)', marginBottom: 'var(--space-6)'
      }}>
        <StatCard label="Pending Leave Requests" value={pendingLeave} icon={ClipboardList} color="var(--warning)" />
        <StatCard label="Pending OD Requests" value={pendingOD} icon={Clock} color="var(--info)" />
      </div>

      {/* Pending Requests */}
      <section style={{ marginBottom: 'var(--space-6)' }}>
        <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-4)' }}>
          <h2 className="section-title" style={{ margin: 0 }}>Pending Applications</h2>
          <Link to="/mentor/leave" style={{
            fontSize: 'var(--text-sm)', color: 'var(--brand)',
            display: 'flex', alignItems: 'center', gap: '4px'
          }}>
            Review All <ChevronRight size={14} />
          </Link>
        </div>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {isLoading ? (
            <div style={{ padding: 'var(--space-6)' }}>
              {[1, 2, 3].map(i => (
                <div key={i} className="skeleton" style={{ height: '56px', marginBottom: 'var(--space-3)', borderRadius: 'var(--radius-md)' }} />
              ))}
            </div>
          ) : (pendingLeave + pendingOD) === 0 ? (
            <div style={{ padding: 'var(--space-10)', textAlign: 'center', color: 'var(--ink-faint)' }}>
              <CheckCircle size={32} style={{ margin: '0 auto var(--space-3)', color: 'var(--success)' }} />
              <p style={{ fontSize: 'var(--text-sm)' }}>No pending applications</p>
            </div>
          ) : (
            <>
              {leaveData?.leave?.slice(0, 5).map((item) => (
                <div key={item._id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: 'var(--space-4) var(--space-5)',
                  borderBottom: '1px solid var(--line)'
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>
                      {item.student?.name || 'Student'} — Leave
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-muted)', marginTop: '2px' }}>
                      {new Date(item.startDate).toLocaleDateString('en-IN')} → {new Date(item.endDate).toLocaleDateString('en-IN')} • {item.reason}
                    </div>
                  </div>
                  <span className="badge badge-warning">Pending</span>
                </div>
              ))}
              {leaveData?.od?.slice(0, 3).map((item) => (
                <div key={item._id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: 'var(--space-4) var(--space-5)',
                  borderBottom: '1px solid var(--line)'
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>
                      {item.student?.name || 'Student'} — OD
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-muted)', marginTop: '2px' }}>
                      {item.event} • {new Date(item.date).toLocaleDateString('en-IN')}
                    </div>
                  </div>
                  <span className="badge badge-info">Pending</span>
                </div>
              ))}
            </>
          )}
        </div>
      </section>

      {/* Actions */}
      <section>
        <h2 className="section-title">Quick Actions</h2>
        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <Link to="/mentor/leave" style={{
            display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)',
            padding: '10px 20px', background: 'var(--brand)', color: '#fff',
            borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: 'var(--text-sm)'
          }}>
            <ClipboardList size={16} /> Review Leave / OD
          </Link>
          <Link to="/mentor/notifications" style={{
            display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)',
            padding: '10px 20px', background: 'var(--surface-raised)', color: 'var(--ink)',
            border: '1px solid var(--line)', borderRadius: 'var(--radius-md)',
            fontWeight: 500, fontSize: 'var(--text-sm)'
          }}>
            Notifications
          </Link>
        </div>
      </section>
    </div>
  );
}
