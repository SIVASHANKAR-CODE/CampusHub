import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { studentAPI } from '../../services/api';
import { Link } from 'react-router-dom';
import {
  ClipboardList, FileText, BookOpen, Calendar, Bus,
  Building, AlertTriangle, Bell, ChevronRight, TrendingDown, Bot,
  Clock, Megaphone
} from 'lucide-react';
import './Dashboard.css';

function AttendanceRing({ percentage }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const fill = Math.min(1, Math.max(0, percentage / 100));
  const dashOffset = circ * (1 - fill);
  const color = percentage < 75 ? 'var(--danger)' : percentage < 80 ? 'var(--warning)' : 'var(--success)';

  return (
    <div className="attendance-ring">
      <svg width="90" height="90" viewBox="0 0 90 90">
        <circle cx="45" cy="45" r={r} fill="none" stroke="var(--line)" strokeWidth="8" />
        <circle
          cx="45" cy="45" r={r} fill="none"
          stroke={color} strokeWidth="8"
          strokeDasharray={circ} strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform="rotate(-90 45 45)"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div className="attendance-ring-text">
        <span style={{ color, fontWeight: 700, fontSize: '1.25rem' }}>{percentage}%</span>
        <span style={{ fontSize: '0.65rem', color: 'var(--ink-faint)' }}>overall</span>
      </div>
    </div>
  );
}

function Skeleton({ width = '100%', height = '1rem', radius = 'var(--radius-md)' }) {
  return <div className="skeleton" style={{ width, height, borderRadius: radius }} />;
}

function StatusBadge({ status }) {
  const map = {
    pending:     'badge-warning',
    approved:    'badge-success',
    rejected:    'badge-danger',
    paid:        'badge-success',
    partial:     'badge-warning',
    unpaid:      'badge-danger',
    submitted:   'badge-info',
    resolved:    'badge-success',
    closed:      'badge-neutral',
  };
  return <span className={`badge ${map[status] || 'badge-neutral'}`}>{status}</span>;
}

function formatFeeText(fees) {
  if (!fees) return 'No record';
  const dueAmount = Number(fees.dueAmount ?? 0);
  if (fees.status === 'paid') return 'Paid in full';
  if (fees.status === 'partial') return `₹${dueAmount.toLocaleString()} due`;
  if (dueAmount > 0) return `₹${dueAmount.toLocaleString()} due`;
  return 'No due';
}

export default function StudentDashboard() {
  const { profile } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ['student-dashboard'],
    queryFn: async () => {
      const { data } = await studentAPI.dashboard();
      return data.data;
    },
    staleTime: 30000,
  });

  if (error) {
    return (
      <div className="dashboard-error">
        <AlertTriangle size={32} />
        <h2>Something went wrong</h2>
        <p>Unable to load your dashboard. Please refresh the page.</p>
      </div>
    );
  }

  const attendanceSubjects = data?.attendance?.subjects ?? [];
  const todayTimetable = data?.todayTimetable ?? [];
  const upcomingExams = data?.upcomingExams ?? [];
  const announcements = data?.announcements ?? [];

  return (
    <div className="dashboard">
      {/* ─── Hero Greeting ────────────────────── */}
      <header className="dashboard-greeting">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h1 className="greeting-name" style={{ margin: 0 }}>
              {isLoading ? <Skeleton width="200px" height="1.75rem" /> : (
                <>Good {getTimeOfDay()}, {profile?.name?.split(' ')[0] || 'Student'}!</>
              )}
            </h1>
            {!isLoading && (profile?.regNo || profile?.registrationNumber || data?.student?.regNo) && (
              <span className="badge badge-info" style={{ fontSize: '0.85rem', padding: '3px 10px', fontWeight: 700 }}>
                {profile?.regNo || profile?.registrationNumber || data?.student?.regNo}
              </span>
            )}
          </div>
          {!isLoading && (
            <p className="greeting-info">
              {data?.student?.department} • Year {data?.student?.year} • {data?.student?.section} • Sem {data?.student?.semester}
            </p>
          )}
        </div>
        <Link to="/student/ai" className="ai-quick-btn">
          <Bot size={18} /> Ask AI
        </Link>
      </header>

      {/* ─── Attendance Card ──────────────────── */}
      <section className="dashboard-section">
        <div className="section-header">
          <h2 className="section-title">Attendance Overview</h2>
          <Link to="/student/attendance" className="section-link">View all <ChevronRight size={14} /></Link>
        </div>
        <div className="card attendance-card">
          {isLoading ? (
            <div className="flex gap-4 items-center">
              <Skeleton width="90px" height="90px" radius="50%" />
              <div className="flex-1">
                <Skeleton height="1rem" width="60%" />
                <Skeleton height="0.75rem" width="40%" style={{ marginTop: '8px' }} />
              </div>
            </div>
          ) : (
            <div className="attendance-overview">
              <AttendanceRing percentage={data?.attendance?.overall || 0} />
              <div className="attendance-subjects">
                {attendanceSubjects.slice(0, 4).map((s) => (
                  <div key={`${s.subject}-${s.percentage}`} className="subject-row">
                    <span className="subject-name">{s.subject}</span>
                    <div className="subject-bar-wrap">
                      <div
                        className="subject-bar-fill"
                        style={{
                          width: `${Math.min(100, Math.max(0, Number(s.percentage ?? 0)))}%`,
                          background: s.percentage < 75 ? 'var(--danger)' : s.percentage < 80 ? 'var(--warning)' : 'var(--success)'
                        }}
                      />
                    </div>
                    <span className="subject-pct" style={{ color: s.percentage < 80 ? 'var(--danger)' : 'var(--ink-muted)' }}>
                      {s.percentage}%
                    </span>
                  </div>
                ))}
                {attendanceSubjects.some(s => s.belowThreshold) && (
                  <div className="attendance-warning">
                    <TrendingDown size={14} /> Some subjects below 80% — attend more classes
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ─── Quick Status Row ─────────────────── */}
      <div className="quick-status-row">
        <Link to="/student/fees" className="status-tile">
          <FileText size={20} />
          <span className="status-tile-label">Fees</span>
          <span className="status-tile-value" style={{ color: data?.fees?.status === 'paid' ? 'var(--success)' : 'var(--warning)' }}>
            {isLoading ? '—' : formatFeeText(data?.fees)}
          </span>
        </Link>
        <Link to="/student/exams" className="status-tile">
          <ClipboardList size={20} />
          <span className="status-tile-label">Exams</span>
          <span className="status-tile-value">
            {isLoading ? '—' : data?.upcomingExams?.length ? `${data.upcomingExams.length} upcoming` : 'None soon'}
          </span>
        </Link>
        <Link to="/student/leave" className="status-tile">
          <Calendar size={20} />
          <span className="status-tile-label">Leave</span>
          <span className="status-tile-value">
            {isLoading ? '—' : data?.pendingApplications?.leave ? `${data.pendingApplications.leave} pending` : 'None'}
          </span>
        </Link>
        <Link to="/student/complaints" className="status-tile">
          <AlertTriangle size={20} />
          <span className="status-tile-label">Complaints</span>
          <span className="status-tile-value">
            {isLoading ? '—' : data?.recentComplaints?.length ? `${data.recentComplaints.length} recent` : 'None'}
          </span>
        </Link>
      </div>

      {/* ─── Today's Timetable ────────────────── */}
      {!isLoading && todayTimetable.length > 0 && (
        <section className="dashboard-section">
          <div className="section-header">
            <h2 className="section-title">Today's Classes</h2>
            <Link to="/student/timetable" className="section-link">View full <ChevronRight size={14} /></Link>
          </div>
          <div className="card">
            <div className="timetable-slots">
              {todayTimetable.map((slot, i) => (
                <div key={`${slot.subject}-${slot.startTime}-${i}`} className="timetable-slot">
                  <div className="slot-time">
                    <Clock size={14} />
                    <span>{slot.startTime}–{slot.endTime}</span>
                  </div>
                  <div className="slot-info">
                    <span className="slot-subject">{slot.subject}</span>
                    <span className="slot-meta">{slot.facultyName || slot.faculty || 'Faculty Assigned'} • {slot.room || 'TBD'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── Upcoming Exams ───────────────────── */}
      {!isLoading && upcomingExams.length > 0 && (
        <section className="dashboard-section">
          <div className="section-header">
            <h2 className="section-title">Upcoming Exams</h2>
            <Link to="/student/exams" className="section-link">View all <ChevronRight size={14} /></Link>
          </div>
          <div className="card">
            <div className="exam-list">
              {upcomingExams.slice(0, 4).map((exam) => (
                <div key={exam._id || `${exam.subject}-${exam.date}`} className="exam-row">
                  <div className="exam-info">
                    <span className="exam-subject">{exam.name || exam.subject}</span>
                    <span className="exam-meta">{exam.subjectCode || exam.code || '—'} • {exam.examType || exam.type || 'exam'}</span>
                  </div>
                  <div className="exam-date">
                    <span className="exam-date-day">{new Date(exam.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                    <span className="exam-time">{exam.startTime || '—'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── Announcements ────────────────────── */}
      {!isLoading && announcements.length > 0 && (
        <section className="dashboard-section">
          <div className="section-header">
            <h2 className="section-title">Announcements</h2>
            <Link to="/student/announcements" className="section-link">See all <ChevronRight size={14} /></Link>
          </div>
          <div className="announcement-list">
            {announcements.slice(0, 3).map((ann) => {
              const priority = String(ann.priority ?? 'normal').toLowerCase();
              const priorityClass = priority === 'urgent' ? 'badge badge-danger' : priority === 'high' ? 'badge badge-warning' : 'badge badge-neutral';
              const badgeText = priority === 'urgent' ? 'Urgent' : priority === 'high' ? 'Important' : priority === 'normal' ? 'Update' : 'Notice';

              return (
                <div key={ann._id || ann.title} className={`announcement-item priority-${priority}`}>
                  <div className="announcement-left">
                    <Megaphone size={16} />
                    <div>
                      <div className="announcement-title">{ann.title}</div>
                      <div className="announcement-meta">{ann.category} • {new Date(ann.publishedAt).toLocaleDateString('en-IN')}</div>
                    </div>
                  </div>
                  <span className={priorityClass}>{badgeText}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ─── Quick Links ──────────────────────── */}
      <section className="dashboard-section">
        <h2 className="section-title">Quick Access</h2>
        <div className="quick-links-grid">
          {[
            { to: '/student/hostel', icon: Building, label: 'Hostel' },
            { to: '/student/transport', icon: Bus, label: 'Bus Tracking' },
            { to: '/student/library', icon: BookOpen, label: 'Library' },
            { to: '/student/events', icon: Calendar, label: 'Events' },
          ].map(({ to, icon: Icon, label }) => (
            <Link key={to} to={to} className="quick-link-card">
              <Icon size={24} />
              <span>{label}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
