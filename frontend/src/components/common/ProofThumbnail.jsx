import { useState } from 'react';
import { Image as ImageIcon, AlertCircle } from 'lucide-react';
import { resolveFileUrl } from '../../utils/imageUrl';

export default function ProofThumbnail({
  imageUrl,
  title = 'Proof',
  ticketId = '',
  onView,
  size = 48,
  label = 'View Full Proof',
  badgeColor = 'var(--brand)',
}) {
  const [hasError, setHasError] = useState(false);
  const resolvedUrl = resolveFileUrl(imageUrl);

  if (!imageUrl) return null;

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
      <button
        type="button"
        onClick={() => onView({ imageUrl, title, ticketId })}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          textAlign: 'left',
          textDecoration: 'none',
        }}
      >
        {hasError ? (
          <div
            title="Proof image unavailable in cloud storage"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              borderRadius: '6px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px dashed rgba(239, 68, 68, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#f87171',
              flexShrink: 0,
            }}
          >
            <AlertCircle size={Math.max(14, Math.round(size * 0.4))} />
          </div>
        ) : (
          <img
            src={resolvedUrl}
            alt={title}
            loading="lazy"
            decoding="async"
            onError={() => setHasError(true)}
            style={{
              width: `${size}px`,
              height: `${size}px`,
              objectFit: 'cover',
              borderRadius: '6px',
              border: '1px solid var(--line, #334155)',
              background: 'var(--surface-inset, #0f172a)',
              flexShrink: 0,
            }}
          />
        )}

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span
            style={{
              fontSize: 'var(--text-xs, 12px)',
              color: hasError ? 'var(--ink-muted, #94a3b8)' : badgeColor,
              fontWeight: 600,
              textDecoration: 'underline',
            }}
          >
            {hasError ? 'Proof Details' : label}
          </span>
          {hasError && (
            <span style={{ fontSize: '10px', color: '#f87171' }}>
              Image unavailable
            </span>
          )}
        </div>
      </button>
    </div>
  );
}
