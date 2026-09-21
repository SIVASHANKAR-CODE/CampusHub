import { useQuery } from '@tanstack/react-query';
import { examsAPI } from '../../services/api';

export default function StudentResults() {
  const { data: results = [], isLoading } = useQuery({
    queryKey: ['results'],
    queryFn: async () => { const { data } = await examsAPI.results(); return data.data || []; },
  });

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Exam Results</h1>
        <p className="page-subtitle">Published results for your examinations</p>
      </div>

      {isLoading && [...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: '100px', borderRadius: '12px', marginBottom: '8px' }} />)}
      {results.length === 0 && !isLoading && (
        <div className="card" style={{ textAlign: 'center', color: 'var(--ink-muted)', padding: '48px 24px' }}>
          No published results available yet.
        </div>
      )}

      {results.map((r) => {
        const marks = r.marksObtained ?? r.totalObtained ?? 0;
        const max = r.maxMarks ?? r.totalMaxMark ?? 100;
        const grade = r.grade || r.overallGrade || '—';
        const isPass = (r.result === 'pass') || (!r.result && grade !== 'F' && grade !== 'RA');
        const examName = r.examId?.examType ? `${r.examId.examType.toUpperCase()} Exam` : (r.examType || 'Internal Assessment');

        return (
          <div key={r._id} className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 'var(--text-lg)', color: 'var(--ink)' }}>
                  {r.subject} {r.subjectCode && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)', fontWeight: 400 }}>({r.subjectCode})</span>}
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-muted)', marginTop: '4px' }}>
                  Semester {r.semester} • {r.academicYear || '2025-2026'} • {examName}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: isPass ? 'var(--success)' : 'var(--danger)' }}>
                    {marks} <span style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-faint)', fontWeight: 400 }}>/ {max}</span>
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-muted)' }}>
                    Grade: <strong style={{ color: 'var(--ink)' }}>{grade}</strong>
                  </div>
                </div>
                <span className={`badge ${isPass ? 'badge-success' : 'badge-danger'}`}>
                  {r.result ? r.result.toUpperCase() : isPass ? 'PASS' : 'FAIL'}
                </span>
              </div>
            </div>

            {r.marks?.map((m) => (
              <div key={m.component} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)', padding: '6px 0', borderBottom: '1px solid var(--line)' }}>
                <span style={{ textTransform: 'capitalize' }}>{m.component}</span>
                <span style={{ fontWeight: 600 }}>{m.obtained} / {m.maxMark}</span>
              </div>
            ))}
            {r.remarks && <div style={{ marginTop: '12px', fontSize: 'var(--text-xs)', color: 'var(--ink-faint)', background: 'var(--surface-inset)', padding: '8px 12px', borderRadius: '6px' }}>Remarks: {r.remarks}</div>}
          </div>
        );
      })}
    </div>
  );
}
