import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leaveAPI, odAPI, uploadAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { Plus, X, Camera, Paperclip } from 'lucide-react';

function StatusBadge({ status }) {
  const map = { pending: 'badge-warning', approved: 'badge-success', rejected: 'badge-danger', cancelled: 'badge-neutral' };
  return <span className={`badge ${map[status] || 'badge-neutral'}`}>{status}</span>;
}

function ProofAttachment({ url, onUploaded, onRemove, onBusyChange }) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
    const ext = file.name.split('.').pop()?.toLowerCase();
    const extOk = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'pdf'].includes(ext);
    if (!allowed.includes(file.type) && !extOk) {
      toast.error('Proof must be JPG, PNG, WEBP, GIF, or PDF');
      e.target.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be under 5MB');
      e.target.value = '';
      return;
    }
    setUploading(true);
    onBusyChange?.(true);
    try {
      const res = await uploadAPI.uploadFile(file);
      const uploadedUrl = res.data?.data?.url;
      if (!uploadedUrl) {
        toast.error('Upload succeeded but no file URL was returned.');
        return;
      }
      onUploaded(uploadedUrl);
      toast.success('Proof document attached');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      onBusyChange?.(false);
      e.target.value = '';
    }
  };

  return (
    <div className="form-group">
      <label className="label">Proof Document / Certificate (optional)</label>
      {url ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--surface-inset)', borderRadius: '8px', border: '1px solid var(--line)' }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <Paperclip size={14} style={{ color: 'var(--brand)', flexShrink: 0 }} />
            Attached Proof
          </span>
          <button type="button" onClick={onRemove} style={{ color: 'var(--danger)', fontSize: 'var(--text-xs)', fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer' }}>
            Remove
          </button>
        </div>
      ) : (
        <div>
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
            style={{
              width: '100%', padding: '10px', borderRadius: '8px',
              border: '1px dashed var(--line)', background: 'var(--surface-inset)',
              color: 'var(--ink-muted)', fontSize: 'var(--text-xs)', fontWeight: 500,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer'
            }}
          >
            <Camera size={15} /> {uploading ? 'Uploading...' : 'Upload Photo Proof or Document'}
          </button>
          <input ref={fileRef} type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={handleFile} />
        </div>
      )}
    </div>
  );
}

function LeaveForm({ onClose, onSuccess }) {
  const [form, setForm] = useState({ leaveType: 'casual', startDate: '', endDate: '', reason: '', description: '', documentUrl: '' });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (uploading) {
      toast.error('Please wait for the proof document to finish uploading.');
      return;
    }
    if (form.endDate && form.startDate && form.endDate < form.startDate) {
      toast.error('End date must be on or after the start date.');
      return;
    }
    if (!form.reason.trim() || form.reason.trim().length < 3) {
      toast.error('Reason must be at least 3 characters.');
      return;
    }
    setLoading(true);
    try {
      await leaveAPI.apply({
        ...form,
        reason: form.reason.trim(),
        description: form.description.trim(),
        documentUrl: form.documentUrl || undefined,
      });
      toast.success('Leave application submitted!');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit leave.');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <h2 style={{ fontWeight: 700 }}>Apply for Leave</h2>
          <button onClick={onClose} style={{ color: 'var(--ink-muted)' }}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label className="label">Leave Type</label>
            <select className="select" value={form.leaveType} onChange={e => setForm({ ...form, leaveType: e.target.value })}>
              <option value="casual">Casual Leave</option>
              <option value="medical">Medical Leave</option>
              <option value="emergency">Emergency Leave</option>
              <option value="family">Family Function</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="label">From Date</label>
              <input type="date" className="input" required value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="label">To Date</label>
              <input type="date" className="input" required value={form.endDate} min={form.startDate} onChange={e => setForm({ ...form, endDate: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label className="label">Reason</label>
            <input type="text" className="input" required placeholder="Brief reason" value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="label">Additional details (optional)</label>
            <textarea className="textarea" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <ProofAttachment
            url={form.documentUrl}
            onUploaded={(url) => setForm({ ...form, documentUrl: url })}
            onRemove={() => setForm({ ...form, documentUrl: '' })}
            onBusyChange={setUploading}
          />
          <button type="submit" className="btn-submit" disabled={loading || uploading} style={{ background: 'var(--brand)', color: '#fff', padding: '10px', borderRadius: '8px', fontWeight: 600 }}>
            {loading ? 'Submitting…' : uploading ? 'Uploading proof…' : 'Submit Application'}
          </button>
        </form>
      </div>
    </div>
  );
}

function ODForm({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    eventName: '',
    organization: '',
    eventDate: '',
    returnDate: '',
    venue: '',
    reason: '',
    description: '',
    documentUrl: '',
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (uploading) {
      toast.error('Please wait for the proof document to finish uploading.');
      return;
    }
    if (form.returnDate && form.eventDate && form.returnDate < form.eventDate) {
      toast.error('Return date must be on or after the event date.');
      return;
    }
    if (!form.eventName.trim() || form.eventName.trim().length < 3) {
      toast.error('Event name must be at least 3 characters.');
      return;
    }
    setLoading(true);
    try {
      await odAPI.apply({
        ...form,
        eventName: form.eventName.trim(),
        organization: form.organization.trim(),
        venue: form.venue.trim(),
        reason: form.reason.trim(),
        description: form.description.trim(),
        documentUrl: form.documentUrl || undefined,
      });
      toast.success('On-Duty (OD) application submitted!');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit OD application.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <h2 style={{ fontWeight: 700, fontSize: 'var(--text-lg)' }}>Apply for On-Duty (OD)</h2>
          <button onClick={onClose} style={{ color: 'var(--ink-muted)', cursor: 'pointer' }}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label className="label">Event / Activity Name</label>
            <input
              type="text"
              className="input"
              required
              placeholder="e.g. Smart India Hackathon 2026"
              value={form.eventName}
              onChange={(e) => setForm({ ...form, eventName: e.target.value })}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="label">Organizing Body / College</label>
              <input
                type="text"
                className="input"
                required
                placeholder="e.g. IIT Madras"
                value={form.organization}
                onChange={(e) => setForm({ ...form, organization: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="label">Venue / City</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. IC&SR Auditorium, Chennai"
                value={form.venue}
                onChange={(e) => setForm({ ...form, venue: e.target.value })}
              />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="label">From Date</label>
              <input
                type="date"
                className="input"
                required
                value={form.eventDate}
                onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="label">To Date</label>
              <input
                type="date"
                className="input"
                required
                min={form.eventDate}
                value={form.returnDate}
                onChange={(e) => setForm({ ...form, returnDate: e.target.value })}
              />
            </div>
          </div>
          <div className="form-group">
            <label className="label">Reason for OD</label>
            <input
              type="text"
              className="input"
              required
              placeholder="e.g. Presenting Research Paper / Competing in Grand Finale"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="label">Additional Details / Team Members</label>
            <textarea
              className="textarea"
              rows={2}
              placeholder="Team name, registration ID, or faculty mentor notes"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <ProofAttachment
            url={form.documentUrl}
            onUploaded={(url) => setForm({ ...form, documentUrl: url })}
            onRemove={() => setForm({ ...form, documentUrl: '' })}
            onBusyChange={setUploading}
          />
          <button type="submit" className="btn btn-primary" disabled={loading || uploading} style={{ width: '100%', marginTop: '8px' }}>
            {loading ? 'Submitting OD…' : uploading ? 'Uploading proof…' : 'Submit OD Application'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function StudentLeave() {
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showODModal, setShowODModal] = useState(false);
  const [tab, setTab] = useState('leave');
  const qc = useQueryClient();

  const { data: leaves, isLoading: leavesLoading } = useQuery({
    queryKey: ['my-leaves'],
    queryFn: async () => { const { data } = await leaveAPI.my(); return data.data?.leaves || []; },
  });

  const { data: ods, isLoading: odsLoading } = useQuery({
    queryKey: ['my-ods'],
    queryFn: async () => { const { data } = await odAPI.my(); return data.data || []; },
  });

  const cancelMutation = useMutation({
    mutationFn: (id) => leaveAPI.cancel(id),
    onSuccess: () => { toast.success('Leave cancelled.'); qc.invalidateQueries({ queryKey: ['my-leaves'] }); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to cancel.'),
  });

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="page-title">Leave & OD</h1>
          <p className="page-subtitle">Submit and track leave or on-duty permissions</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => (tab === 'leave' ? setShowLeaveModal(true) : setShowODModal(true))}
        >
          <Plus size={16} /> {tab === 'leave' ? 'Apply Leave' : 'Apply OD'}
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid var(--line)' }}>
        {['leave', 'od'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '10px 24px',
              fontWeight: tab === t ? 600 : 400,
              color: tab === t ? 'var(--brand)' : 'var(--ink-muted)',
              borderBottom: tab === t ? '2px solid var(--brand)' : '2px solid transparent',
              fontSize: 'var(--text-sm)',
              cursor: 'pointer',
              background: 'none',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
            }}
          >
            {t === 'od' ? 'On-Duty (OD) Applications' : 'Leave Applications'}
          </button>
        ))}
      </div>

      {tab === 'leave' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {leavesLoading ? [...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: '80px', borderRadius: '12px' }} />) : null}
          {!leavesLoading && leaves?.length === 0 && (
            <div className="card" style={{ textAlign: 'center', color: 'var(--ink-muted)', padding: '48px 24px' }}>
              No leave applications submitted yet.
            </div>
          )}
          {leaves?.map((l) => (
            <div key={l._id} className="card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 'var(--text-base)', marginBottom: '4px', textTransform: 'capitalize' }}>
                  {l.leaveType} Leave
                </div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-muted)' }}>
                  📅 {new Date(l.startDate).toLocaleDateString('en-IN')} – {new Date(l.endDate).toLocaleDateString('en-IN')} ({l.totalDays} day{l.totalDays > 1 ? 's' : ''})
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)', marginTop: '4px' }}>Reason: {l.reason}</div>
                {l.documentUrl && (
                  <div style={{ marginTop: '4px' }}>
                    <a href={l.documentUrl} target="_blank" rel="noreferrer" style={{ fontSize: 'var(--text-xs)', color: 'var(--brand)', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Paperclip size={12} /> View Attached Proof
                    </a>
                  </div>
                )}
                {l.mentorRemarks && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--brand)', marginTop: '4px' }}>Mentor remarks: {l.mentorRemarks}</div>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                <StatusBadge status={l.status} />
                {l.status === 'pending' && (
                  <button
                    onClick={() => cancelMutation.mutate(l._id)}
                    className="btn btn-ghost btn-sm"
                    style={{ color: 'var(--danger)' }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'od' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {odsLoading ? [...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: '80px', borderRadius: '12px' }} />) : null}
          {!odsLoading && ods?.length === 0 && (
            <div className="card" style={{ textAlign: 'center', color: 'var(--ink-muted)', padding: '48px 24px' }}>
              No OD applications submitted yet.
            </div>
          )}
          {ods?.map((od) => (
            <div key={od._id} className="card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 'var(--text-base)', marginBottom: '4px' }}>{od.eventName}</div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-muted)' }}>
                  🏛️ {od.organization} {od.venue && `• 📍 ${od.venue}`}
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)', marginTop: '4px' }}>
                  📅 {new Date(od.eventDate).toLocaleDateString('en-IN')} – {new Date(od.returnDate).toLocaleDateString('en-IN')}
                </div>
                {od.reason && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-muted)', marginTop: '4px' }}>Reason: {od.reason}</div>}
                {od.documentUrl && (
                  <div style={{ marginTop: '4px' }}>
                    <a href={od.documentUrl} target="_blank" rel="noreferrer" style={{ fontSize: 'var(--text-xs)', color: 'var(--brand)', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Paperclip size={12} /> View Attached Proof
                    </a>
                  </div>
                )}
                {od.mentorRemarks && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--brand)', marginTop: '4px' }}>Mentor remarks: {od.mentorRemarks}</div>}
              </div>
              <StatusBadge status={od.status} />
            </div>
          ))}
        </div>
      )}

      {showLeaveModal && (
        <LeaveForm
          onClose={() => setShowLeaveModal(false)}
          onSuccess={() => qc.invalidateQueries({ queryKey: ['my-leaves'] })}
        />
      )}

      {showODModal && (
        <ODForm
          onClose={() => setShowODModal(false)}
          onSuccess={() => qc.invalidateQueries({ queryKey: ['my-ods'] })}
        />
      )}
    </div>
  );
}

