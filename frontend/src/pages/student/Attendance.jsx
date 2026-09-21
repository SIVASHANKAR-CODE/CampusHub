import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { attendanceAPI } from '../../services/api';
import { TrendingDown, CheckCircle, Clock, Calendar, XCircle, AlertCircle } from 'lucide-react';

export default function StudentAttendance() {
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [activeTab, setActiveTab] = useState('periods'); // 'periods' | 'subjects'

  // Fetch overall and subject-wise attendance summary
  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ['attendance'],
    queryFn: async () => {
      const { data } = await attendanceAPI.my();
      return data.data;
    },
  });

  // Fetch period-by-period daily log for the selected date
  const { data: dailyData, isLoading: dailyLoading } = useQuery({
    queryKey: ['attendance-daily', selectedDate],
    queryFn: async () => {
      const { data } = await attendanceAPI.daily({ date: selectedDate });
      return data.data;
    },
  });

  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: 'var(--space-5)' }}>
        <h1 className="page-title">My Attendance</h1>
        <p className="page-subtitle">Track your subject percentages and period-by-period daily attendance</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-5)', borderBottom: '1px solid var(--line)', paddingBottom: 'var(--space-2)' }}>
        <button
          type="button"
          onClick={() => setActiveTab('periods')}
          style={{
            padding: '8px 16px',
            borderRadius: 'var(--radius-md)',
            fontWeight: 600,
            fontSize: 'var(--text-sm)',
            cursor: 'pointer',
            border: 'none',
            background: activeTab === 'periods' ? 'var(--brand)' : 'transparent',
            color: activeTab === 'periods' ? '#fff' : 'var(--ink-muted)',
            transition: 'all 0.15s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Clock size={16} />
          Period-Wise Daily Log
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('subjects')}
          style={{
            padding: '8px 16px',
            borderRadius: 'var(--radius-md)',
            fontWeight: 600,
            fontSize: 'var(--text-sm)',
            cursor: 'pointer',
            border: 'none',
            background: activeTab === 'subjects' ? 'var(--brand)' : 'transparent',
            color: activeTab === 'subjects' ? '#fff' : 'var(--ink-muted)',
            transition: 'all 0.15s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <CheckCircle size={16} />
          Subject Summaries
        </button>
      </div>

      {/* Tab 1: Period-by-Period Daily View */}
      {activeTab === 'periods' && (
        <div>
          {/* Date Selector Header */}
          <div className="card" style={{ marginBottom: 'var(--space-5)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Calendar size={18} className="text-brand" />
              <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--ink)' }}>Select Date:</span>
            </div>
            <input
              type="date"
              className="input"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ width: 'auto', minWidth: '180px' }}
            />
          </div>

          {dailyLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[...Array(8)].map((_, i) => (
                <div key={i} className="skeleton" style={{ height: '64px', borderRadius: '12px' }} />
              ))}
            </div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{
                padding: 'var(--space-4) var(--space-6)',
                borderBottom: '1px solid var(--line)',
                background: 'var(--surface-raised)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--ink)' }}>
                  Periods for {new Date(selectedDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)' }}>
                  Standard 8-Period Day
                </div>
              </div>

              <div>
                {dailyData?.periods?.map((p, idx) => {
                  const isPresent = p.status === 'present';
                  const isAbsent = p.status === 'absent';
                  const isOD = p.status === 'od';
                  const isLeave = p.status === 'leave';
                  const isNotMarked = p.status === 'not_marked' || !p.isMarked;

                  return (
                    <div
                      key={p.period}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: 'var(--space-4) var(--space-6)',
                        borderBottom: idx < dailyData.periods.length - 1 ? '1px solid var(--line)' : 'none',
                        background: isAbsent ? 'rgba(239, 68, 68, 0.03)' : undefined,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', minWidth: 0, flex: 1 }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: 'var(--radius-md)',
                          background: isPresent ? 'rgba(34, 197, 94, 0.12)' : isAbsent ? 'rgba(239, 68, 68, 0.12)' : 'var(--surface-inset)',
                          color: isPresent ? 'var(--success)' : isAbsent ? 'var(--danger)' : 'var(--ink-muted)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: 'var(--text-xs)',
                          flexShrink: 0,
                        }}>
                          <span>P{p.period}</span>
                        </div>

                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--ink)' }}>
                            {p.subject}
                          </div>
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                            <Clock size={12} />
                            <span>{p.startTime} – {p.endTime}</span>
                            {p.subjectCode && <span>• {p.subjectCode}</span>}
                          </div>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div>
                        {isPresent && (
                          <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: 'var(--text-xs)', padding: '4px 10px' }}>
                            <CheckCircle size={13} /> Present
                          </span>
                        )}
                        {isAbsent && (
                          <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: 'var(--text-xs)', padding: '4px 10px' }}>
                            <XCircle size={13} /> Absent
                          </span>
                        )}
                        {isOD && (
                          <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: 'var(--text-xs)', padding: '4px 10px' }}>
                            <CheckCircle size={13} /> On Duty (OD)
                          </span>
                        )}
                        {isLeave && (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: 'var(--text-xs)', padding: '4px 10px',
                            borderRadius: '999px', background: 'rgba(168, 85, 247, 0.12)', color: '#a855f7', fontWeight: 600
                          }}>
                            Leave
                          </span>
                        )}
                        {isNotMarked && (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: 'var(--text-xs)', padding: '4px 10px',
                            borderRadius: '999px', background: 'var(--surface-inset)', color: 'var(--ink-faint)', fontWeight: 500
                          }}>
                            Not Marked Yet
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Subject Summaries */}
      {activeTab === 'subjects' && (
        <div>
          {summaryLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[...Array(6)].map((_, i) => (
                <div key={i} className="skeleton" style={{ height: '72px', borderRadius: '12px' }} />
              ))}
            </div>
          )}

          {summaryData && (
            <>
              {/* Overall */}
              <div className="card" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, color: summaryData.overall >= 80 ? 'var(--success)' : 'var(--danger)' }}>
                    {summaryData.overall}%
                  </div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-muted)' }}>
                    {summaryData.totalPresent} / {summaryData.totalClasses} classes attended
                  </div>
                </div>
                <div style={{ marginLeft: 'auto' }}>
                  {summaryData.overall >= 80
                    ? <span className="badge badge-success"><CheckCircle size={12} /> On track</span>
                    : <span className="badge badge-danger"><TrendingDown size={12} /> Below threshold</span>
                  }
                </div>
              </div>

              {/* Per Subject */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {summaryData.subjects?.map((s) => (
                  <div key={s.subject} className="card" style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{s.subject}</div>
                        {s.subjectCode && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)' }}>{s.subjectCode}</div>}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, color: s.percentage < 75 ? 'var(--danger)' : s.percentage < 80 ? 'var(--warning)' : 'var(--success)' }}>
                          {s.percentage}%
                        </div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)' }}>{s.present}/{s.total}</div>
                      </div>
                    </div>
                    <div style={{ height: '6px', background: 'var(--surface-inset)', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', width: `${s.percentage}%`, borderRadius: '999px', transition: 'width 0.6s ease',
                        background: s.percentage < 75 ? 'var(--danger)' : s.percentage < 80 ? 'var(--warning)' : 'var(--success)'
                      }} />
                    </div>
                    {s.belowThreshold && (
                      <div style={{ marginTop: '8px', fontSize: 'var(--text-xs)', color: 'var(--warning)' }}>
                        Need {s.classesNeededFor80} more classes to reach 80%
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
