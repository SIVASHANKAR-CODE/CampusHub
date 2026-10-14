import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { examsAPI, studentAPI } from '../../services/api';
import toast from 'react-hot-toast';
import {
  Plus, ClipboardList, CheckCircle, Trash2, BookOpen,
  ChevronDown, ChevronUp, Calendar, Clock, MapPin, X
} from 'lucide-react';

const EXAM_TYPES = ['internal', 'model', 'semester', 'practical', 'other'];
const DEPARTMENTS = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'AIDS', 'AIML'];
const EMPTY_EXAM = {
  subject: '', subjectCode: '', examType: 'internal',
  department: '', year: 1, semester: 1, section: '',
  date: '', startTime: '', endTime: '', venue: '', maxMark: 100,
};

function ExamTypeBadge({ type }) {
  const map = {
    internal: 'badge-info', model: 'badge-warning',
    semester: 'badge-danger', practical: 'badge-success', other: 'badge-neutral'
  };
  return <span className={`badge ${map[type] || 'badge-neutral'}`} style={{ textTransform: 'capitalize' }}>{type}</span>;
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 200, padding: 'var(--space-4)'
    }}>
      <div style={{
        background: 'var(--surface-raised)', borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-modal)', width: '100%', maxWidth: '560px',
        maxHeight: '90vh', overflowY: 'auto'
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: 'var(--space-5) var(--space-6)', borderBottom: '1px solid var(--line)'
        }}>
          <h2 style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--ink)' }}>{title}</h2>
          <button onClick={onClose} style={{ color: 'var(--ink-faint)', padding: '4px' }}>
            <X size={20} />
          </button>
        </div>
        <div style={{ padding: 'var(--space-6)' }}>{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}

export default function AdminExams() {
  const qc = useQueryClient();
  const [tab, setTab] = useState('exams'); // 'exams' | 'results'
  const [filters, setFilters] = useState({ department: '', year: '', semester: '', examType: '' });
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(EMPTY_EXAM);
  const [expandedExam, setExpandedExam] = useState(null);
  const [showResultForm, setShowResultForm] = useState(null); // exam object
  const [resultStudentSearch, setResultStudentSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [resultForm, setResultForm] = useState({ semester: 1, marks: [{ component: 'internal', obtained: 0, maxMark: 50 }], totalObtained: 0, totalMaxMark: 100, overallGrade: '' });

  // Fetch exams
  const { data: examsData, isLoading: examsLoading } = useQuery({
    queryKey: ['admin-exams', filters],
    queryFn: async () => {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
      const { data } = await examsAPI.adminAll(params);
      return data.data;
    },
    staleTime: 30000,
  });

  // Fetch results
  const { data: resultsData, isLoading: resultsLoading } = useQuery({
    queryKey: ['admin-results'],
    queryFn: async () => {
      const { data } = await examsAPI.adminResultsAll({ limit: 100 });
      return data.data;
    },
    enabled: tab === 'results',
    staleTime: 30000,
  });

  // Student search for result entry
  const { data: studentSearchData } = useQuery({
    queryKey: ['student-search', resultStudentSearch],
    queryFn: async () => {
      if (resultStudentSearch.length < 2) return [];
      const { data } = await studentAPI.search(resultStudentSearch);
      return data.data || [];
    },
    enabled: resultStudentSearch.length >= 2,
    staleTime: 10000,
  });

  const createMut = useMutation({
    mutationFn: (data) => examsAPI.create(data),
    onSuccess: () => {
      toast.success('Exam created successfully');
      qc.invalidateQueries({ queryKey: ['admin-exams'] });
      setShowCreate(false);
      setForm(EMPTY_EXAM);
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to create exam'),
  });

  const publishMut = useMutation({
    mutationFn: (id) => examsAPI.publish(id),
    onSuccess: () => { toast.success('Exam published'); qc.invalidateQueries({ queryKey: ['admin-exams'] }); },
    onError: () => toast.error('Failed to publish exam'),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => examsAPI.delete(id),
    onSuccess: () => { toast.success('Exam deleted'); qc.invalidateQueries({ queryKey: ['admin-exams'] }); },
    onError: () => toast.error('Failed to delete exam'),
  });

  const resultMut = useMutation({
    mutationFn: (data) => examsAPI.postResult(data),
    onSuccess: () => {
      toast.success('Result added');
      qc.invalidateQueries({ queryKey: ['admin-results'] });
      setShowResultForm(null);
      setSelectedStudent(null);
      setResultStudentSearch('');
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to add result'),
  });

  const publishResultMut = useMutation({
    mutationFn: (id) => examsAPI.publishResult(id),
    onSuccess: () => { toast.success('Result published'); qc.invalidateQueries({ queryKey: ['admin-results'] }); },
  });

  const handleCreate = (e) => {
    e.preventDefault();
    createMut.mutate({ ...form, year: parseInt(form.year), semester: parseInt(form.semester), maxMark: parseInt(form.maxMark) });
  };

  const handleAddResult = (e) => {
    e.preventDefault();
    if (!selectedStudent || !showResultForm) return;
    resultMut.mutate({
      examId: showResultForm._id,
      studentId: selectedStudent._id,
      subject: showResultForm.subject,
      subjectCode: showResultForm.subjectCode,
      examType: showResultForm.examType,
      semester: resultForm.semester,
      marks: resultForm.marks.map(m => ({ ...m, obtained: Number(m.obtained), maxMark: Number(m.maxMark) })),
      totalObtained: resultForm.marks.reduce((s, m) => s + Number(m.obtained), 0),
      totalMaxMark: resultForm.marks.reduce((s, m) => s + Number(m.maxMark), 0),
      overallGrade: resultForm.overallGrade,
      isPublished: false,
    });
  };

  const exams = examsData?.exams || [];
  const results = resultsData?.results || [];

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <div>
            <h1 className="page-title">Exams & Results</h1>
            <p className="page-subtitle">Schedule exams and manage student results</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
              background: 'var(--brand)', color: '#fff', padding: 'var(--space-2) var(--space-5)',
              borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: 'var(--text-sm)'
            }}
          >
            <Plus size={16} /> Schedule Exam
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-1)', marginBottom: 'var(--space-5)', borderBottom: '1px solid var(--line)', paddingBottom: 'var(--space-1)' }}>
        {[{ id: 'exams', label: 'Exam Schedule', icon: ClipboardList }, { id: 'results', label: 'Results', icon: BookOpen }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
            padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
            fontWeight: 600, fontSize: 'var(--text-sm)',
            background: tab === t.id ? 'var(--surface-raised)' : 'transparent',
            color: tab === t.id ? 'var(--brand)' : 'var(--ink-muted)',
            borderBottom: tab === t.id ? '2px solid var(--brand)' : '2px solid transparent',
          }}>
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
        <select className="select" value={filters.department} onChange={e => setFilters({ ...filters, department: e.target.value })}>
          <option value="">All Departments</option>
          {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select className="select" value={filters.year} onChange={e => setFilters({ ...filters, year: e.target.value })}>
          <option value="">All Years</option>
          {[1, 2, 3, 4].map(y => <option key={y} value={y}>Year {y}</option>)}
        </select>
        <select className="select" value={filters.semester} onChange={e => setFilters({ ...filters, semester: e.target.value })}>
          <option value="">All Semesters</option>
          {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Sem {s}</option>)}
        </select>
        {tab === 'exams' && (
          <select className="select" value={filters.examType} onChange={e => setFilters({ ...filters, examType: e.target.value })}>
            <option value="">All Types</option>
            {EXAM_TYPES.map(t => <option key={t} value={t} style={{ textTransform: 'capitalize' }}>{t}</option>)}
          </select>
        )}
      </div>

      {/* Exams Tab */}
      {tab === 'exams' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {examsLoading && [1, 2, 3, 4].map(i => (
            <div key={i} className="skeleton" style={{ height: '80px', borderRadius: 'var(--radius-lg)' }} />
          ))}
          {!examsLoading && exams.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--ink-faint)' }}>
              <ClipboardList size={40} style={{ margin: '0 auto var(--space-3)', opacity: 0.4 }} />
              <p>No exams scheduled yet. Click "Schedule Exam" to add one.</p>
            </div>
          )}
          {exams.map(exam => {
            const isExpanded = expandedExam === exam._id;
            const daysLeft = Math.ceil((new Date(exam.date) - new Date()) / 86400000);
            return (
              <div key={exam._id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 'var(--space-4)',
                  padding: 'var(--space-4) var(--space-5)', flexWrap: 'wrap'
                }}>
                  <div style={{
                    flexShrink: 0, textAlign: 'center',
                    background: 'var(--brand-muted)', borderRadius: 'var(--radius-md)',
                    padding: 'var(--space-2) var(--space-3)', minWidth: '56px'
                  }}>
                    <div style={{ fontWeight: 700, color: 'var(--brand)', fontSize: 'var(--text-lg)' }}>
                      {new Date(exam.date).toLocaleDateString('en-IN', { day: 'numeric' })}
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--brand)' }}>
                      {new Date(exam.date).toLocaleDateString('en-IN', { month: 'short' })}
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--ink)' }}>{exam.subject}</span>
                      {exam.subjectCode && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)' }}>({exam.subjectCode})</span>}
                      <ExamTypeBadge type={exam.examType} />
                      {exam.isPublished
                        ? <span className="badge badge-success"><CheckCircle size={11} /> Published</span>
                        : <span className="badge badge-warning">Draft</span>}
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-muted)' }}>
                      {exam.department} • Year {exam.year} • Sem {exam.semester}
                      {exam.section && ` • Section ${exam.section}`}
                      {exam.startTime && ` • ${exam.startTime}`}
                      {exam.venue && ` • ${exam.venue}`}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexShrink: 0 }}>
                    {daysLeft >= 0 && (
                      <span style={{ fontSize: 'var(--text-xs)', color: daysLeft <= 3 ? 'var(--danger)' : 'var(--ink-faint)', fontWeight: 600 }}>
                        {daysLeft === 0 ? 'Today' : daysLeft === 1 ? 'Tomorrow' : `${daysLeft}d left`}
                      </span>
                    )}
                    {!exam.isPublished && (
                      <button onClick={() => publishMut.mutate(exam._id)} style={{
                        padding: '5px 12px', borderRadius: 'var(--radius-md)',
                        background: 'var(--success)', color: '#fff', fontWeight: 600, fontSize: 'var(--text-xs)'
                      }}>Publish</button>
                    )}
                    <button onClick={() => setShowResultForm(exam)} style={{
                      padding: '5px 12px', borderRadius: 'var(--radius-md)',
                      background: 'var(--info-bg)', color: 'var(--info)', fontWeight: 600, fontSize: 'var(--text-xs)',
                      border: '1px solid var(--info-border)'
                    }}>+ Result</button>
                    <button onClick={() => setExpandedExam(isExpanded ? null : exam._id)} style={{ color: 'var(--ink-faint)', padding: '4px' }}>
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    <button onClick={() => {
                      if (window.confirm('Delete this exam?')) deleteMut.mutate(exam._id);
                    }} style={{ color: 'var(--danger)', padding: '4px' }}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                {isExpanded && (
                  <div style={{ borderTop: '1px solid var(--line)', padding: 'var(--space-4) var(--space-5)', background: 'var(--surface-inset)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 'var(--space-4)' }}>
                      {[
                        { label: 'Date', value: new Date(exam.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }), icon: Calendar },
                        { label: 'Time', value: exam.startTime ? `${exam.startTime} – ${exam.endTime || ''}` : 'Not set', icon: Clock },
                        { label: 'Venue', value: exam.venue || 'Not set', icon: MapPin },
                        { label: 'Max Marks', value: exam.maxMark || '—', icon: BookOpen },
                      ].map(({ label, value, icon: Icon }) => (
                        <div key={label}>
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Icon size={11} /> {label}
                          </div>
                          <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--ink)' }}>{value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Results Tab */}
      {tab === 'results' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {resultsLoading && [1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '90px', borderRadius: 'var(--radius-lg)' }} />)}
          {!resultsLoading && results.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--ink-faint)' }}>
              <BookOpen size={40} style={{ margin: '0 auto var(--space-3)', opacity: 0.4 }} />
              <p>No results entered yet. Select an exam and click "+ Result" to add.</p>
            </div>
          )}
          {results.map(result => (
            <div key={result._id} className="card" style={{ padding: 'var(--space-5)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--ink)' }}>
                      {result.studentId?.name || '—'}
                    </span>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)' }}>
                      {result.studentId?.registrationNumber}
                    </span>
                    {result.isPublished
                      ? <span className="badge badge-success">Published</span>
                      : <span className="badge badge-warning">Draft</span>}
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-muted)' }}>
                    {result.subject} • Sem {result.semester} • <span style={{ textTransform: 'capitalize' }}>{result.examType}</span>
                    {result.studentId?.department && ` • ${result.studentId.department}`}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexShrink: 0 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: 'var(--text-xl)', color: result.overallGrade === 'F' ? 'var(--danger)' : 'var(--success)' }}>
                      {result.totalObtained}/{result.totalMaxMark}
                    </div>
                    {result.overallGrade && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)' }}>Grade: {result.overallGrade}</div>}
                  </div>
                  {!result.isPublished && (
                    <button onClick={() => publishResultMut.mutate(result._id)} style={{
                      padding: '5px 12px', borderRadius: 'var(--radius-md)',
                      background: 'var(--success)', color: '#fff', fontWeight: 600, fontSize: 'var(--text-xs)'
                    }}>Publish</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Exam Modal */}
      {showCreate && (
        <Modal title="Schedule New Exam" onClose={() => { setShowCreate(false); setForm(EMPTY_EXAM); }}>
          <form onSubmit={handleCreate}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <Field label="Subject Name">
                <input className="input" required value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="e.g. Data Structures" />
              </Field>
              <Field label="Subject Code">
                <input className="input" value={form.subjectCode} onChange={e => setForm({ ...form, subjectCode: e.target.value })} placeholder="e.g. CS3301" />
              </Field>
              <Field label="Exam Type">
                <select className="select" value={form.examType} onChange={e => setForm({ ...form, examType: e.target.value })}>
                  {EXAM_TYPES.map(t => <option key={t} value={t} style={{ textTransform: 'capitalize' }}>{t}</option>)}
                </select>
              </Field>
              <Field label="Department">
                <select className="select" required value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}>
                  <option value="">Select...</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </Field>
              <Field label="Year">
                <select className="select" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })}>
                  {[1, 2, 3, 4].map(y => <option key={y} value={y}>Year {y}</option>)}
                </select>
              </Field>
              <Field label="Semester">
                <select className="select" value={form.semester} onChange={e => setForm({ ...form, semester: e.target.value })}>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                </select>
              </Field>
              <Field label="Section (optional)">
                <input className="input" value={form.section} onChange={e => setForm({ ...form, section: e.target.value })} placeholder="e.g. A" />
              </Field>
              <Field label="Max Marks">
                <input className="input" type="number" min="1" value={form.maxMark} onChange={e => setForm({ ...form, maxMark: e.target.value })} />
              </Field>
              <Field label="Date">
                <input className="input" type="date" required value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
              </Field>
              <Field label="Venue">
                <input className="input" value={form.venue} onChange={e => setForm({ ...form, venue: e.target.value })} placeholder="e.g. Main Hall" />
              </Field>
              <Field label="Start Time">
                <input className="input" type="time" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} />
              </Field>
              <Field label="End Time">
                <input className="input" type="time" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} />
              </Field>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
              <button type="button" onClick={() => { setShowCreate(false); setForm(EMPTY_EXAM); }} style={{
                padding: 'var(--space-2) var(--space-5)', borderRadius: 'var(--radius-md)',
                border: '1px solid var(--line)', color: 'var(--ink-muted)', fontWeight: 600
              }}>Cancel</button>
              <button type="submit" disabled={createMut.isPending} style={{
                padding: 'var(--space-2) var(--space-5)', borderRadius: 'var(--radius-md)',
                background: 'var(--brand)', color: '#fff', fontWeight: 600,
                opacity: createMut.isPending ? 0.7 : 1
              }}>{createMut.isPending ? 'Creating…' : 'Create Exam'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add Result Modal */}
      {showResultForm && (
        <Modal title={`Add Result — ${showResultForm.subject}`} onClose={() => { setShowResultForm(null); setSelectedStudent(null); setResultStudentSearch(''); }}>
          <form onSubmit={handleAddResult}>
            {/* Student search */}
            <Field label="Search Student">
              <input
                className="input" value={resultStudentSearch}
                onChange={e => { setResultStudentSearch(e.target.value); setSelectedStudent(null); }}
                placeholder="Type name or reg. number…"
              />
            </Field>
            {resultStudentSearch.length >= 2 && !selectedStudent && (
              <div style={{ border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', marginTop: '-var(--space-3)', marginBottom: 'var(--space-4)', overflow: 'hidden' }}>
                {(studentSearchData || []).length === 0 ? (
                  <div style={{ padding: 'var(--space-4)', color: 'var(--ink-faint)', fontSize: 'var(--text-sm)', textAlign: 'center' }}>No students found</div>
                ) : (
                  studentSearchData.map(s => (
                    <button key={s._id} type="button" onClick={() => { setSelectedStudent(s); setResultStudentSearch(s.name); }} style={{
                      display: 'block', width: '100%', padding: 'var(--space-3) var(--space-4)',
                      textAlign: 'left', borderBottom: '1px solid var(--line)',
                      fontSize: 'var(--text-sm)', background: 'var(--surface-raised)'
                    }}>
                      <span style={{ fontWeight: 600 }}>{s.name}</span>
                      <span style={{ color: 'var(--ink-faint)', marginLeft: '8px' }}>{s.registrationNumber}</span>
                      <span style={{ color: 'var(--ink-faint)', marginLeft: '8px', fontSize: 'var(--text-xs)' }}>{s.department} • Yr {s.year}</span>
                    </button>
                  ))
                )}
              </div>
            )}
            {selectedStudent && (
              <div style={{ background: 'var(--success-bg)', border: '1px solid var(--success-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)', marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--success)' }}>
                ✓ {selectedStudent.name} — {selectedStudent.registrationNumber}
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <Field label="Semester">
                <select className="select" value={resultForm.semester} onChange={e => setResultForm({ ...resultForm, semester: e.target.value })}>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                </select>
              </Field>
              <Field label="Overall Grade">
                <input className="input" value={resultForm.overallGrade} onChange={e => setResultForm({ ...resultForm, overallGrade: e.target.value })} placeholder="e.g. A+, B, F" />
              </Field>
            </div>
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <label className="label">Marks Breakdown</label>
              {resultForm.marks.map((m, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 'var(--space-2)', marginBottom: 'var(--space-2)', alignItems: 'center' }}>
                  <input className="input" placeholder="Component" value={m.component} onChange={e => {
                    const marks = [...resultForm.marks]; marks[i] = { ...marks[i], component: e.target.value };
                    setResultForm({ ...resultForm, marks });
                  }} />
                  <input className="input" type="number" placeholder="Obtained" value={m.obtained} onChange={e => {
                    const marks = [...resultForm.marks]; marks[i] = { ...marks[i], obtained: e.target.value };
                    setResultForm({ ...resultForm, marks });
                  }} />
                  <input className="input" type="number" placeholder="Max" value={m.maxMark} onChange={e => {
                    const marks = [...resultForm.marks]; marks[i] = { ...marks[i], maxMark: e.target.value };
                    setResultForm({ ...resultForm, marks });
                  }} />
                  <button type="button" onClick={() => setResultForm({ ...resultForm, marks: resultForm.marks.filter((_, j) => j !== i) })} style={{ color: 'var(--danger)', padding: '4px' }}>
                    <X size={15} />
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => setResultForm({ ...resultForm, marks: [...resultForm.marks, { component: '', obtained: 0, maxMark: 50 }] })} style={{
                fontSize: 'var(--text-xs)', color: 'var(--brand)', fontWeight: 600, marginTop: 'var(--space-1)'
              }}>+ Add Component</button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
              <button type="button" onClick={() => { setShowResultForm(null); setSelectedStudent(null); setResultStudentSearch(''); }} style={{
                padding: 'var(--space-2) var(--space-5)', borderRadius: 'var(--radius-md)',
                border: '1px solid var(--line)', color: 'var(--ink-muted)', fontWeight: 600
              }}>Cancel</button>
              <button type="submit" disabled={resultMut.isPending || !selectedStudent} style={{
                padding: 'var(--space-2) var(--space-5)', borderRadius: 'var(--radius-md)',
                background: 'var(--brand)', color: '#fff', fontWeight: 600,
                opacity: (resultMut.isPending || !selectedStudent) ? 0.6 : 1
              }}>{resultMut.isPending ? 'Saving…' : 'Save Result'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
