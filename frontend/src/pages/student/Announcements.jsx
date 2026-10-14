import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { announcementsAPI } from '../../services/api';
import { Megaphone, Pin } from 'lucide-react';

function PriorityBar({ priority }) {
  const map = { urgent: 'var(--danger)', high: 'var(--warning)', normal: 'var(--brand)', low: 'var(--ink-faint)' };
  return <div style={{ width: '4px', borderRadius: '2px', background: map[priority] || 'var(--line)', alignSelf: 'stretch', flexShrink: 0 }} />;
}

export default function StudentAnnouncements() {
  const [category, setCategory] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['announcements', category],
    queryFn: async () => { const { data } = await announcementsAPI.list({ category: category || undefined }); return data.data?.announcements || []; },
  });

  const CATS = ['', 'academic', 'exam', 'fee', 'transport', 'hostel', 'event', 'holiday', 'emergency', 'placement', 'general'];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Announcements</h1>
        <p className="page-subtitle">Important notices from college management</p>
      </div>

      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', marginBottom: '8px', paddingBottom: '4px' }}>
        {CATS.map(c => (
          <button key={c} onClick={() => setCategory(c)} style={{
            padding: '6px 14px', borderRadius: '999px', whiteSpace: 'nowrap', fontSize: 'var(--text-xs)', fontWeight: 600,
            textTransform: 'capitalize', background: category === c ? 'var(--brand)' : 'var(--surface-raised)',
            color: category === c ? '#fff' : 'var(--ink-muted)',
            border: `1px solid ${category === c ? 'var(--brand)' : 'var(--line)'}`,
            cursor: 'pointer',
          }}>{c || 'All'}</button>
        ))}
      </div>

      {isLoading && [...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: '80px', borderRadius: '12px', marginBottom: '8px' }} />)}

      {data?.map((ann) => (
        <div key={ann._id} style={{ display: 'flex', gap: '12px', background: 'var(--surface-raised)', border: '1px solid var(--line)', borderRadius: '12px', padding: '16px', alignItems: 'flex-start' }}>
          <PriorityBar priority={ann.priority} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              {ann.isPinned && <Pin size={14} style={{ color: 'var(--brand)' }} />}
              <span style={{ fontWeight: 700, fontSize: 'var(--text-base)' }}>{ann.title}</span>
              {ann.priority === 'urgent' && <span className="badge badge-danger">Urgent</span>}
              {ann.priority === 'high' && <span className="badge badge-warning">Important</span>}
            </div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-muted)', marginBottom: '8px', lineHeight: 1.6 }}>{ann.body}</div>
            <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--ink-faint)' }}>
              <span style={{ textTransform: 'capitalize' }}>{ann.category}</span>
              <span>•</span>
              <span>{new Date(ann.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
            {ann.attachmentUrl && (
              <a href={ann.attachmentUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: '8px', fontSize: 'var(--text-xs)', color: 'var(--brand)', fontWeight: 500 }}>
                📎 {ann.attachmentName || 'View attachment'}
              </a>
            )}
          </div>
        </div>
      ))}

      {data?.length === 0 && !isLoading && (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--ink-muted)' }}>
          <Megaphone size={36} style={{ color: 'var(--ink-faint)', margin: '0 auto 12px' }} />
          <div style={{ fontWeight: 600 }}>No announcements at this time.</div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)', marginTop: '4px' }}>Check back later for college updates.</div>
        </div>
      )}
    </div>
  );
}

