import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clubsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Users, CheckCircle, Clock, XCircle } from 'lucide-react';

const CATEGORY_COLORS = {
  technical: 'badge-info', cultural: 'badge-warning', sports: 'badge-success',
  academic: 'badge-neutral', social: 'badge-neutral', other: 'badge-neutral'
};

export default function StudentClubs() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [joiningId, setJoiningId] = useState(null);

  const { data: clubs = [], isLoading: clubsLoading } = useQuery({
    queryKey: ['clubs'],
    queryFn: async () => { const { data } = await clubsAPI.list(); return data.data || []; },
    staleTime: 30000,
  });

  const { data: myMemberships = [] } = useQuery({
    queryKey: ['my-club-memberships'],
    queryFn: async () => {
      try {
        const { data } = await clubsAPI.myMemberships();
        return data.data || [];
      } catch {
        return [];
      }
    },
    staleTime: 30000,
  });

  const joinMutation = useMutation({
    mutationFn: (clubId) => clubsAPI.join(clubId, { reason: 'Interested in actively participating in club initiatives.' }),
    onSuccess: () => {
      toast.success('Join request submitted to club admin!');
      qc.invalidateQueries({ queryKey: ['my-club-memberships'] });
      qc.invalidateQueries({ queryKey: ['clubs'] });
      setJoiningId(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to submit join request.');
      setJoiningId(null);
    }
  });

  const handleJoin = (clubId) => {
    setJoiningId(clubId);
    joinMutation.mutate(clubId);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Campus Clubs & Societies</h1>
        <p className="page-subtitle">{clubs.length} student-led clubs, technical chapters, and cultural societies</p>
      </div>

      {clubsLoading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: '160px', borderRadius: '12px' }} />)}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
        {clubs.map((club) => {
          const membership = myMemberships.find(m => (m.clubId?._id || m.clubId) === club._id);
          const isMember = membership?.status === 'approved' || (Array.isArray(club.memberIds) && club.memberIds.includes(user?.id));
          const isPending = membership?.status === 'pending';
          const isRejected = membership?.status === 'rejected';

          return (
            <div key={club._id} className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'var(--brand-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={22} style={{ color: 'var(--brand)' }} />
                </div>
                <span className={`badge ${CATEGORY_COLORS[club.category] || 'badge-neutral'}`} style={{ textTransform: 'capitalize' }}>
                  {club.category}
                </span>
              </div>

              <div>
                <div style={{ fontWeight: 700, fontSize: 'var(--text-base)', color: 'var(--ink)' }}>{club.name}</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-muted)', marginTop: '4px', lineHeight: '1.4' }}>
                  {club.description || 'Active campus student community group.'}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid var(--line)' }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)' }}>
                  {club.memberIds?.length || 0} members
                </span>

                {isMember ? (
                  <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle size={12} /> Member
                  </span>
                ) : isPending ? (
                  <span className="badge badge-warning" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} /> Pending Review
                  </span>
                ) : isRejected ? (
                  <button
                    type="button"
                    onClick={() => handleJoin(club._id)}
                    disabled={joiningId === club._id}
                    className="badge badge-danger"
                    style={{ border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px' }}
                    title="Declined — click to re-apply"
                  >
                    <XCircle size={12} /> Re-apply
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleJoin(club._id)}
                    disabled={joiningId === club._id}
                    style={{
                      padding: '6px 14px', borderRadius: 'var(--radius-md)',
                      background: 'var(--brand)', color: '#fff',
                      fontSize: 'var(--text-xs)', fontWeight: 600,
                      border: 'none', cursor: 'pointer',
                      opacity: joiningId === club._id ? 0.6 : 1
                    }}
                  >
                    {joiningId === club._id ? 'Joining…' : 'Join Club'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {clubs.length === 0 && !clubsLoading && (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--ink-muted)' }}>
          No clubs currently listed. Contact Student Affairs to start a new club.
        </div>
      )}
    </div>
  );
}
