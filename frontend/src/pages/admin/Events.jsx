import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsAPI } from '../../services/api';
import { Calendar, Plus, Eye, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORIES = ['Technical', 'Cultural', 'Sports', 'Workshop', 'Seminar', 'Hackathon', 'Placement', 'Club', 'Other'];

function CreateEventModal({ onClose }) {
  const [form, setForm] = useState({
    name: '', description: '', date: '', startTime: '', endTime: '', venue: '',
    organizer: '', category: 'technical', maxCapacity: '',
    registrationDeadline: '', registrationLink: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const qc = useQueryClient();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await eventsAPI.create({
        ...form,
        category: form.category.toLowerCase(),
        maxCapacity: form.maxCapacity ? Number(form.maxCapacity) : undefined,
        registrationDeadline: form.registrationDeadline || undefined,
      });
      toast.success('Event created successfully as a draft!');
      qc.invalidateQueries({ queryKey: ['admin-events'] });
      qc.invalidateQueries({ queryKey: ['events'] });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create event');
    } finally { setLoading(false); }
  }

  const field = (key, label, type = 'text', placeholder = '', required = false) => (
    <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
      <label className="label">{label}{required && ' *'}</label>
      <input className="input" type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder} required={required} />
    </div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 'var(--space-4)', overflowY: 'auto' }}>
      <div className="card" style={{ width: '100%', maxWidth: '560px', boxShadow: 'var(--shadow-modal)', margin: 'auto' }}>
        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-5)' }}>Create Event</h3>
        {error && <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)', marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)' }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          {field('name', 'Event Name', 'text', 'e.g. Smart Campus AI Hackathon 2026', true)}
          <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
            <label className="label">Description *</label>
            <textarea className="textarea" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Detailed event schedule, rules, and eligibility..." required style={{ resize: 'vertical' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-4)' }}>
            {field('date', 'Date', 'date', '', true)}
            {field('startTime', 'Start Time', 'time', '')}
            {field('endTime', 'End Time', 'time', '')}
          </div>
          {field('venue', 'Venue', 'text', 'e.g. Auditorium - Tech Park', true)}
          {field('organizer', 'Organizer', 'text', 'Department / Club name', true)}
          <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
            <label className="label">Category</label>
            <select className="select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              {CATEGORIES.map(c => <option key={c} value={c.toLowerCase()}>{c}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            {field('maxCapacity', 'Capacity (seats)', 'number', '100')}
            {field('registrationDeadline', 'Reg. Deadline', 'date')}
          </div>
          {field('registrationLink', 'Registration Link (optional)', 'url', 'https://forms.gle/...')}
          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', marginTop: 'var(--space-4)' }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--line)', color: 'var(--ink-muted)', fontWeight: 500, fontSize: 'var(--text-sm)', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ padding: '10px 24px', borderRadius: 'var(--radius-md)', background: 'var(--brand)', color: '#fff', fontWeight: 600, fontSize: 'var(--text-sm)', opacity: loading ? 0.6 : 1, border: 'none', cursor: 'pointer' }}>
              {loading ? 'Creating...' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminEvents() {
  const [showCreate, setShowCreate] = useState(false);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-events'],
    queryFn: async () => {
      const { data } = await eventsAPI.list();
      return data.data;
    },
    staleTime: 30000,
  });

  const publishMut = useMutation({
    mutationFn: (id) => eventsAPI.publish(id),
    onSuccess: () => {
      toast.success('Event published! It is now live for students.');
      qc.invalidateQueries({ queryKey: ['admin-events'] });
      qc.invalidateQueries({ queryKey: ['events'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to publish event'),
  });

  const events = data?.events ?? data ?? [];

  return (
    <div>
      {showCreate && <CreateEventModal onClose={() => setShowCreate(false)} />}

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="page-title">Events Management</h1>
          <p className="page-subtitle">Create events, publish drafts, and monitor student registrations</p>
        </div>
        <button onClick={() => setShowCreate(true)} style={{
          display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
          padding: '10px 20px', background: 'var(--brand)', color: '#fff',
          borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: 'var(--text-sm)',
          border: 'none', cursor: 'pointer'
        }}>
          <Plus size={16} /> Create Event
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: 'var(--space-6)' }}>
            {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '64px', marginBottom: 'var(--space-3)', borderRadius: 'var(--radius-md)' }} />)}
          </div>
        ) : events.length === 0 ? (
          <div style={{ padding: 'var(--space-10)', textAlign: 'center', color: 'var(--ink-faint)' }}>
            <Calendar size={36} style={{ margin: '0 auto var(--space-3)' }} />
            <p style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>No Events Found</p>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-muted)', marginTop: '4px' }}>Click "Create Event" to schedule an event or workshop.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--surface-inset)' }}>
                  {['Event Name', 'Category', 'Date & Time', 'Venue', 'Registrations', 'Status', 'Action'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {events.map(ev => {
                  const regCount = ev.registrationCount ?? ev.registrations?.length ?? 0;
                  return (
                    <tr key={ev._id} style={{ borderBottom: '1px solid var(--line)' }}>
                      <td style={{ padding: '12px 16px', fontSize: 'var(--text-sm)', fontWeight: 600 }}>{ev.name}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span className="badge badge-info" style={{ textTransform: 'capitalize' }}>{ev.category}</span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 'var(--text-sm)', color: 'var(--ink-muted)', whiteSpace: 'nowrap' }}>
                        {ev.date ? new Date(ev.date).toLocaleDateString('en-IN') : '—'}
                        {ev.startTime ? ` (${ev.startTime})` : ''}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 'var(--text-sm)', color: 'var(--ink-muted)' }}>{ev.venue}</td>
                      <td style={{ padding: '12px 16px', fontSize: 'var(--text-sm)', color: 'var(--ink-muted)', whiteSpace: 'nowrap' }}>
                        {regCount} {ev.maxCapacity ? `/ ${ev.maxCapacity}` : 'registered'}
                      </td>
                      <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                        <span className={`badge ${ev.isPublished ? 'badge-success' : 'badge-neutral'}`}>
                          {ev.isPublished ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                        {!ev.isPublished ? (
                          <button
                            onClick={() => publishMut.mutate(ev._id)}
                            disabled={publishMut.isPending}
                            style={{
                              padding: '5px 14px', borderRadius: 'var(--radius-md)',
                              background: 'var(--brand)', color: '#fff',
                              fontWeight: 700, fontSize: 'var(--text-xs)', border: 'none', cursor: 'pointer'
                            }}
                          >
                            Publish Now
                          </button>
                        ) : (
                          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--success)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle size={13} /> Live
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
