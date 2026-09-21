import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { timetableAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { Plus, Trash2, Save, Eye, Calendar, X } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DEPARTMENTS = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'AIDS', 'AIML'];
const SLOT_TYPES = ['lecture', 'lab', 'tutorial', 'free'];
const CURRENT_YEAR = new Date().getFullYear().toString();

const EMPTY_SLOT = {
  day: 'Monday', period: 1, subject: '', subjectCode: '',
  faculty: '', room: '', startTime: '09:00', endTime: '10:00', type: 'lecture'
};

const EMPTY_FORM = {
  department: '', year: '1', semester: '1', section: '',
  academicYear: `${CURRENT_YEAR}-${parseInt(CURRENT_YEAR) + 1}`,
  effectiveFrom: new Date().toISOString().split('T')[0],
  slots: [],
};

function SlotRow({ slot, index, onChange, onRemove }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '100px 60px 1fr 120px 80px 80px 80px 80px 36px',
      gap: 'var(--space-2)', alignItems: 'center', padding: 'var(--space-2) 0',
      borderBottom: '1px solid var(--line)'
    }}>
      <select className="select" style={{ padding: '6px 8px', fontSize: 'var(--text-xs)' }}
        value={slot.day} onChange={e => onChange(index, 'day', e.target.value)}>
        {DAYS.map(d => <option key={d} value={d}>{d.slice(0, 3)}</option>)}
      </select>
      <input className="input" type="number" min="1" max="10" style={{ padding: '6px 8px', fontSize: 'var(--text-xs)' }}
        value={slot.period} onChange={e => onChange(index, 'period', e.target.value)} placeholder="P#" />
      <input className="input" style={{ padding: '6px 8px', fontSize: 'var(--text-xs)' }}
        value={slot.subject} onChange={e => onChange(index, 'subject', e.target.value)} placeholder="Subject" />
      <input className="input" style={{ padding: '6px 8px', fontSize: 'var(--text-xs)' }}
        value={slot.faculty} onChange={e => onChange(index, 'faculty', e.target.value)} placeholder="Faculty" />
      <input className="input" style={{ padding: '6px 8px', fontSize: 'var(--text-xs)' }}
        value={slot.room} onChange={e => onChange(index, 'room', e.target.value)} placeholder="Room" />
      <input className="input" type="time" style={{ padding: '6px 4px', fontSize: 'var(--text-xs)' }}
        value={slot.startTime} onChange={e => onChange(index, 'startTime', e.target.value)} />
      <input className="input" type="time" style={{ padding: '6px 4px', fontSize: 'var(--text-xs)' }}
        value={slot.endTime} onChange={e => onChange(index, 'endTime', e.target.value)} />
      <select className="select" style={{ padding: '6px 4px', fontSize: 'var(--text-xs)' }}
        value={slot.type} onChange={e => onChange(index, 'type', e.target.value)}>
        {SLOT_TYPES.map(t => <option key={t} value={t} style={{ textTransform: 'capitalize' }}>{t}</option>)}
      </select>
      <button type="button" onClick={() => onRemove(index)} style={{ color: 'var(--danger)', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <X size={14} />
      </button>
    </div>
  );
}

function TimetableCard({ tt, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const slotsByDay = DAYS.reduce((acc, d) => {
    acc[d] = (tt.slots || []).filter(s => s.day === d).sort((a, b) => a.period - b.period);
    return acc;
  }, {});

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 'var(--space-3)' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: 'var(--space-4) var(--space-5)', flexWrap: 'wrap', gap: 'var(--space-2)'
      }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 'var(--text-base)', color: 'var(--ink)' }}>
            {tt.department} • Year {tt.year} • Sem {tt.semester} • Section {tt.section}
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)', marginTop: '2px' }}>
            {tt.academicYear} • {(tt.slots || []).length} slots
            {tt.effectiveFrom && ` • From ${new Date(tt.effectiveFrom).toLocaleDateString('en-IN')}`}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button onClick={() => setExpanded(e => !e)} style={{
            padding: '5px 12px', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)',
            fontWeight: 600, color: 'var(--brand)', border: '1px solid var(--info-border)',
            background: 'var(--info-bg)', display: 'flex', alignItems: 'center', gap: '4px'
          }}>
            <Eye size={13} /> {expanded ? 'Hide' : 'Preview'}
          </button>
          <button onClick={() => { if (window.confirm('Delete this timetable?')) onDelete(tt._id); }}
            style={{ color: 'var(--danger)', padding: '5px 8px' }}>
            <Trash2 size={15} />
          </button>
        </div>
      </div>
      {expanded && (
        <div style={{ borderTop: '1px solid var(--line)', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-xs)' }}>
            <thead>
              <tr style={{ background: 'var(--surface-inset)' }}>
                {DAYS.map(d => (
                  <th key={d} style={{ padding: 'var(--space-2) var(--space-3)', textAlign: 'left', fontWeight: 600, color: 'var(--ink-muted)', borderRight: '1px solid var(--line)', whiteSpace: 'nowrap' }}>
                    {d.slice(0, 3)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr style={{ verticalAlign: 'top' }}>
                {DAYS.map(d => (
                  <td key={d} style={{ padding: 'var(--space-2) var(--space-3)', borderRight: '1px solid var(--line)', minWidth: '120px' }}>
                    {slotsByDay[d].length === 0 ? (
                      <span style={{ color: 'var(--ink-faint)' }}>—</span>
                    ) : (
                      slotsByDay[d].map((s, i) => (
                        <div key={i} style={{
                          background: s.type === 'lab' ? 'var(--warning-bg)' : 'var(--brand-muted)',
                          borderRadius: 'var(--radius-sm)', padding: '4px 6px', marginBottom: '4px'
                        }}>
                          <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{s.subject}</div>
                          <div style={{ color: 'var(--ink-faint)' }}>{s.startTime}–{s.endTime}</div>
                          <div style={{ color: 'var(--ink-faint)' }}>{s.room}</div>
                        </div>
                      ))
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function AdminTimetable() {
  const qc = useQueryClient();
  const [view, setView] = useState('list'); // 'list' | 'create'
  const [filterDept, setFilterDept] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: timetables = [], isLoading } = useQuery({
    queryKey: ['admin-timetables', filterDept],
    queryFn: async () => {
      const params = filterDept ? { department: filterDept } : {};
      const { data } = await timetableAPI.all(params);
      return data.data || [];
    },
    staleTime: 30000,
  });

  const saveMut = useMutation({
    mutationFn: (payload) => timetableAPI.save(payload),
    onSuccess: () => {
      toast.success('Timetable saved successfully');
      qc.invalidateQueries({ queryKey: ['admin-timetables'] });
      setView('list');
      setForm(EMPTY_FORM);
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to save timetable'),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => timetableAPI.delete(id),
    onSuccess: () => { toast.success('Timetable deleted'); qc.invalidateQueries({ queryKey: ['admin-timetables'] }); },
    onError: () => toast.error('Failed to delete timetable'),
  });

  const updateSlot = (index, field, value) => {
    const slots = [...form.slots];
    slots[index] = { ...slots[index], [field]: field === 'period' ? parseInt(value) : value };
    setForm({ ...form, slots });
  };

  const addSlot = (day) => {
    setForm({ ...form, slots: [...form.slots, { ...EMPTY_SLOT, day }] });
  };

  const removeSlot = (index) => {
    setForm({ ...form, slots: form.slots.filter((_, i) => i !== index) });
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.department || !form.section) {
      toast.error('Department and section are required');
      return;
    }
    saveMut.mutate({
      ...form,
      year: parseInt(form.year),
      semester: parseInt(form.semester),
    });
  };

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <div>
            <h1 className="page-title">Timetable Management</h1>
            <p className="page-subtitle">Create and manage class timetables for each section</p>
          </div>
          {view === 'list' ? (
            <button onClick={() => setView('create')} style={{
              display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
              background: 'var(--brand)', color: '#fff', padding: 'var(--space-2) var(--space-5)',
              borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: 'var(--text-sm)'
            }}>
              <Plus size={16} /> Create Timetable
            </button>
          ) : (
            <button onClick={() => { setView('list'); setForm(EMPTY_FORM); }} style={{
              padding: 'var(--space-2) var(--space-5)', borderRadius: 'var(--radius-md)',
              border: '1px solid var(--line)', color: 'var(--ink-muted)', fontWeight: 600, fontSize: 'var(--text-sm)'
            }}>← Back to List</button>
          )}
        </div>
      </div>

      {/* List View */}
      {view === 'list' && (
        <>
          <div style={{ marginBottom: 'var(--space-5)' }}>
            <select className="select" style={{ maxWidth: '220px' }} value={filterDept} onChange={e => setFilterDept(e.target.value)}>
              <option value="">All Departments</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          {isLoading && [1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '72px', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-3)' }} />)}
          {!isLoading && timetables.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--ink-faint)' }}>
              <Calendar size={40} style={{ margin: '0 auto var(--space-3)', opacity: 0.4 }} />
              <p>No timetables created yet. Click "Create Timetable" to get started.</p>
            </div>
          )}
          {timetables.map(tt => (
            <TimetableCard key={tt._id} tt={tt} onDelete={id => deleteMut.mutate(id)} />
          ))}
        </>
      )}

      {/* Create View */}
      {view === 'create' && (
        <form onSubmit={handleSave}>
          {/* Class Info */}
          <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
            <h2 className="section-title">Class Details</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="label">Department *</label>
                <select className="select" required value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}>
                  <option value="">Select…</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="label">Year *</label>
                <select className="select" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })}>
                  {[1, 2, 3, 4].map(y => <option key={y} value={y}>Year {y}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="label">Semester *</label>
                <select className="select" value={form.semester} onChange={e => setForm({ ...form, semester: e.target.value })}>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Sem {s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="label">Section *</label>
                <input className="input" required placeholder="e.g. A" value={form.section} onChange={e => setForm({ ...form, section: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="label">Academic Year</label>
                <input className="input" value={form.academicYear} onChange={e => setForm({ ...form, academicYear: e.target.value })} placeholder="e.g. 2025-2026" />
              </div>
              <div className="form-group">
                <label className="label">Effective From</label>
                <input className="input" type="date" value={form.effectiveFrom} onChange={e => setForm({ ...form, effectiveFrom: e.target.value })} />
              </div>
            </div>
          </div>

          {/* Slot Editor */}
          <div className="card" style={{ marginBottom: 'var(--space-4)', overflowX: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
              <h2 className="section-title" style={{ margin: 0 }}>Schedule Slots ({form.slots.length})</h2>
              <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                {DAYS.map(d => (
                  <button key={d} type="button" onClick={() => addSlot(d)} style={{
                    padding: '4px 10px', borderRadius: 'var(--radius-pill)', fontSize: 'var(--text-xs)',
                    fontWeight: 600, background: 'var(--brand-muted)', color: 'var(--brand)',
                    border: '1px solid var(--info-border)'
                  }}>+ {d.slice(0, 3)}</button>
                ))}
              </div>
            </div>

            {form.slots.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--ink-faint)' }}>
                Click a day button above to add slots for that day
              </div>
            ) : (
              <>
                {/* Header row */}
                <div style={{
                  display: 'grid', gridTemplateColumns: '100px 60px 1fr 120px 80px 80px 80px 80px 36px',
                  gap: 'var(--space-2)', padding: 'var(--space-2) 0', borderBottom: '2px solid var(--line)',
                  fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--ink-muted)'
                }}>
                  <span>Day</span><span>Period</span><span>Subject</span><span>Faculty</span>
                  <span>Room</span><span>Start</span><span>End</span><span>Type</span><span />
                </div>
                {/* Slots grouped by day */}
                {DAYS.map(day => {
                  const daySlots = form.slots.map((s, i) => ({ ...s, _origIdx: i })).filter(s => s.day === day);
                  if (daySlots.length === 0) return null;
                  return (
                    <div key={day}>
                      <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--brand)', padding: 'var(--space-2) 0 0', marginTop: 'var(--space-2)' }}>
                        {day}
                      </div>
                      {daySlots.map(s => (
                        <SlotRow
                          key={s._origIdx} index={s._origIdx} slot={form.slots[s._origIdx]}
                          onChange={updateSlot} onRemove={removeSlot}
                        />
                      ))}
                    </div>
                  );
                })}
              </>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
            <button type="button" onClick={() => { setView('list'); setForm(EMPTY_FORM); }} style={{
              padding: 'var(--space-2) var(--space-6)', borderRadius: 'var(--radius-md)',
              border: '1px solid var(--line)', color: 'var(--ink-muted)', fontWeight: 600
            }}>Cancel</button>
            <button type="submit" disabled={saveMut.isPending} style={{
              display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
              padding: 'var(--space-2) var(--space-6)', borderRadius: 'var(--radius-md)',
              background: 'var(--brand)', color: '#fff', fontWeight: 600,
              opacity: saveMut.isPending ? 0.7 : 1
            }}>
              <Save size={16} />
              {saveMut.isPending ? 'Saving…' : 'Save Timetable'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
