import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { complaintsAPI } from '../../services/api';
import { MessageSquare, AlertTriangle, CheckCircle, Clock, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUSES = ['submitted', 'under_review', 'assigned', 'in_progress', 'resolved', 'rejected', 'closed'];
const STATUS_COLORS = {
  submitted: 'badge-info', under_review: 'badge-warning', assigned: 'badge-warning',
  in_progress: 'badge-warning', resolved: 'badge-success', rejected: 'badge-danger', closed: 'badge-neutral'
};
const PRIORITY_COLORS = {
  low: { bg: 'rgba(34,197,94,0.12)', color: '#16a34a', border: '1px solid rgba(34,197,94,0.25)' },
  medium: { bg: 'rgba(59,130,246,0.12)', color: '#2563eb', border: '1px solid rgba(59,130,246,0.25)' },
  high: { bg: 'rgba(245,158,11,0.12)', color: '#d97706', border: '1px solid rgba(245,158,11,0.25)' },
  urgent: { bg: 'rgba(239,68,68,0.12)', color: '#dc2626', border: '1px solid rgba(239,68,68,0.25)' },
};

function StatusUpdateModal({ complaint, onClose }) {
  const [status, setStatus] = useState(complaint.status);
  const [note, setNote] = useState('');
  const [assignedToName, setAssignedToName] = useState(complaint.assignedToName || '');
  const [resolutionNote, setResolutionNote] = useState(complaint.resolutionNote || '');
  const [loading, setLoading] = useState(false);
  const qc = useQueryClient();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await complaintsAPI.updateStatus(complaint._id, {
        status,
        note,
        assignedTo: (status === 'assigned' && assignedToName) ? 'mock_maint_001' : undefined,
        assignedToName: (status === 'assigned' && assignedToName) ? assignedToName : undefined,
        resolutionNote: resolutionNote || undefined,
      });
      toast.success(`Complaint ${complaint.ticketId} updated to ${status.replace(/_/g, ' ')}`);
      qc.invalidateQueries({ queryKey: ['admin-complaints'] });
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update complaint');
    }
    finally { setLoading(false); }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 'var(--space-4)'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '520px', boxShadow: 'var(--shadow-modal)', maxHeight: '90vh', overflowY: 'auto' }}>
        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>Update Complaint Status</h3>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)', marginBottom: 'var(--space-4)' }}>{complaint.ticketId}</p>

        {/* Complaint summary */}
        <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
          <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', marginBottom: '4px' }}>{complaint.title}</div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-muted)', marginBottom: '6px' }}>
            {complaint.category} • {complaint.subCategory || 'General'} •{' '}
            <span style={{
              display: 'inline-block',
              padding: '1px 6px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              background: PRIORITY_COLORS[complaint.priority]?.bg || PRIORITY_COLORS.medium.bg,
              color: PRIORITY_COLORS[complaint.priority]?.color || PRIORITY_COLORS.medium.color,
            }}>{complaint.priority || 'medium'}</span>
          </div>
          {complaint.description && (
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-muted)', marginTop: '6px', lineHeight: 1.5 }}>
              {complaint.description.length > 200 ? complaint.description.slice(0, 200) + '...' : complaint.description}
            </div>
          )}
          {complaint.imageUrl && (
            <div style={{ marginTop: '10px', textAlign: 'center', background: 'var(--surface-inset)', padding: '8px', borderRadius: '6px' }}>
              <img src={complaint.imageUrl} alt="Complaint proof" style={{ maxWidth: '100%', maxHeight: '180px', objectFit: 'contain', borderRadius: '4px' }} />
              <div style={{ marginTop: '4px' }}>
                <a href={complaint.imageUrl} target="_blank" rel="noreferrer" style={{ fontSize: 'var(--text-xs)', color: 'var(--brand)', textDecoration: 'underline' }}>
                  View Full Image ↗
                </a>
              </div>
            </div>
          )}
          {complaint.resolutionImageUrl && (
            <div style={{ marginTop: '10px', textAlign: 'center', background: 'rgba(34,197,94,0.08)', padding: '8px', borderRadius: '6px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#16a34a', marginBottom: '4px' }}>Resolution Proof</div>
              <img src={complaint.resolutionImageUrl} alt="Resolution proof" style={{ maxWidth: '100%', maxHeight: '180px', objectFit: 'contain', borderRadius: '4px' }} />
              <div style={{ marginTop: '4px' }}>
                <a href={complaint.resolutionImageUrl} target="_blank" rel="noreferrer" style={{ fontSize: 'var(--text-xs)', color: 'var(--brand)', textDecoration: 'underline' }}>
                  View Resolution Proof ↗
                </a>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
            <label className="label">New Status</label>
            <select className="select" value={status} onChange={e => setStatus(e.target.value)}>
              {STATUSES.map(s => (
                <option key={s} value={s} style={{ textTransform: 'capitalize' }}>{s.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>

          {(status === 'assigned' || status === 'in_progress') && (
            <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
              <label className="label">Assign to Maintenance Staff</label>
              <input
                className="input"
                type="text"
                value={assignedToName}
                onChange={e => setAssignedToName(e.target.value)}
                placeholder="e.g. Suresh Kumar (maintenance@demo.com)"
              />
              <span style={{ fontSize: '11px', color: 'var(--ink-faint)' }}>Enter name of maintenance staff to assign</span>
            </div>
          )}

          {(status === 'resolved' || status === 'closed') && (
            <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
              <label className="label">Resolution Note</label>
              <textarea
                className="textarea"
                rows={2}
                value={resolutionNote}
                onChange={e => setResolutionNote(e.target.value)}
                placeholder="Describe how the issue was resolved..."
                style={{ resize: 'vertical' }}
              />
            </div>
          )}

          <div className="form-group" style={{ marginBottom: 'var(--space-5)' }}>
            <label className="label">Admin Note (optional)</label>
            <textarea className="textarea" rows={3} value={note} onChange={e => setNote(e.target.value)} placeholder="Add a note..." style={{ resize: 'vertical' }} />
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{
              padding: '10px 20px', borderRadius: 'var(--radius-md)',
              border: '1px solid var(--line)', color: 'var(--ink-muted)', fontWeight: 500, fontSize: 'var(--text-sm)'
            }}>Cancel</button>
            <button type="submit" disabled={loading} style={{
              padding: '10px 24px', borderRadius: 'var(--radius-md)',
              background: 'var(--brand)', color: '#fff', fontWeight: 600, fontSize: 'var(--text-sm)',
              opacity: loading ? 0.6 : 1
            }}>{loading ? 'Saving...' : 'Update'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminComplaints() {
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-complaints', statusFilter],
    queryFn: async () => {
      const params = statusFilter ? { status: statusFilter } : {};
      const { data } = await complaintsAPI.all(params);
      return data.data;
    },
    staleTime: 20000,
  });

  const complaints = data?.complaints ?? data ?? [];

  // Summary stats
  const stats = {
    total: complaints.length,
    pending: complaints.filter(c => c.status === 'submitted').length,
    inProgress: complaints.filter(c => ['under_review', 'assigned', 'in_progress'].includes(c.status)).length,
    resolved: complaints.filter(c => c.status === 'resolved' || c.status === 'closed').length,
    urgent: complaints.filter(c => c.priority === 'urgent' || c.priority === 'high').length,
  };

  return (
    <div>
      {selected && <StatusUpdateModal complaint={selected} onClose={() => setSelected(null)} />}

      <div className="page-header">
        <h1 className="page-title">Complaints</h1>
        <p className="page-subtitle">Review and manage student complaints and tickets</p>
      </div>

      {/* Stats cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
        {[
          { label: 'Total', value: stats.total, icon: MessageSquare, color: 'var(--brand)' },
          { label: 'Pending', value: stats.pending, icon: Clock, color: '#f59e0b' },
          { label: 'In Progress', value: stats.inProgress, icon: Shield, color: '#3b82f6' },
          { label: 'Resolved', value: stats.resolved, icon: CheckCircle, color: '#22c55e' },
          { label: 'High/Urgent', value: stats.urgent, icon: AlertTriangle, color: '#ef4444' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${s.color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <s.icon size={18} style={{ color: s.color }} />
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--ink)' }}>{s.value}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-5)', flexWrap: 'wrap' }}>
        <select className="select" style={{ width: 'auto', minWidth: '180px' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s} style={{ textTransform: 'capitalize' }}>{s.replace(/_/g, ' ')}</option>)}
        </select>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: 'var(--space-6)' }}>
            {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: '72px', marginBottom: 'var(--space-3)', borderRadius: 'var(--radius-md)' }} />)}
          </div>
        ) : complaints.length === 0 ? (
          <div style={{ padding: 'var(--space-10)', textAlign: 'center', color: 'var(--ink-faint)' }}>
            <MessageSquare size={32} style={{ margin: '0 auto var(--space-3)' }} />
            <p style={{ fontSize: 'var(--text-sm)' }}>No complaints found</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--surface-inset)' }}>
                  {['Ticket ID', 'Student', 'Title', 'Category', 'Priority', 'Status', 'Assigned To', 'Date', ''].map(h => (
                    <th key={h} style={{
                      padding: '10px 14px', textAlign: 'left',
                      fontSize: 'var(--text-xs)', fontWeight: 600,
                      color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '0.05em',
                      whiteSpace: 'nowrap'
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {complaints.map(c => {
                  const sName = c.student?.name || c.studentId?.name || '—';
                  const sReg = c.student?.regNo || c.studentId?.regNo || c.student?.registrationNumber || c.studentId?.registrationNumber;
                  const sDept = c.student?.department || c.studentId?.department;
                  const pStyle = PRIORITY_COLORS[c.priority] || PRIORITY_COLORS.medium;
                  return (
                    <tr key={c._id} style={{ borderBottom: '1px solid var(--line)' }}>
                      <td style={{ padding: '12px 14px', fontSize: 'var(--text-xs)', fontFamily: 'monospace', color: 'var(--ink-faint)', whiteSpace: 'nowrap' }}>{c.ticketId}</td>
                      <td style={{ padding: '12px 14px', fontSize: 'var(--text-sm)' }}>
                        <div style={{ fontWeight: 600 }}>{sName}</div>
                        {sReg && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)', fontFamily: 'monospace' }}>{sReg}</div>}
                        {sDept && <div style={{ fontSize: '11px', color: 'var(--ink-faint)' }}>{sDept}</div>}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: 'var(--text-sm)', maxWidth: '200px' }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</div>
                        {c.imageUrl && (
                          <a href={c.imageUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '4px', color: 'var(--brand)', fontSize: 'var(--text-xs)', textDecoration: 'underline' }}>
                            <img src={c.imageUrl} alt={`Proof for ${c.ticketId}`} style={{ width: '32px', height: '32px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--line)' }} />
                            View Photo
                          </a>
                        )}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: 'var(--text-xs)', color: 'var(--ink-muted)', textTransform: 'capitalize' }}>{c.category}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          background: pStyle.bg,
                          color: pStyle.color,
                          border: pStyle.border,
                        }}>{c.priority || 'medium'}</span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span className={`badge ${STATUS_COLORS[c.status] || 'badge-neutral'}`} style={{ textTransform: 'capitalize' }}>
                          {c.status?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: 'var(--text-xs)', color: 'var(--ink-muted)' }}>
                        {c.assignedToName || (c.assignedTo?.email) || <span style={{ color: 'var(--ink-faint)' }}>—</span>}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: 'var(--text-xs)', color: 'var(--ink-faint)', whiteSpace: 'nowrap' }}>
                        {new Date(c.createdAt).toLocaleDateString('en-IN')}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <button
                          onClick={() => setSelected(c)}
                          style={{
                            padding: '4px 12px', borderRadius: 'var(--radius-md)',
                            background: 'var(--brand-muted)', color: 'var(--brand)',
                            fontWeight: 600, fontSize: 'var(--text-xs)', cursor: 'pointer'
                          }}
                        >Update</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div style={{ marginTop: 'var(--space-3)', fontSize: 'var(--text-xs)', color: 'var(--ink-faint)' }}>
        {complaints.length} complaints shown
      </div>
    </div>
  );
}
