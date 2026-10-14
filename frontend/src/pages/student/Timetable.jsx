import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { timetableAPI } from '../../services/api';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const today = DAYS[new Date().getDay() - 1] || DAYS[0];

export default function StudentTimetable() {
  const [selectedDay, setSelectedDay] = useState(today);

  const { data, isLoading } = useQuery({
    queryKey: ['timetable'],
    queryFn: async () => { const { data } = await timetableAPI.my(); return data.data; },
  });

  const slots = data?.slots?.filter(s => s.day === selectedDay) || [];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Class Timetable</h1>
        <p className="page-subtitle">Semester {data?.semester || '—'} • Section {data?.section || '—'}</p>
      </div>

      {/* Day tabs */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
        {DAYS.map(d => (
          <button key={d} onClick={() => setSelectedDay(d)} style={{
            padding: '6px 16px', borderRadius: '999px', fontWeight: 600, fontSize: 'var(--text-sm)',
            whiteSpace: 'nowrap', cursor: 'pointer',
            background: selectedDay === d ? 'var(--brand)' : 'var(--surface-raised)',
            color: selectedDay === d ? '#fff' : 'var(--ink-muted)',
            border: selectedDay === d ? '1px solid var(--brand)' : '1px solid var(--line)',
          }}>{d}</button>
        ))}
      </div>

      {isLoading && [...Array(4)].map((_, i) => (
        <div key={i} className="skeleton" style={{ height: '64px', borderRadius: '12px', marginBottom: '8px' }} />
      ))}

      {!isLoading && slots.length === 0 && (
        <div className="card" style={{ textAlign: 'center', color: 'var(--ink-muted)', padding: '48px 24px' }}>
          No classes scheduled for {selectedDay}.
        </div>
      )}

      {slots.map((slot, i) => (
        <div key={i} className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ flex: '0 0 90px', textAlign: 'center', background: 'var(--brand-pale)', padding: '8px 12px', borderRadius: '8px' }}>
            <div style={{ fontWeight: 700, color: 'var(--brand)', fontSize: 'var(--text-sm)' }}>{slot.startTime}</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)' }}>{slot.endTime}</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 'var(--text-base)', color: 'var(--ink)' }}>
              {slot.subject} {slot.subjectCode && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)', fontWeight: 400 }}>({slot.subjectCode})</span>}
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-muted)', marginTop: '4px' }}>
              👤 {slot.facultyName || (typeof slot.faculty === 'string' ? slot.faculty : 'Faculty Assigned')} • 📍 Room {slot.room || 'TBD'}
            </div>
          </div>
          {slot.type === 'lab' && <span className="badge badge-info">Lab</span>}
        </div>
      ))}
    </div>
  );
}
