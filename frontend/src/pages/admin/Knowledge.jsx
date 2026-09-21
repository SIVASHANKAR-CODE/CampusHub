import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../../services/api';
import { Brain, Plus, Edit2, Trash2, Save, X } from 'lucide-react';

function KnowledgeForm({ initial, onSave, onCancel, loading }) {
  const [form, setForm] = useState(initial || { question: '', answer: '', category: 'General', tags: '' });

  function handleSubmit(e) {
    e.preventDefault();
    onSave({ ...form, tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [] });
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div className="form-group">
        <label className="label">Question / Trigger *</label>
        <input className="input" value={form.question} onChange={e => setForm(f => ({ ...f, question: e.target.value }))} placeholder="e.g. Library closing time" required />
      </div>
      <div className="form-group">
        <label className="label">Answer *</label>
        <textarea className="textarea" rows={3} value={form.answer} onChange={e => setForm(f => ({ ...f, answer: e.target.value }))} placeholder="The library closes at 6 PM on weekdays..." style={{ resize: 'vertical' }} required />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
        <div className="form-group">
          <label className="label">Category</label>
          <select className="select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
            {['General', 'Library', 'Fees', 'Hostel', 'Transport', 'Academic', 'Events', 'Facilities'].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="label">Tags (comma-separated)</label>
          <input className="input" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="library, hours, timing" />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
        {onCancel && (
          <button type="button" onClick={onCancel} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '8px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--line)', color: 'var(--ink-muted)', fontWeight: 500, fontSize: 'var(--text-sm)' }}>
            <X size={14} /> Cancel
          </button>
        )}
        <button type="submit" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '8px 20px', borderRadius: 'var(--radius-md)', background: 'var(--brand)', color: '#fff', fontWeight: 600, fontSize: 'var(--text-sm)', opacity: loading ? 0.6 : 1 }}>
          <Save size={14} /> {loading ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  );
}

export default function AdminKnowledge() {
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [addLoading, setAddLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-knowledge'],
    queryFn: async () => {
      const { data } = await adminAPI.knowledge();
      return data.data;
    },
    staleTime: 30000,
  });

  const deleteMut = useMutation({
    mutationFn: (id) => adminAPI.deleteKnowledge(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-knowledge'] }),
  });

  async function handleAdd(body) {
    setAddLoading(true);
    try {
      await adminAPI.addKnowledge(body);
      qc.invalidateQueries({ queryKey: ['admin-knowledge'] });
      setShowAdd(false);
    } finally { setAddLoading(false); }
  }

  async function handleEdit(body) {
    setEditLoading(true);
    try {
      await adminAPI.updateKnowledge(editing._id, body);
      qc.invalidateQueries({ queryKey: ['admin-knowledge'] });
      setEditing(null);
    } finally { setEditLoading(false); }
  }

  const items = data?.knowledge ?? data ?? [];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">AI Knowledge Base</h1>
        <p className="page-subtitle">Manage question-answer pairs used by the AI Campus Assistant</p>
      </div>

      {/* Add Form */}
      {showAdd ? (
        <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>Add Knowledge Entry</h3>
          <KnowledgeForm onSave={handleAdd} onCancel={() => setShowAdd(false)} loading={addLoading} />
        </div>
      ) : (
        <button onClick={() => setShowAdd(true)} style={{
          display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-5)',
          padding: '10px 20px', background: 'var(--brand)', color: '#fff',
          borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: 'var(--text-sm)'
        }}>
          <Plus size={16} /> Add Knowledge Entry
        </button>
      )}

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {isLoading ? (
          [1,2,3].map(i => <div key={i} className="skeleton" style={{ height: '100px', borderRadius: 'var(--radius-lg)' }} />)
        ) : items.length === 0 ? (
          <div className="card" style={{ padding: 'var(--space-10)', textAlign: 'center', color: 'var(--ink-faint)' }}>
            <Brain size={36} style={{ margin: '0 auto var(--space-3)' }} />
            <p style={{ fontSize: 'var(--text-sm)' }}>No knowledge entries yet. Add your first one above.</p>
          </div>
        ) : (
          items.map(item => (
            <div key={item._id} className="card" style={{ padding: 'var(--space-4) var(--space-5)' }}>
              {editing?._id === item._id ? (
                <>
                  <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-4)' }}>Edit Entry</h4>
                  <KnowledgeForm initial={{ ...item, tags: Array.isArray(item.tags) ? item.tags.join(', ') : '' }} onSave={handleEdit} onCancel={() => setEditing(null)} loading={editLoading} />
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--ink)' }}>{item.question}</span>
                      <span className="badge badge-info">{item.category}</span>
                    </div>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-muted)', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {item.answer}
                    </p>
                    {item.tags?.length > 0 && (
                      <div style={{ display: 'flex', gap: 'var(--space-1)', flexWrap: 'wrap', marginTop: 'var(--space-2)' }}>
                        {item.tags.map(tag => (
                          <span key={tag} className="badge badge-neutral" style={{ fontSize: '10px' }}>{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--space-2)', flexShrink: 0 }}>
                    <button onClick={() => setEditing(item)} style={{ background: 'none', color: 'var(--brand)', cursor: 'pointer', padding: '4px' }}>
                      <Edit2 size={15} />
                    </button>
                    <button onClick={() => { if (window.confirm('Delete this knowledge entry?')) deleteMut.mutate(item._id); }} style={{ background: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px' }}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
