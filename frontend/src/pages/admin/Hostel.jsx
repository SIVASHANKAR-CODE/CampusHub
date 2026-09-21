import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hostelAPI, studentAPI } from '../../services/api';
import { Building, Plus, Trash2, Search } from 'lucide-react';

function AssignModal({ onClose }) {
  const [form, setForm] = useState({ studentId: '', room: '', block: '', wardenName: '', wardenContact: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const qc = useQueryClient();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await hostelAPI.assign(form);
      qc.invalidateQueries({ queryKey: ['admin-hostel'] });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign hostel');
    } finally { setLoading(false); }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 'var(--space-4)'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '480px', boxShadow: 'var(--shadow-modal)' }}>
        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-5)' }}>Assign Hostel</h3>
        {error && <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)', marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)' }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          {[
            { key: 'studentId', label: 'Student ID (MongoDB _id)', placeholder: 'Enter student _id' },
            { key: 'room', label: 'Room Number', placeholder: 'e.g. 204' },
            { key: 'block', label: 'Block', placeholder: 'e.g. A Block' },
            { key: 'wardenName', label: 'Warden Name', placeholder: 'Warden full name' },
            { key: 'wardenContact', label: 'Warden Contact', placeholder: '+91 XXXXXXXXXX' },
          ].map(({ key, label, placeholder }) => (
            <div key={key} className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
              <label className="label">{label}</label>
              <input className="input" value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder} required />
            </div>
          ))}
          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--line)', color: 'var(--ink-muted)', fontWeight: 500, fontSize: 'var(--text-sm)' }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ padding: '10px 24px', borderRadius: 'var(--radius-md)', background: 'var(--brand)', color: '#fff', fontWeight: 600, fontSize: 'var(--text-sm)', opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Assigning...' : 'Assign Hostel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminHostel() {
  const [showAssign, setShowAssign] = useState(false);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-hostel'],
    queryFn: async () => {
      const { data } = await hostelAPI.list();
      return data.data;
    },
    staleTime: 30000,
  });

  const removeMut = useMutation({
    mutationFn: (studentId) => hostelAPI.remove(studentId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-hostel'] }),
  });

  const hostellers = data?.hostellers ?? data ?? [];

  return (
    <div>
      {showAssign && <AssignModal onClose={() => setShowAssign(false)} />}

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 className="page-title">Hostel Management</h1>
          <p className="page-subtitle">Manage hostel student assignments and room allocations</p>
        </div>
        <button onClick={() => setShowAssign(true)} style={{
          display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
          padding: '10px 20px', background: 'var(--brand)', color: '#fff',
          borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: 'var(--text-sm)'
        }}>
          <Plus size={16} /> Assign Hostel
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: 'var(--space-6)' }}>
            {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: '56px', marginBottom: 'var(--space-3)', borderRadius: 'var(--radius-md)' }} />)}
          </div>
        ) : hostellers.length === 0 ? (
          <div style={{ padding: 'var(--space-10)', textAlign: 'center', color: 'var(--ink-faint)' }}>
            <Building size={32} style={{ margin: '0 auto var(--space-3)' }} />
            <p style={{ fontSize: 'var(--text-sm)' }}>No hostel students assigned yet</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--surface-inset)' }}>
                  {['Student', 'Department', 'Room', 'Block', 'Warden', ''].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {hostellers.map((h) => (
                  <tr key={h._id} style={{ borderBottom: '1px solid var(--line)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{h.student?.name ?? '—'}</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)' }}>{h.student?.registrationNumber}</div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 'var(--text-sm)', color: 'var(--ink-muted)' }}>{h.student?.department}</td>
                    <td style={{ padding: '12px 16px', fontSize: 'var(--text-sm)', fontWeight: 600 }}>{h.room}</td>
                    <td style={{ padding: '12px 16px', fontSize: 'var(--text-sm)', color: 'var(--ink-muted)' }}>{h.block}</td>
                    <td style={{ padding: '12px 16px', fontSize: 'var(--text-sm)', color: 'var(--ink-muted)' }}>
                      {h.wardenName}<br />
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)' }}>{h.wardenContact}</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <button
                        onClick={() => {
                          if (window.confirm(`Remove ${h.student?.name} from hostel?`)) removeMut.mutate(h.student?._id);
                        }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '4px',
                          padding: '4px 12px', borderRadius: 'var(--radius-md)',
                          background: 'var(--danger-bg)', color: 'var(--danger)',
                          fontSize: 'var(--text-xs)', fontWeight: 600, cursor: 'pointer'
                        }}
                      >
                        <Trash2 size={13} /> Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div style={{ marginTop: 'var(--space-3)', fontSize: 'var(--text-xs)', color: 'var(--ink-faint)' }}>
        {hostellers.length} hostel students
      </div>
    </div>
  );
}
