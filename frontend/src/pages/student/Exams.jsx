import { useQuery } from '@tanstack/react-query';
import { examsAPI } from '../../services/api';

function ExamTypeBadge({ type }) {
  const map = { internal: 'badge-info', model: 'badge-warning', semester: 'badge-danger', practical: 'badge-success', other: 'badge-neutral' };
  return <span className={`badge ${map[type] || 'badge-neutral'}`}>{type}</span>;
}

export default function StudentExams() {
  const { data: exams = [], isLoading } = useQuery({
    queryKey: ['upcoming-exams'],
    queryFn: async () => { const { data } = await examsAPI.upcoming(); return data.data || []; },
  });

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Upcoming Exams</h1>
        <p className="page-subtitle">Exam schedule for your current semester</p>
      </div>

      {isLoading && [...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: '72px', borderRadius: '12px', marginBottom: '8px' }} />)}
      {exams.length === 0 && !isLoading && <div className="card" style={{ textAlign: 'center', color: 'var(--ink-muted)', padding: '32px' }}>No upcoming exams scheduled.</div>}

      {exams.map((exam) => {
        const daysLeft = Math.ceil((new Date(exam.date) - new Date()) / (1000 * 60 * 60 * 24));
        return (
          <div key={exam._id} className="card" style={{ marginBottom: '8px', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ flex: '0 0 56px', textAlign: 'center', background: 'var(--brand-muted)', borderRadius: '8px', padding: '8px' }}>
              <div style={{ fontWeight: 700, color: 'var(--brand)' }}>{new Date(exam.date).toLocaleDateString('en-IN', { day: 'numeric' })}</div>
              <div style={{ fontSize: '10px', color: 'var(--brand)' }}>{new Date(exam.date).toLocaleDateString('en-IN', { month: 'short' })}</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{exam.subject}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)' }}>{exam.subjectCode} • {exam.startTime || '—'} • {exam.venue || '—'}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
              <ExamTypeBadge type={exam.examType} />
              <span style={{ fontSize: '10px', color: daysLeft <= 3 ? 'var(--danger)' : 'var(--ink-faint)', fontWeight: 600 }}>
                {daysLeft === 0 ? 'Today!' : daysLeft === 1 ? 'Tomorrow' : `${daysLeft} days`}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
