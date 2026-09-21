import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clubsAPI } from '../../services/api';
import { Users2, Plus, Trash2, CheckCircle, XCircle, Clock, ShieldCheck, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

const CLUB_CATEGORIES = [
  { value: 'technical', label: 'Technical' },
  { value: 'cultural', label: 'Cultural' },
  { value: 'sports', label: 'Sports' },
  { value: 'academic', label: 'Academic' },
  { value: 'social', label: 'Social & Community' },
  { value: 'other', label: 'Other' },
];

function CreateClubModal({ onClose }) {
  const [form, setForm] = useState({ name: '', description: '', category: 'technical' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const qc = useQueryClient();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await clubsAPI.create({
        name: form.name.trim(),
        description: form.description.trim(),
        category: form.category.toLowerCase(),
      });
      toast.success('Club created successfully!');
      qc.invalidateQueries({ queryKey: ['admin-clubs'] });
      qc.invalidateQueries({ queryKey: ['clubs'] });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create club');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 'var(--space-4)' }}>
      <div className="card" style={{ width: '100%', maxWidth: '440px', boxShadow: 'var(--shadow-modal)' }}>
        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-5)' }}>Create New Club</h3>
        {error && <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)', marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)' }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
            <label className="label">Club Name *</label>
            <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Google Developer Student Club" required />
          </div>
          <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
            <label className="label">Category *</label>
            <select className="select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              {CLUB_CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 'var(--space-5)' }}>
            <label className="label">Description *</label>
            <textarea className="textarea" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description of club activities and mission..." required style={{ resize: 'vertical' }} />
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--line)', color: 'var(--ink-muted)', fontWeight: 500, fontSize: 'var(--text-sm)' }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ padding: '10px 24px', borderRadius: 'var(--radius-md)', background: 'var(--brand)', color: '#fff', fontWeight: 600, fontSize: 'var(--text-sm)', opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Creating...' : 'Create Club'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminClubs() {
  const [showCreate, setShowCreate] = useState(false);
  const [tab, setTab] = useState('clubs'); // 'clubs' | 'memberships' | 'proposals'
  const qc = useQueryClient();

  // 1. All Clubs
  const { data: clubsData, isLoading: clubsLoading } = useQuery({
    queryKey: ['admin-clubs'],
    queryFn: async () => {
      const { data } = await clubsAPI.list();
      return data.data;
    },
    staleTime: 30000,
  });

  // 2. Student Membership Requests (Students requesting to join an existing club)
  const { data: joinRequestsData, isLoading: joinRequestsLoading } = useQuery({
    queryKey: ['admin-club-memberships'],
    queryFn: async () => {
      const { data } = await clubsAPI.joinRequests();
      return data.data || [];
    },
    staleTime: 30000,
  });

  // 3. New Club Proposals (Students requesting to create a brand new club)
  const { data: proposalsData, isLoading: proposalsLoading } = useQuery({
    queryKey: ['admin-club-requests'],
    queryFn: async () => {
      const { data } = await clubsAPI.requests();
      return data.data || [];
    },
    staleTime: 30000,
  });

  // Mutations
  const reviewMembershipMut = useMutation({
    mutationFn: ({ id, status, remarks }) => clubsAPI.reviewJoinRequest(id, { status, remarks }),
    onSuccess: (_, vars) => {
      toast.success(`Membership request ${vars.status}!`);
      qc.invalidateQueries({ queryKey: ['admin-club-memberships'] });
      qc.invalidateQueries({ queryKey: ['admin-clubs'] });
      qc.invalidateQueries({ queryKey: ['my-club-memberships'] });
      qc.invalidateQueries({ queryKey: ['clubs'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to review membership request'),
  });

  const reviewProposalMut = useMutation({
    mutationFn: ({ id, action }) => clubsAPI.reviewRequest(id, { action }),
    onSuccess: (_, vars) => {
      toast.success(`Club proposal ${vars.action === 'approve' ? 'approved' : 'rejected'}!`);
      qc.invalidateQueries({ queryKey: ['admin-club-requests'] });
      qc.invalidateQueries({ queryKey: ['admin-clubs'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to review proposal'),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => clubsAPI.delete(id),
    onSuccess: () => {
      toast.success('Club deleted');
      qc.invalidateQueries({ queryKey: ['admin-clubs'] });
      qc.invalidateQueries({ queryKey: ['clubs'] });
    },
  });

  const clubs = clubsData?.clubs ?? clubsData ?? [];
  const joinRequests = joinRequestsData || [];
  const proposals = proposalsData?.requests ?? proposalsData ?? [];

  return (
    <div>
      {showCreate && <CreateClubModal onClose={() => setShowCreate(false)} />}

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="page-title">Club Management</h1>
          <p className="page-subtitle">Manage campus clubs, review student membership join requests, and approve new club proposals</p>
        </div>
        <button onClick={() => setShowCreate(true)} style={{
          display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
          padding: '10px 20px', background: 'var(--brand)', color: '#fff',
          borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: 'var(--text-sm)', border: 'none', cursor: 'pointer'
        }}>
          <Plus size={16} /> Create Club
        </button>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '4px', background: 'var(--surface-inset)', borderRadius: 'var(--radius-md)', padding: '4px', marginBottom: 'var(--space-5)', width: 'fit-content' }}>
        <button
          onClick={() => setTab('clubs')}
          style={{
            padding: '8px 18px', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer',
            background: tab === 'clubs' ? 'var(--surface-raised)' : 'transparent',
            color: tab === 'clubs' ? 'var(--ink)' : 'var(--ink-muted)',
            fontWeight: tab === 'clubs' ? 700 : 500, fontSize: 'var(--text-sm)',
            boxShadow: tab === 'clubs' ? 'var(--shadow-card)' : 'none',
          }}
        >
          All Clubs ({clubs.length})
        </button>
        <button
          onClick={() => setTab('memberships')}
          style={{
            padding: '8px 18px', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer',
            background: tab === 'memberships' ? 'var(--surface-raised)' : 'transparent',
            color: tab === 'memberships' ? 'var(--ink)' : 'var(--ink-muted)',
            fontWeight: tab === 'memberships' ? 700 : 500, fontSize: 'var(--text-sm)',
            display: 'flex', alignItems: 'center', gap: '6px',
            boxShadow: tab === 'memberships' ? 'var(--shadow-card)' : 'none',
          }}
        >
          <Users2 size={15} /> Student Membership Requests
          {joinRequests.length > 0 && (
            <span style={{ background: 'var(--brand)', color: '#fff', fontSize: '11px', padding: '1px 6px', borderRadius: '10px', fontWeight: 700 }}>
              {joinRequests.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('proposals')}
          style={{
            padding: '8px 18px', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer',
            background: tab === 'proposals' ? 'var(--surface-raised)' : 'transparent',
            color: tab === 'proposals' ? 'var(--ink)' : 'var(--ink-muted)',
            fontWeight: tab === 'proposals' ? 700 : 500, fontSize: 'var(--text-sm)',
            display: 'flex', alignItems: 'center', gap: '6px',
            boxShadow: tab === 'proposals' ? 'var(--shadow-card)' : 'none',
          }}
        >
          <FileText size={15} /> New Club Proposals
          {proposals.filter(p => p.status === 'pending').length > 0 && (
            <span style={{ background: 'var(--warning)', color: '#fff', fontSize: '11px', padding: '1px 6px', borderRadius: '10px', fontWeight: 700 }}>
              {proposals.filter(p => p.status === 'pending').length}
            </span>
          )}
        </button>
      </div>

      {/* ─── TAB 1: ALL CLUBS ────────────────────────────────────────────── */}
      {tab === 'clubs' && (
        clubsLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 'var(--space-4)' }}>
            {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: '140px', borderRadius: 'var(--radius-lg)' }} />)}
          </div>
        ) : clubs.length === 0 ? (
          <div className="card" style={{ padding: 'var(--space-10)', textAlign: 'center', color: 'var(--ink-faint)' }}>
            <Users2 size={36} style={{ margin: '0 auto var(--space-3)' }} />
            <p style={{ fontSize: 'var(--text-sm)' }}>No clubs created yet. Click "Create Club" to add one.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
            {clubs.map(club => (
              <div key={club._id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 'var(--text-base)', color: 'var(--ink)' }}>{club.name}</div>
                    <span className="badge badge-info" style={{ fontSize: '11px', textTransform: 'capitalize', marginTop: '4px' }}>
                      {club.category}
                    </span>
                  </div>
                  <button
                    onClick={() => { if (window.confirm(`Delete club "${club.name}"?`)) deleteMut.mutate(club._id); }}
                    style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px' }}
                    title="Delete club"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-muted)', lineHeight: 1.6 }}>
                  {club.description || 'Active campus student community group.'}
                </p>
                <div style={{ marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--ink-faint)' }}>
                  <span>{club.memberIds?.length || 0} active members</span>
                  <span style={{ color: 'var(--success)' }}>Active</span>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ─── TAB 2: STUDENT MEMBERSHIP REQUESTS ──────────────────────────── */}
      {tab === 'memberships' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {joinRequestsLoading ? (
            <div style={{ padding: 'var(--space-6)' }}>
              {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '64px', marginBottom: 'var(--space-3)', borderRadius: 'var(--radius-md)' }} />)}
            </div>
          ) : joinRequests.length === 0 ? (
            <div style={{ padding: 'var(--space-10)', textAlign: 'center', color: 'var(--ink-faint)' }}>
              <CheckCircle size={36} style={{ margin: '0 auto var(--space-3)', color: 'var(--success)' }} />
              <p style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>All Caught Up!</p>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-muted)', marginTop: '4px' }}>There are no pending student club membership join requests.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--surface-inset)' }}>
                    {['Student', 'Reg No', 'Club', 'Department / Year', 'Reason / Message', 'Request Date', 'Status', 'Actions'].map(h => (
                      <th key={h} style={{
                        padding: '12px 16px', textAlign: 'left',
                        fontSize: 'var(--text-xs)', fontWeight: 600,
                        color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '0.05em',
                        whiteSpace: 'nowrap'
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {joinRequests.map(req => {
                    const student = req.studentId || {};
                    const sName = student.name || 'Student';
                    const sReg = student.regNo || student.registrationNumber || 'DEMO001';
                    const sDept = `${student.department || 'CSE'}${student.year ? ` - Yr ${student.year}` : ''}${student.section ? ` (${student.section})` : ''}`;
                    const cName = req.clubId?.name || 'Campus Club';
                    const isPending = req.status === 'pending';

                    return (
                      <tr key={req._id} style={{ borderBottom: '1px solid var(--line)' }}>
                        <td style={{ padding: '12px 16px', fontSize: 'var(--text-sm)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {sName}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 'var(--text-xs)', fontFamily: 'monospace', color: 'var(--ink-muted)', whiteSpace: 'nowrap' }}>
                          {sReg}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--brand)', whiteSpace: 'nowrap' }}>
                          {cName}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 'var(--text-xs)', color: 'var(--ink-muted)', whiteSpace: 'nowrap' }}>
                          {sDept}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 'var(--text-xs)', color: 'var(--ink-muted)', maxWidth: '240px' }}>
                          {req.message || 'Interested in actively participating in club initiatives.'}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 'var(--text-xs)', color: 'var(--ink-faint)', whiteSpace: 'nowrap' }}>
                          {req.appliedAt ? new Date(req.appliedAt).toLocaleDateString('en-IN') : 'Today'}
                        </td>
                        <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                          <span className={`badge ${req.status === 'approved' ? 'badge-success' : req.status === 'rejected' ? 'badge-danger' : 'badge-warning'}`} style={{ textTransform: 'capitalize' }}>
                            {req.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                          {isPending ? (
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                onClick={() => reviewMembershipMut.mutate({ id: req._id, status: 'approved' })}
                                disabled={reviewMembershipMut.isPending}
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                                  padding: '5px 12px', borderRadius: 'var(--radius-md)',
                                  background: 'var(--success-bg)', color: 'var(--success)',
                                  fontSize: 'var(--text-xs)', fontWeight: 700, border: 'none', cursor: 'pointer'
                                }}
                              >
                                <CheckCircle size={13} /> Approve
                              </button>
                              <button
                                onClick={() => reviewMembershipMut.mutate({ id: req._id, status: 'rejected' })}
                                disabled={reviewMembershipMut.isPending}
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                                  padding: '5px 12px', borderRadius: 'var(--radius-md)',
                                  background: 'var(--danger-bg)', color: 'var(--danger)',
                                  fontSize: 'var(--text-xs)', fontWeight: 700, border: 'none', cursor: 'pointer'
                                }}
                              >
                                <XCircle size={13} /> Reject
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)' }}>Reviewed</span>
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
      )}

      {/* ─── TAB 3: NEW CLUB PROPOSALS ───────────────────────────────────── */}
      {tab === 'proposals' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {proposalsLoading ? (
            <div style={{ padding: 'var(--space-6)' }}>
              {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '64px', marginBottom: 'var(--space-3)', borderRadius: 'var(--radius-md)' }} />)}
            </div>
          ) : proposals.length === 0 ? (
            <div style={{ padding: 'var(--space-10)', textAlign: 'center', color: 'var(--ink-faint)' }}>
              <CheckCircle size={36} style={{ margin: '0 auto var(--space-3)', color: 'var(--success)' }} />
              <p style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>No Pending Proposals</p>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-muted)', marginTop: '4px' }}>There are no student proposals to create new clubs.</p>
            </div>
          ) : (
            proposals.map(req => (
              <div key={req._id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--line)', flexWrap: 'wrap', gap: '12px'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>{req.clubName}</div>
                    <span className="badge badge-info" style={{ fontSize: '11px', textTransform: 'capitalize' }}>{req.category}</span>
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-muted)' }}>
                    Proposed by <strong>{req.requestedBy?.name || 'Student'}</strong> • {req.purpose || req.description}
                  </div>
                </div>
                {req.status === 'pending' ? (
                  <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <button
                      onClick={() => reviewProposalMut.mutate({ id: req._id, action: 'approve' })}
                      disabled={reviewProposalMut.isPending}
                      style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 14px', borderRadius: 'var(--radius-md)', background: 'var(--success-bg)', color: 'var(--success)', fontSize: 'var(--text-xs)', fontWeight: 700, border: 'none', cursor: 'pointer' }}
                    ><CheckCircle size={13} /> Approve Proposal</button>
                    <button
                      onClick={() => reviewProposalMut.mutate({ id: req._id, action: 'reject' })}
                      disabled={reviewProposalMut.isPending}
                      style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 14px', borderRadius: 'var(--radius-md)', background: 'var(--danger-bg)', color: 'var(--danger)', fontSize: 'var(--text-xs)', fontWeight: 700, border: 'none', cursor: 'pointer' }}
                    ><XCircle size={13} /> Reject</button>
                  </div>
                ) : (
                  <span className={`badge ${req.status === 'approved' ? 'badge-success' : 'badge-danger'}`} style={{ textTransform: 'capitalize' }}>
                    {req.status}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
