import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { libraryAPI } from '../../services/api';
import { Search, BookOpen } from 'lucide-react';
import { useDebounce } from '../../utils/useDebounce';

export default function StudentLibrary() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 350);

  const { data: books, isLoading } = useQuery({
    queryKey: ['library-search', debouncedQuery],
    queryFn: async () => {
      if (debouncedQuery.trim().length < 2) {
        const { data } = await libraryAPI.list({ limit: 20 });
        return data.data?.books || [];
      }
      const { data } = await libraryAPI.search(debouncedQuery.trim());
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
          style={{ paddingLeft: '40px' }}
          placeholder="Search by title, author, ISBN…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>

      {isLoading && [...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: '72px', borderRadius: '12px', marginBottom: '8px' }} />)}

      {books?.map((book) => (
        <div key={book._id} className="card" style={{ marginBottom: '8px', padding: '14px 16px', display: 'flex', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <BookOpen size={20} style={{ color: 'var(--brand)', flexShrink: 0, marginTop: '2px' }} />
          <div style={{ flex: '1 1 180px', minWidth: 0 }}>
            <div style={{ fontWeight: 600, wordBreak: 'break-word' }}>{book.title}</div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-muted)', wordBreak: 'break-word' }}>by {book.author}</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)', marginTop: '4px', wordBreak: 'break-word' }}>
              {book.subject && `${book.subject} • `}Shelf: {book.shelf || '—'} • ISBN: {book.isbn || '—'}
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 'auto' }}>
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
