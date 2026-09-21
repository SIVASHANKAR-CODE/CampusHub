import { useQuery } from '@tanstack/react-query';
import { hostelAPI } from '../../services/api';
import { Building, User, Phone } from 'lucide-react';

export default function StudentHostel() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['hostel-info'],
    queryFn: async () => { const { data } = await hostelAPI.my(); return data.data; },
    retry: false,
  });

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Hostel Information</h1>
        <p className="page-subtitle">Your room assignment and warden contact</p>
      </div>

      {isLoading && <div className="skeleton" style={{ height: '280px', borderRadius: '12px' }} />}

      {error?.response?.status === 403 && (
        <div className="card" style={{ textAlign: 'center', padding: '48px', color: 'var(--ink-muted)' }}>
          <Building size={32} style={{ margin: '0 auto 12px', color: 'var(--line-strong)' }} />
          <div style={{ fontWeight: 600, marginBottom: '4px' }}>Day Scholar</div>
          <div>Hostel services are not applicable for day scholars.</div>
        </div>
      )}

      {error && error.response?.status !== 403 && (
        <div className="card" style={{ textAlign: 'center', padding: '48px', color: 'var(--danger)' }}>
          Unable to load hostel information. Please try again.
        </div>
      )}

      {data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="card">
            <h2 style={{ fontWeight: 700, fontSize: 'var(--text-lg)', marginBottom: '16px' }}>Room Details</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {[
                { label: 'Block', value: data.blockName },
                { label: 'Room Number', value: data.roomNumber },
                { label: 'Floor', value: data.floorNumber },
                { label: 'Room Type', value: data.roomType, capitalize: true },
              ].map(({ label, value, capitalize }) => (
                <div key={label}>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)', marginBottom: '2px' }}>{label}</div>
                  <div style={{ fontWeight: 600, textTransform: capitalize ? 'capitalize' : 'none' }}>{value || '—'}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h2 style={{ fontWeight: 700, fontSize: 'var(--text-base)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={16} /> Warden Contact
            </h2>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 600 }}>{data.wardenName || 'Not assigned'}</div>
              {data.wardenPhone && (
                <a href={`tel:${data.wardenPhone}`} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--brand)', fontWeight: 600, fontSize: 'var(--text-sm)' }}>
                  <Phone size={14} /> {data.wardenPhone}
                </a>
              )}
            </div>
          </div>

          <div className="card">
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)' }}>
              Joined: {data.joinDate ? new Date(data.joinDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
