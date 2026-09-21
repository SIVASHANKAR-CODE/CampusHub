import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { lostFoundAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { Plus, X, Search } from 'lucide-react';
import '../../styles/modal.css';

function PostForm({ onClose, onSuccess }) {
  const [form, setForm] = useState({ type: 'lost', itemName: '', description: '', location: '', date: '', contactMethod: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await lostFoundAPI.create(form);
      toast.success('Post created successfully!');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create post.');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <h2 style={{ fontWeight: 700 }}>Post to Lost & Found</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {['lost', 'found'].map(t => (
              <button key={t} type="button" onClick={() => setForm({ ...form, type: t })}
                style={{ padding: '10px', borderRadius: '8px', fontWeight: 600, textTransform: 'capitalize',
                  background: form.type === t ? (t === 'lost' ? 'var(--danger-bg)' : 'var(--success-bg)') : 'var(--surface-inset)',
                  color: form.type === t ? (t === 'lost' ? 'var(--danger)' : 'var(--success)') : 'var(--ink-muted)',
                  border: `1px solid ${form.type === t ? (t === 'lost' ? 'var(--danger-border)' : 'var(--success-border)') : 'var(--line)'}` }}>
                I {t} something
              </button>
            ))}
          </div>
          <div className="form-group">
            <label className="label">Item Name</label>
            <input className="input" required placeholder="e.g. Black wallet, ID card" value={form.itemName} onChange={e => setForm({ ...form, itemName: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="label">Description</label>
            <textarea className="textarea" required rows={3} placeholder="Describe the item in detail..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="label">Location</label>
            <input className="input" required placeholder="Where was it lost/found?" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="label">Date</label>
            <input type="date" className="input" required value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="label">Contact method (optional)</label>
            <input className="input" placeholder="e.g. Room 202 Block A, or phone number" value={form.contactMethod} onChange={e => setForm({ ...form, contactMethod: e.target.value })} />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', marginTop: '8px' }}>
            {loading ? 'Posting…' : 'Post Item'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function StudentLostFound() {
  const [tab, setTab] = useState('');
  const [showForm, setShowForm] = useState(false);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['lost-found', tab],
    queryFn: async () => { const { data } = await lostFoundAPI.list({ type: tab || undefined }); return data.data?.posts || []; },
  });

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="page-title">Lost & Found</h1>
          <p className="page-subtitle">Community board for lost and found items</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={16} /> Post Item
        </button>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {[{ value: '', label: 'All' }, { value: 'lost', label: 'Lost' }, { value: 'found', label: 'Found' }].map(({ value, label }) => (
          <button key={value} onClick={() => setTab(value)} style={{
            padding: '6px 16px', borderRadius: '999px', fontWeight: 600, fontSize: 'var(--text-sm)',
            background: tab === value ? 'var(--brand)' : 'var(--surface-raised)',
            color: tab === value ? '#fff' : 'var(--ink-muted)',
            border: `1px solid ${tab === value ? 'var(--brand)' : 'var(--line)'}`,
          }}>{label}</button>
        ))}
      </div>

      {isLoading && [...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: '90px', borderRadius: '12px', marginBottom: '8px' }} />)}

      {data?.map((post) => (
        <div key={post._id} className="card" style={{ marginBottom: '8px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div>
              <span className={`badge ${post.type === 'lost' ? 'badge-danger' : 'badge-success'}`} style={{ marginRight: '8px' }}>
                {post.type}
              </span>
              <span style={{ fontWeight: 700 }}>{post.itemName}</span>
            </div>
            <span style={{ fontSize: '10px', color: 'var(--ink-faint)' }}>{new Date(post.date).toLocaleDateString('en-IN')}</span>
          </div>
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-muted)', marginBottom: '8px' }}>{post.description}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--ink-faint)' }}>
            <span>📍 {post.location}</span>
            {post.contactMethod && <span>Contact: {post.contactMethod}</span>}
          </div>
        </div>
      ))}

      {data?.length === 0 && !isLoading && <div style={{ textAlign: 'center', padding: '32px', color: 'var(--ink-muted)' }}>No posts yet. Be the first to post!</div>}

      {showForm && <PostForm onClose={() => setShowForm(false)} onSuccess={() => qc.invalidateQueries({ queryKey: ['lost-found'] })} />}
    </div>
  );
}
