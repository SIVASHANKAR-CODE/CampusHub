import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { announcementsAPI } from '../../services/api';
import { Megaphone, Plus, Trash2 } from 'lucide-react';

const CATEGORIES = ['General', 'Academic', 'Exam', 'Fee', 'Event', 'Holiday', 'Transport', 'Hostel', 'Emergency'];
const PRIORITIES = ['normal', 'high', 'urgent'];
const AUDIENCES = ['everyone', 'students', 'faculty', 'hostel', 'day_scholars'];

function CreateAnnouncementModal({ onClose }) {
  const [form, setForm] = useState({
    title: '', description: '', category: 'General', priority: 'normal',
    targetAudience: 'everyone', expiryDate: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const qc = useQueryClient();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await announcementsAPI.create(form);
      qc.invalidateQueries({ queryKey: ['admin-announcements'] });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create announcement');
    } finally { setLoading(false); }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 'var(--space-4)', overflowY: 'auto' }}>
      <div className="card" style={{ width: '100%', maxWidth: '520px', boxShadow: 'var(--shadow-modal)', margin: 'auto' }}>
        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-5)' }}>Post Announcement</h3>
        {error && <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)', marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)' }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
            <label className="label">Title *</label>
            <input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Announcement title" required />
          </div>
          <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
            <label className="label">Description *</label>
            <textarea className="textarea" rows={4} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Full announcement text..." style={{ resize: 'vertical' }} required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="label">Category</label>
              <select className="select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Priority</label>
              <select className="select" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                {PRIORITIES.map(p => <option key={p} value={p} style={{ textTransform: 'capitalize' }}>{p}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
            <div className="form-group">
              <label className="label">Target Audience</label>
              <select className="select" value={form.targetAudience} onChange={e => setForm(f => ({ ...f, targetAudience: e.target.value }))}>
                {AUDIENCES.map(a => <option key={a} value={a} style={{ textTransform: 'capitalize' }}>{a.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Expiry Date</label>
              <input className="input" type="date" value={form.expiryDate} onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--line)', color: 'var(--ink-muted)', fontWeight: 500, fontSize: 'var(--text-sm)' }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ padding: '10px 24px', borderRadius: 'var(--radius-md)', background: 'var(--brand)', color: '#fff', fontWeight: 600, fontSize: 'var(--text-sm)', opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Posting...' : 'Post Announcement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const PRIORITY_BADGE = { normal: 'badge-neutral', high: 'badge-warning', urgent: 'badge-danger' };

export default function AdminAnnouncements() {
  const [showCreate, setShowCreate] = useState(false);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-announcements'],
    queryFn: async () => {
      const { data } = await announcementsAPI.list();
      return data.data;
    },
    staleTime: 30000,
  });

  const deleteMut = useMutation({
    mutationFn: (id) => announcementsAPI.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-announcements'] }),
  });

  const announcements = data?.announcements ?? data ?? [];

  return (
    <div>
      {showCreate && <CreateAnnouncementModal onClose={() => setShowCreate(false)} />}

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 className="page-title">Announcements</h1>
          <p className="page-subtitle">Post and manage notices for students and staff</p>
        </div>
        <button onClick={() => setShowCreate(true)} style={{
          display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
          padding: '10px 20px', background: 'var(--brand)', color: '#fff',
          borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: 'var(--text-sm)'
        }}>
          <Plus size={16} /> Post Announcement
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {isLoading ? (
          [1,2,3].map(i => <div key={i} className="skeleton" style={{ height: '80px', borderRadius: 'var(--radius-lg)' }} />)
        ) : announcements.length === 0 ? (
          <div className="card" style={{ padding: 'var(--space-10)', textAlign: 'center', color: 'var(--ink-faint)' }}>
            <Megaphone size={36} style={{ margin: '0 auto var(--space-3)' }} />
            <p style={{ fontSize: 'var(--text-sm)' }}>No announcements posted yet</p>
          </div>
        ) : (
          announcements.map(ann => (
            <div key={ann._id} className="card" style={{ padding: 'var(--space-4) var(--space-5)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--ink)' }}>{ann.title}</span>
                    <span className={`badge ${PRIORITY_BADGE[ann.priority] || 'badge-neutral'}`} style={{ textTransform: 'capitalize' }}>{ann.priority}</span>
                    <span className="badge badge-info">{ann.category}</span>
                  </div>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-muted)', lineHeight: 1.6, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {ann.description}
                  </p>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)', marginTop: 'var(--space-2)' }}>
                    Target: {ann.targetAudience?.replace('_', ' ')} •{' '}
                    {ann.publishedAt ? new Date(ann.publishedAt).toLocaleDateString('en-IN') : 'Draft'}
                  </div>
                </div>
                <button
                  onClick={() => { if (window.confirm('Delete this announcement?')) deleteMut.mutate(ann._id); }}
                  style={{ background: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px', flexShrink: 0 }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
