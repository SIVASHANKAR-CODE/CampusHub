import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leaveAPI, odAPI } from '../../services/api';
import { CheckCircle, XCircle, Clock, AlertTriangle, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';

function ReviewModal({ item, type, onClose, onSubmit }) {
  const [action, setAction] = useState('');
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);

  const studentName = item.student?.name || item.studentId?.name || 'Student';
  const studentReg = item.student?.regNo || item.studentId?.regNo || item.student?.registrationNumber || item.studentId?.registrationNumber;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!action) return;
    setLoading(true);
    try {
      await onSubmit(item._id, { action, remarks });
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 'var(--space-4)'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto', boxShadow: 'var(--shadow-modal)' }}>
        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>
          Review {type} Application
        </h3>
        <div style={{
          background: 'var(--surface)', borderRadius: 'var(--radius-md)',
          padding: 'var(--space-4)', marginBottom: 'var(--space-4)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-1)' }}>
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700 }}>
              {studentName}
            </span>
            {studentReg && (
              <span className="badge badge-info" style={{ fontSize: '11px', fontFamily: 'monospace' }}>
                {studentReg}
              </span>
            )}
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-muted)' }}>
            {type === 'Leave'
              ? `${new Date(item.startDate).toLocaleDateString('en-IN')} → ${new Date(item.endDate).toLocaleDateString('en-IN')} • ${item.reason}`
              : `${item.eventName || item.event} (${item.organization || ''}) • ${new Date(item.eventDate || item.date).toLocaleDateString('en-IN')}`
            }
          </div>
          {item.description && (
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)', marginTop: 'var(--space-2)' }}>
              {item.description}
            </p>
          )}
          {item.documentUrl && (
            <div style={{ marginTop: '12px', padding: '10px', background: 'var(--surface-raised)', borderRadius: 'var(--radius-md)', border: '1px solid var(--line)' }}>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--ink-muted)', marginBottom: '6px' }}>Attached Proof Document:</div>
              <div style={{ maxHeight: '160px', overflow: 'hidden', borderRadius: '6px', textAlign: 'center', background: 'var(--surface-inset)' }}>
                <img src={item.documentUrl} alt="Proof" style={{ maxWidth: '100%', maxHeight: '160px', objectFit: 'contain' }} onError={(e) => { e.target.style.display = 'none'; }} />
              </div>
              <div style={{ marginTop: '6px' }}>
                <a href={item.documentUrl} target="_blank" rel="noreferrer" style={{ fontSize: 'var(--text-xs)', color: 'var(--brand)', textDecoration: 'underline' }}>
                  Open Full Attachment ↗
                </a>
              </div>
            </div>
          )}
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
            <label className="label">Decision *</label>
            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              {['approve', 'reject'].map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAction(a)}
                  style={{
                    flex: 1, padding: '10px', borderRadius: 'var(--radius-md)',
                    border: `2px solid ${action === a ? (a === 'approve' ? 'var(--success)' : 'var(--danger)') : 'var(--line)'}`,
                    background: action === a ? (a === 'approve' ? 'var(--success-bg)' : 'var(--danger-bg)') : 'var(--surface-raised)',
                    color: action === a ? (a === 'approve' ? 'var(--success)' : 'var(--danger)') : 'var(--ink-muted)',
                    fontWeight: 600, fontSize: 'var(--text-sm)', cursor: 'pointer', textTransform: 'capitalize'
                  }}
                >
                  {a === 'approve' ? '✓ Approve' : '✕ Reject'}
                </button>
              ))}
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: 'var(--space-5)' }}>
            <label className="label">Remarks (optional)</label>
            <textarea
              className="textarea"
              rows={3}
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              placeholder="Add a note for the student..."
              style={{ resize: 'vertical' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{
              padding: '10px 20px', borderRadius: 'var(--radius-md)',
              border: '1px solid var(--line)', color: 'var(--ink-muted)',
              fontWeight: 500, fontSize: 'var(--text-sm)'
            }}>
              Cancel
            </button>
            <button type="submit" disabled={!action || loading} style={{
              padding: '10px 24px', borderRadius: 'var(--radius-md)',
              background: action === 'approve' ? 'var(--success)' : action === 'reject' ? 'var(--danger)' : 'var(--brand)',
              color: '#fff', fontWeight: 600, fontSize: 'var(--text-sm)',
              opacity: !action || loading ? 0.6 : 1
            }}>
              {loading ? 'Submitting...' : 'Submit Decision'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RequestCard({ item, type, onReview }) {
  const studentName = item.student?.name || item.studentId?.name || '—';
  const studentReg = item.student?.regNo || item.studentId?.regNo || item.student?.registrationNumber || item.studentId?.registrationNumber;

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
      padding: 'var(--space-4) var(--space-5)',
      borderBottom: '1px solid var(--line)', gap: 'var(--space-4)'
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: '4px', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{studentName}</span>
          {studentReg && <span className="badge badge-info" style={{ fontSize: '11px', fontFamily: 'monospace' }}>{studentReg}</span>}
          <span className="badge badge-neutral" style={{ fontSize: '11px' }}>{type}</span>
          {item.documentUrl && <span className="badge badge-success" style={{ fontSize: '11px' }}>Proof Attached</span>}
        </div>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-muted)' }}>
          {type === 'Leave'
            ? `${new Date(item.startDate).toLocaleDateString('en-IN')} → ${new Date(item.endDate).toLocaleDateString('en-IN')} • ${item.reason}`
            : `${item.eventName || item.event} • ${new Date(item.eventDate || item.date).toLocaleDateString('en-IN')}`
          }
        </div>
        {item.description && (
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.description}
          </div>
        )}
      </div>
      <button
        onClick={() => onReview(item, type)}
        style={{
          flexShrink: 0, padding: '6px 14px', borderRadius: 'var(--radius-md)',
          background: 'var(--brand)', color: '#fff', fontWeight: 600,
          fontSize: 'var(--text-xs)', cursor: 'pointer'
        }}
      >
        Review
      </button>
    </div>
  );
}

export default function MentorLeaveReview() {
  const qc = useQueryClient();
  const [tab, setTab] = useState('pending');
  const [reviewing, setReviewing] = useState(null); // { item, type }

  const { data, isLoading } = useQuery({
    queryKey: ['mentor-leave-all', tab],
    queryFn: async () => {
      const [leaveRes, odRes] = await Promise.all([
        leaveAPI.menteeList({ status: tab }),
        odAPI.menteeList({ status: tab }),
      ]);
      return { leave: leaveRes.data.data?.leave ?? [], od: odRes.data.data?.od ?? [] };
    },
    staleTime: 15000,
  });

  const reviewLeaveMut = useMutation({
    mutationFn: ({ id, body }) => leaveAPI.review(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mentor-leave-all'] }),
  });

  const reviewOdMut = useMutation({
    mutationFn: ({ id, body }) => odAPI.review(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mentor-leave-all'] }),
  });

  async function handleReviewSubmit(id, body) {
    if (reviewing.type === 'Leave') await reviewLeaveMut.mutateAsync({ id, body });
    else await reviewOdMut.mutateAsync({ id, body });
  }

  const allItems = [...(data?.leave ?? []).map(i => ({ ...i, _type: 'Leave' })),
                   ...(data?.od ?? []).map(i => ({ ...i, _type: 'OD' }))];

  const statusBadge = (s) => {
    const m = { pending: 'badge-warning', approved: 'badge-success', rejected: 'badge-danger' };
    return <span className={`badge ${m[s] || 'badge-neutral'}`}>{s}</span>;
  };

  return (
    <div style={{ maxWidth: '800px' }}>
      {reviewing && (
        <ReviewModal
          item={reviewing.item}
          type={reviewing.type}
          onClose={() => setReviewing(null)}
          onSubmit={handleReviewSubmit}
        />
      )}

      <div className="page-header">
        <h1 className="page-title">Leave & OD Review</h1>
        <p className="page-subtitle">Review leave and on-duty applications from your assigned students</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '2px', background: 'var(--surface-inset)', borderRadius: 'var(--radius-md)', padding: '4px', marginBottom: 'var(--space-5)', width: 'fit-content' }}>
        {['pending', 'approved', 'rejected'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '6px 18px', borderRadius: 'var(--radius-sm)',
            border: 'none', cursor: 'pointer',
            background: tab === t ? 'var(--surface-raised)' : 'transparent',
            color: tab === t ? 'var(--ink)' : 'var(--ink-muted)',
            fontWeight: tab === t ? 600 : 400,
            fontSize: 'var(--text-sm)', textTransform: 'capitalize',
            boxShadow: tab === t ? 'var(--shadow-card)' : 'none',
            transition: 'all var(--transition-fast)'
          }}>
            {t}
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: 'var(--space-6)' }}>
            {[1, 2, 3].map(i => (
              <div key={i} className="skeleton" style={{ height: '64px', marginBottom: 'var(--space-3)', borderRadius: 'var(--radius-md)' }} />
            ))}
          </div>
        ) : allItems.length === 0 ? (
          <div style={{ padding: 'var(--space-10)', textAlign: 'center', color: 'var(--ink-faint)' }}>
            <CheckCircle size={32} style={{ margin: '0 auto var(--space-3)', color: 'var(--success)' }} />
            <p style={{ fontSize: 'var(--text-sm)' }}>No {tab} applications</p>
          </div>
        ) : (
          allItems.map((item) => (
            tab === 'pending' ? (
              <RequestCard
                key={item._id + item._type}
                item={item}
                type={item._type}
                onReview={(i, t) => setReviewing({ item: i, type: t })}
              />
            ) : (
              <div key={item._id + item._type} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: 'var(--space-4) var(--space-5)',
                borderBottom: '1px solid var(--line)'
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', marginBottom: '2px' }}>
                    {item.student?.name} — {item._type}
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-muted)' }}>
                    {item._type === 'Leave'
                      ? `${new Date(item.startDate).toLocaleDateString('en-IN')} → ${new Date(item.endDate).toLocaleDateString('en-IN')}`
                      : new Date(item.date).toLocaleDateString('en-IN')
                    }
                  </div>
                  {item.mentorRemarks && (
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)', marginTop: '2px' }}>
                      Remarks: {item.mentorRemarks}
                    </div>
                  )}
                </div>
                {statusBadge(item.status)}
              </div>
            )
          ))
        )}
      </div>
    </div>
  );
}
