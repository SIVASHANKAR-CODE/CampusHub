import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { libraryAPI } from '../../services/api';
import { BookOpen, Plus, Search, Edit2, X } from 'lucide-react';

function AddBookModal({ onClose }) {
  const [form, setForm] = useState({
    title: '', author: '', isbn: '', bookId: '', shelf: '',
    totalCopies: '', availableCopies: '', department: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const qc = useQueryClient();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await libraryAPI.add({
        ...form,
        totalCopies: Number(form.totalCopies),
        availableCopies: Number(form.availableCopies)
      });
      qc.invalidateQueries({ queryKey: ['admin-library'] });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add book');
    } finally { setLoading(false); }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 'var(--space-4)', overflowY: 'auto' }}>
      <div className="card" style={{ width: '100%', maxWidth: '520px', boxShadow: 'var(--shadow-modal)', margin: 'auto' }}>
        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-5)' }}>Add Book</h3>
        {error && <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)', marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)' }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
            <label className="label">Book Title *</label>
            <input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Full book title" required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="label">Author *</label>
              <input className="input" value={form.author} onChange={e => setForm(f => ({ ...f, author: e.target.value }))} placeholder="Author name" required />
            </div>
            <div className="form-group">
              <label className="label">ISBN</label>
              <input className="input" value={form.isbn} onChange={e => setForm(f => ({ ...f, isbn: e.target.value }))} placeholder="978-0-xxx" />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="label">Book ID</label>
              <input className="input" value={form.bookId} onChange={e => setForm(f => ({ ...f, bookId: e.target.value }))} placeholder="LIB-001" />
            </div>
            <div className="form-group">
              <label className="label">Shelf *</label>
              <input className="input" value={form.shelf} onChange={e => setForm(f => ({ ...f, shelf: e.target.value }))} placeholder="C-12" required />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="label">Total Copies *</label>
              <input className="input" type="number" min="1" value={form.totalCopies} onChange={e => setForm(f => ({ ...f, totalCopies: e.target.value }))} placeholder="5" required />
            </div>
            <div className="form-group">
              <label className="label">Available Copies *</label>
              <input className="input" type="number" min="0" value={form.availableCopies} onChange={e => setForm(f => ({ ...f, availableCopies: e.target.value }))} placeholder="5" required />
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: 'var(--space-5)' }}>
            <label className="label">Department</label>
            <input className="input" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} placeholder="e.g. CSE, General" />
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--line)', color: 'var(--ink-muted)', fontWeight: 500, fontSize: 'var(--text-sm)' }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ padding: '10px 24px', borderRadius: 'var(--radius-md)', background: 'var(--brand)', color: '#fff', fontWeight: 600, fontSize: 'var(--text-sm)', opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Adding...' : 'Add Book'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminLibrary() {
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-library', search],
    queryFn: async () => {
      const { data } = search ? await libraryAPI.search(search) : await libraryAPI.list();
      return data.data;
    },
    staleTime: 30000,
  });

  const books = data?.books ?? data ?? [];

  return (
    <div>
      {showAdd && <AddBookModal onClose={() => setShowAdd(false)} />}

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 className="page-title">Library Management</h1>
          <p className="page-subtitle">Manage books, copies and availability</p>
        </div>
        <button onClick={() => setShowAdd(true)} style={{
          display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
          padding: '10px 20px', background: 'var(--brand)', color: '#fff',
          borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: 'var(--text-sm)'
        }}>
          <Plus size={16} /> Add Book
        </button>
      </div>

      <div style={{ position: 'relative', marginBottom: 'var(--space-5)' }}>
        <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-faint)', pointerEvents: 'none' }} />
        <input className="input" style={{ paddingLeft: '36px' }} placeholder="Search books by title, author or ISBN..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: 'var(--space-6)' }}>
            {[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: '48px', marginBottom: 'var(--space-2)', borderRadius: 'var(--radius-md)' }} />)}
          </div>
        ) : books.length === 0 ? (
          <div style={{ padding: 'var(--space-10)', textAlign: 'center', color: 'var(--ink-faint)' }}>
            <BookOpen size={36} style={{ margin: '0 auto var(--space-3)' }} />
            <p style={{ fontSize: 'var(--text-sm)' }}>{search ? 'No books found matching your search' : 'No books in the library yet'}</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--surface-inset)' }}>
                  {['Title', 'Author', 'ISBN', 'Shelf', 'Available', 'Total', 'Status'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {books.map(book => (
                  <tr key={book._id} style={{ borderBottom: '1px solid var(--line)' }}>
                    <td style={{ padding: '12px 16px', fontSize: 'var(--text-sm)', fontWeight: 600, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{book.title}</td>
                    <td style={{ padding: '12px 16px', fontSize: 'var(--text-sm)', color: 'var(--ink-muted)' }}>{book.author}</td>
                    <td style={{ padding: '12px 16px', fontSize: 'var(--text-xs)', color: 'var(--ink-faint)', fontFamily: 'monospace' }}>{book.isbn || '—'}</td>
                    <td style={{ padding: '12px 16px', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--brand)' }}>{book.shelf}</td>
                    <td style={{ padding: '12px 16px', fontSize: 'var(--text-sm)', fontWeight: 700, color: book.availableCopies > 0 ? 'var(--success)' : 'var(--danger)' }}>{book.availableCopies}</td>
                    <td style={{ padding: '12px 16px', fontSize: 'var(--text-sm)', color: 'var(--ink-muted)' }}>{book.totalCopies}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className={`badge ${book.availableCopies > 0 ? 'badge-success' : 'badge-danger'}`}>
                        {book.availableCopies > 0 ? 'Available' : 'All Issued'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div style={{ marginTop: 'var(--space-3)', fontSize: 'var(--text-xs)', color: 'var(--ink-faint)' }}>
        {books.length} books shown
      </div>
    </div>
  );
}
