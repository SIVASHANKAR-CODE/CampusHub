import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { complaintsAPI } from '../../services/api';
import { Wrench, CheckCircle, Clock, Camera, X } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_FLOW = ['assigned', 'in_progress', 'resolved'];
const STATUS_COLORS = {
  assigned: 'badge-warning',
  in_progress: 'badge-info',
  resolved: 'badge-success',
};
const PRIORITY_COLORS = {
  low: 'badge-neutral',
  medium: 'badge-warning',
  high: 'badge-danger',
  urgent: 'badge-danger',
};

function ResolutionModal({ complaint, onClose, onSubmit, isPending }) {
  const [note, setNote] = useState('');
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState('');

  function handlePhoto(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Resolution photo must be JPG, PNG, or WEBP.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Resolution photo must be under 5MB.');
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  }

  function submit(event) {
    event.preventDefault();
    onSubmit({ note, photo });
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-4)', background: 'rgba(0, 0, 0, .5)' }}>
      <div className="card" style={{ width: '100%', maxWidth: '480px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
          <div>
            <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>Resolve Complaint</h2>
            <p style={{ color: 'var(--ink-muted)', fontSize: 'var(--text-xs)', marginTop: '4px' }}>{complaint.ticketId}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="form-group">
            <label className="label">Resolution note</label>
            <textarea className="textarea" rows={3} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Describe the work completed..." required />
          </div>
          <div className="form-group">
            <label className="label">Resolution photo <span style={{ color: 'var(--danger)' }}>*</span></label>
            {preview ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img src={preview} alt="Resolution preview" style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '6px' }} />
                <button type="button" onClick={() => { URL.revokeObjectURL(preview); setPreview(''); setPhoto(null); }} style={{ color: 'var(--danger)', fontSize: 'var(--text-xs)' }}>Remove</button>
              </div>
            ) : (
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: 'var(--brand)', fontSize: 'var(--text-sm)' }}>
                <Camera size={16} /> Add resolution photo
                <input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={handlePhoto} style={{ display: 'none' }} />
              </label>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
            <button type="button" onClick={onClose} className="btn btn-outline">Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={isPending || !photo}>{isPending ? 'Saving...' : 'Mark Resolved'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function MaintenanceDashboard() {
  const qc = useQueryClient();
  const [resolutionComplaint, setResolutionComplaint] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['maintenance-assigned'],
    queryFn: async () => {
      const { data } = await complaintsAPI.assigned();
      return data.data;
    },
    staleTime: 30000,
  });

  const updateMut = useMutation({
    mutationFn: ({ id, status, note, photo }) => {
      if (status === 'assigned') return complaintsAPI.claim(id);
      if (status === 'resolved') {
        const form = new FormData();
        form.append('status', status);
        form.append('note', note || 'Complaint resolved by maintenance.');
        if (photo) form.append('photo', photo);
        return complaintsAPI.updateProgress(id, form);
      }
      return complaintsAPI.updateProgress(id, { status, note });
    },
    onSuccess: () => {
      setResolutionComplaint(null);
      qc.invalidateQueries({ queryKey: ['maintenance-assigned'] });
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Unable to update this complaint.'),
  });

  const complaints = data?.complaints ?? data ?? [];
  const pending = complaints.filter(c => c.status !== 'resolved').length;
  const resolved = complaints.filter(c => c.status === 'resolved').length;

  function nextStatus(current) {
    const idx = STATUS_FLOW.indexOf(current);
    return idx < STATUS_FLOW.length - 1 ? STATUS_FLOW[idx + 1] : null;
  }

  return (
    <div style={{ maxWidth: '860px' }}>
      <div className="page-header">
        <h1 className="page-title">Maintenance Dashboard</h1>
        <p className="page-subtitle">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: 'var(--space-4)', marginBottom: 'var(--space-6)'
      }}>
        {[
          { label: 'Assigned to Me', value: complaints.length, icon: Wrench, color: 'var(--brand)' },
          { label: 'Pending / In Progress', value: pending, icon: Clock, color: 'var(--warning)' },
          { label: 'Resolved', value: resolved, icon: CheckCircle, color: 'var(--success)' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card" style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
            <div style={{ background: color + '18', borderRadius: 'var(--radius-md)', padding: 'var(--space-2)', flexShrink: 0 }}>
              <Icon size={20} style={{ color }} />
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--ink)', lineHeight: 1 }}>{value ?? '—'}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-muted)', marginTop: '2px' }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Complaints List */}
      <h2 className="section-title">My Assigned Complaints</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {isLoading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="skeleton" style={{ height: '110px', borderRadius: 'var(--radius-lg)' }} />
          ))
        ) : complaints.length === 0 ? (
          <div className="card" style={{ padding: 'var(--space-10)', textAlign: 'center', color: 'var(--ink-faint)' }}>
            <CheckCircle size={36} style={{ margin: '0 auto var(--space-3)', color: 'var(--success)' }} />
            <p style={{ fontSize: 'var(--text-sm)' }}>No complaints assigned to you right now</p>
          </div>
        ) : (
          complaints.map(complaint => {
            const next = nextStatus(complaint.status);
            return (
              <div key={complaint._id} className="card" style={{ padding: 'var(--space-5)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-4)', marginBottom: 'var(--space-3)' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--ink)' }}>{complaint.title}</span>
                      <span className={`badge ${STATUS_COLORS[complaint.status] || 'badge-neutral'}`} style={{ textTransform: 'capitalize' }}>
                        {complaint.status?.replace(/_/g, ' ')}
                      </span>
                      {complaint.priority && (
                        <span className={`badge ${PRIORITY_COLORS[complaint.priority] || 'badge-neutral'}`} style={{ textTransform: 'capitalize' }}>
                          {complaint.priority}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-muted)', marginBottom: '4px' }}>
                      {complaint.category} — {complaint.subCategory} • Ticket: {complaint.ticketId}
                    </div>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)', lineHeight: 1.6 }}>
                      {complaint.description}
                    </p>
                    {complaint.location && (
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)', marginTop: '4px' }}>
                        📍 {complaint.location}
                      </div>
                    )}
                    {complaint.imageUrl && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                        <img
                          src={complaint.imageUrl}
                          alt={`Proof for ${complaint.ticketId}`}
                          style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--line)' }}
                        />
                        <a href={complaint.imageUrl} target="_blank" rel="noreferrer" style={{ fontSize: 'var(--text-xs)', color: 'var(--brand)', textDecoration: 'underline' }}>
                          View Complaint Photo
                        </a>
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {complaint.createdAt ? new Date(complaint.createdAt).toLocaleDateString('en-IN') : ''}
                  </div>
                </div>

                {/* Action */}
                {next && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => next === 'resolved'
                        ? setResolutionComplaint(complaint)
                        : updateMut.mutate({ id: complaint._id, status: next })}
                      disabled={updateMut.isPending}
                      style={{
                        padding: '6px 16px', borderRadius: 'var(--radius-md)',
                        background: next === 'resolved' ? 'var(--success)' : 'var(--brand)',
                        color: '#fff', fontWeight: 600, fontSize: 'var(--text-xs)',
                        cursor: 'pointer', textTransform: 'capitalize',
                        opacity: updateMut.isPending ? 0.6 : 1
                      }}
                    >
                      {next === 'assigned' ? 'Accept & Assign to Me' : `Mark as ${next.replace(/_/g, ' ')}`}
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      {resolutionComplaint && (
        <ResolutionModal
          complaint={resolutionComplaint}
          onClose={() => setResolutionComplaint(null)}
          onSubmit={({ note, photo }) => updateMut.mutate({ id: resolutionComplaint._id, status: 'resolved', note, photo })}
          isPending={updateMut.isPending}
        />
      )}
    </div>
  );
}
