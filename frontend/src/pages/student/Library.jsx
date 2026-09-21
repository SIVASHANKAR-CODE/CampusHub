import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { libraryAPI } from '../../services/api';
import { Search, BookOpen } from 'lucide-react';

export default function StudentLibrary() {
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');

  const { data: books, isLoading } = useQuery({
    queryKey: ['library-search', submitted],
    queryFn: async () => {
      if (submitted.length < 2) {
        const { data } = await libraryAPI.list({ limit: 20 });
        return data.data?.books || [];
      }
      const { data } = await libraryAPI.search(submitted);
      return data.data || [];
    },
  });

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Library</h1>
        <p className="page-subtitle">Search books by title, author, or subject</p>
      </div>

      <div className="search-bar-wrap">
        <Search size={16} className="search-icon-fixed" />
        <input
          className="input"
          style={{ paddingLeft: '40px', paddingRight: '80px' }}
          placeholder="Search by title, author, ISBN…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && setSubmitted(query)}
        />
        <button
          onClick={() => setSubmitted(query)}
          className="btn btn-primary btn-sm"
          style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)' }}
        >
          Search
        </button>
      </div>

      {isLoading && [...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: '72px', borderRadius: '12px', marginBottom: '8px' }} />)}

      {books?.map((book) => (
        <div key={book._id} className="card" style={{ marginBottom: '8px', padding: '16px', display: 'flex', gap: '16px' }}>
          <BookOpen size={20} style={{ color: 'var(--brand)', flexShrink: 0, marginTop: '2px' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600 }}>{book.title}</div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-muted)' }}>by {book.author}</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)', marginTop: '4px' }}>
              {book.subject && `${book.subject} • `}Shelf: {book.shelf || '—'} • ISBN: {book.isbn || '—'}
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <span className={`badge ${book.availableCopies > 0 ? 'badge-success' : 'badge-danger'}`}>
              {book.availableCopies > 0 ? `${book.availableCopies} available` : 'Not available'}
            </span>
          </div>
        </div>
      ))}

      {books?.length === 0 && !isLoading && (
        <div style={{ textAlign: 'center', padding: '32px', color: 'var(--ink-muted)' }}>No books found.</div>
      )}
    </div>
  );
}
