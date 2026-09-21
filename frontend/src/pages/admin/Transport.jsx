import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transportAPI } from '../../services/api';
import { Bus, Plus, MapPin, Users } from 'lucide-react';

function CreateBusModal({ onClose }) {
  const [form, setForm] = useState({ busNumber: '', routeName: '', driverName: '', driverContact: '', capacity: '', status: 'active' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const qc = useQueryClient();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await transportAPI.create({ ...form, capacity: Number(form.capacity) });
      qc.invalidateQueries({ queryKey: ['admin-transport'] });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create bus');
    } finally { setLoading(false); }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 'var(--space-4)' }}>
      <div className="card" style={{ width: '100%', maxWidth: '480px', boxShadow: 'var(--shadow-modal)' }}>
        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-5)' }}>Add New Bus</h3>
        {error && <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)', marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)' }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="label">Bus Number *</label>
              <input className="input" value={form.busNumber} onChange={e => setForm(f => ({ ...f, busNumber: e.target.value }))} placeholder="e.g. TN-01" required />
            </div>
            <div className="form-group">
              <label className="label">Capacity *</label>
              <input className="input" type="number" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} placeholder="50" required />
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
            <label className="label">Route Name *</label>
            <input className="input" value={form.routeName} onChange={e => setForm(f => ({ ...f, routeName: e.target.value }))} placeholder="e.g. Salem → College" required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="label">Driver Name</label>
              <input className="input" value={form.driverName} onChange={e => setForm(f => ({ ...f, driverName: e.target.value }))} placeholder="Full name" />
            </div>
            <div className="form-group">
              <label className="label">Driver Contact</label>
              <input className="input" value={form.driverContact} onChange={e => setForm(f => ({ ...f, driverContact: e.target.value }))} placeholder="+91 XXXXXXXXXX" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--line)', color: 'var(--ink-muted)', fontWeight: 500, fontSize: 'var(--text-sm)' }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ padding: '10px 24px', borderRadius: 'var(--radius-md)', background: 'var(--brand)', color: '#fff', fontWeight: 600, fontSize: 'var(--text-sm)', opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Creating...' : 'Create Bus'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminTransport() {
  const [showCreate, setShowCreate] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-transport'],
    queryFn: async () => {
      const { data } = await transportAPI.all();
      return data.data;
    },
    staleTime: 30000,
  });

  const buses = data?.buses ?? data ?? [];

  return (
    <div>
      {showCreate && <CreateBusModal onClose={() => setShowCreate(false)} />}

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 className="page-title">Transport Management</h1>
          <p className="page-subtitle">Manage buses, routes and driver assignments</p>
        </div>
        <button onClick={() => setShowCreate(true)} style={{
          display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
          padding: '10px 20px', background: 'var(--brand)', color: '#fff',
          borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: 'var(--text-sm)'
        }}>
          <Plus size={16} /> Add Bus
        </button>
      </div>

      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: '140px', borderRadius: 'var(--radius-lg)' }} />)}
        </div>
      ) : buses.length === 0 ? (
        <div className="card" style={{ padding: 'var(--space-10)', textAlign: 'center', color: 'var(--ink-faint)' }}>
          <Bus size={36} style={{ margin: '0 auto var(--space-3)' }} />
          <p style={{ fontSize: 'var(--text-sm)' }}>No buses added yet</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
          {buses.map(bus => (
            <div key={bus._id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <div style={{ background: 'var(--success-bg)', borderRadius: 'var(--radius-md)', padding: 'var(--space-2)' }}>
                    <Bus size={20} style={{ color: 'var(--success)' }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 'var(--text-base)', color: 'var(--ink)' }}>{bus.busNumber}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)' }}>Capacity: {bus.capacity}</div>
                  </div>
                </div>
                <span className={`badge ${bus.status === 'active' ? 'badge-success' : 'badge-neutral'}`} style={{ textTransform: 'capitalize' }}>
                  {bus.status}
                </span>
              </div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-muted)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                <MapPin size={13} /> {bus.routeName || 'No route set'}
              </div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-muted)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                <Users size={13} /> {bus.driverName || 'No driver assigned'}
              </div>
              {bus.students?.length != null && (
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)' }}>
                  {bus.students.length} students assigned
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
