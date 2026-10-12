import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { complaintsAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { Plus, X, Camera, Paperclip } from 'lucide-react';
import '../../styles/modal.css';

function StatusBadge({ status }) {
  const map = {
    submitted: 'badge-info', under_review: 'badge-warning', assigned: 'badge-warning',
    in_progress: 'badge-info', resolved: 'badge-success', rejected: 'badge-danger', closed: 'badge-neutral'
  };
  return <span className={`badge ${map[status] || 'badge-neutral'}`}>{status?.replace('_', ' ')}</span>;
}

const CATEGORIES = ['infrastructure', 'academic', 'hostel', 'transport', 'food', 'library', 'administration', 'electrical', 'plumbing', 'facilities', 'maintenance', 'it', 'other'];

function ComplaintForm({ onClose, onSuccess }) {
  const [form, setForm] = useState({ category: 'infrastructure', title: '', description: '', priority: 'medium', imageUrl: '' });
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
  }, [photoPreview]);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!allowedTypes.includes(file.type) && !['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
      toast.error('Photo must be JPG, JPEG, PNG, or WEBP');
      e.target.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be under 5MB');
      e.target.value = '';
      return;
    }
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = new FormData();
      payload.append('category', form.category);
      payload.append('priority', form.priority);
      payload.append('title', form.title);
      payload.append('description', form.description);
      if (photo) payload.append('photo', photo);
      const response = await complaintsAPI.create(payload);
      const ticketId = response.data?.data?.ticketId;
      toast.success(ticketId ? `Complaint submitted: ${ticketId}` : 'Complaint submitted successfully.');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit complaint.');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <h2 style={{ fontWeight: 700 }}>Submit Complaint</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label className="label">Category</label>
            <select className="select" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map(c => <option key={c} value={c} style={{ textTransform: 'capitalize' }}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="label">Priority</label>
            <select className="select" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div className="form-group">
            <label className="label">Title</label>
            <input className="input" required placeholder="Brief summary of the issue" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="label">Description</label>
            <textarea className="textarea" required rows={3} placeholder="Describe the issue in detail..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="label">Photo Proof (optional)</label>
            {photoPreview ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--surface-inset)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--line)' }}>
                <img src={photoPreview} alt="Proof preview" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--ink)', flex: 1 }}>Proof attached</span>
                <button type="button" onClick={() => { URL.revokeObjectURL(photoPreview); setPhoto(null); setPhotoPreview(''); if (fileInputRef.current) fileInputRef.current.value = ''; }} style={{ color: 'var(--danger)', fontSize: 'var(--text-xs)', fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer' }}>
                  Remove
                </button>
              </div>
            ) : (
              <div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    width: '100%', padding: '10px', borderRadius: '8px',
                    border: '1px dashed var(--line)', background: 'var(--surface-inset)',
                    color: 'var(--ink-muted)', fontSize: 'var(--text-xs)', fontWeight: 500,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer'
                  }}
                >
                  <Camera size={15} /> Capture / Upload Photo Proof
                </button>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" style={{ display: 'none' }} onChange={handleFile} />
              </div>
            )}
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', marginTop: '8px' }}>
            {loading ? 'Submitting…' : 'Submit Complaint'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function StudentComplaints() {
  const [showForm, setShowForm] = useState(false);
  const qc = useQueryClient();

  const { data: complaints, isLoading } = useQuery({
    queryKey: ['my-complaints'],
    queryFn: async () => { const { data } = await complaintsAPI.my(); return data.data || []; },
    refetchInterval: 15000,
  });

  const acknowledgeMutation = useMutation({
    mutationFn: (id) => complaintsAPI.acknowledge(id),
    onSuccess: () => { toast.success('Resolution acknowledged.'); qc.invalidateQueries({ queryKey: ['my-complaints'] }); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed.'),
  });

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="page-title">My Complaints</h1>
          <p className="page-subtitle">Track status of issues you have reported</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={16} /> Report Issue
        </button>
      </div>

      {isLoading && [...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: '100px', borderRadius: '12px', marginBottom: '8px' }} />)}
      {complaints?.length === 0 && <div className="card" style={{ textAlign: 'center', color: 'var(--ink-muted)', padding: '32px' }}>No complaints filed yet. Use the button above to report an issue.</div>}

      {complaints?.map((c) => (
        <div key={c._id} className="card" style={{ marginBottom: '8px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div>
              <div style={{ fontWeight: 600 }}>{c.title}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--brand)', fontWeight: 600, marginTop: '2px' }}>{c.ticketId}</div>
            </div>
            <StatusBadge status={c.status} />
          </div>
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-muted)', marginBottom: '8px' }}>{c.description?.substring(0, 120)}{c.description?.length > 120 ? '…' : ''}</div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)', display: 'flex', gap: '16px' }}>
            <span style={{ textTransform: 'capitalize' }}>{c.category}</span>
            <span>Priority: {c.priority}</span>
            <span>{new Date(c.createdAt).toLocaleDateString('en-IN')}</span>
          </div>
          {c.imageUrl && (
            <div style={{ marginTop: '8px' }}>
              <a href={c.imageUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
                <img src={c.imageUrl} alt="Proof" style={{ height: '48px', width: '48px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--line)' }} />
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--brand)', textDecoration: 'underline' }}>View Full Proof</span>
              </a>
            </div>
          )}
          {c.resolutionNote && (
            <div style={{ marginTop: '8px', background: 'var(--success-bg)', border: '1px solid var(--success-border)', borderRadius: '8px', padding: '8px 12px', fontSize: 'var(--text-xs)', color: 'var(--success)' }}>
              Resolution: {c.resolutionNote}
            </div>
          )}
          {c.resolutionImageUrl && (
            <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <img src={c.resolutionImageUrl} alt="Resolution proof" style={{ width: '52px', height: '52px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--line)' }} />
              <a href={c.resolutionImageUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--brand)', fontSize: 'var(--text-xs)', textDecoration: 'underline' }}>View Resolution Proof</a>
            </div>
          )}
          {c.status === 'resolved' && !c.studentAcknowledged && (
            <button onClick={() => acknowledgeMutation.mutate(c._id)} style={{ marginTop: '8px', fontSize: 'var(--text-xs)', color: 'var(--success)', fontWeight: 600, background: 'var(--success-bg)', border: '1px solid var(--success-border)', padding: '4px 12px', borderRadius: '999px' }}>
              ✓ Mark as Resolved
            </button>
          )}
        </div>
      ))}

      {showForm && <ComplaintForm onClose={() => setShowForm(false)} onSuccess={() => qc.invalidateQueries({ queryKey: ['my-complaints'] })} />}
    </div>
  );
}
