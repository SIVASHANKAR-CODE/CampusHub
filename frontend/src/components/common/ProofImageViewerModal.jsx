import { useState, useEffect } from 'react';
import { X, ExternalLink, AlertTriangle, Image as ImageIcon, Loader2 } from 'lucide-react';
import { resolveFileUrl } from '../../utils/imageUrl';

export default function ProofImageViewerModal({
  isOpen,
  onClose,
  imageUrl,
  title = 'Proof Image',
  ticketId = '',
  subtitle = '',
  badge = '',
}) {
  const [loadStatus, setLoadStatus] = useState('loading'); // 'loading' | 'success' | 'error'

  const resolvedUrl = resolveFileUrl(imageUrl);

  // Reset load status when URL or isOpen changes
  useEffect(() => {
    if (isOpen) {
      setLoadStatus('loading');
    }
  }, [isOpen, resolvedUrl]);

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !imageUrl) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.15s ease-out',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--surface, #1e293b)',
          color: 'var(--ink, #f8fafc)',
          border: '1px solid var(--line, #334155)',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          maxWidth: '720px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid var(--line, #334155)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, fontSize: '15px' }}>{title}</span>
              {ticketId && (
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    background: 'rgba(59, 130, 246, 0.15)',
                    color: 'var(--brand, #3b82f6)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                  }}
                >
                  {ticketId}
                </span>
              )}
              {badge && (
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    background: 'rgba(34, 197, 94, 0.15)',
                    color: '#4ade80',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                  }}
                >
                  {badge}
                </span>
              )}
            </div>
            {subtitle && (
              <div
                style={{
                  fontSize: '12px',
                  color: 'var(--ink-muted, #94a3b8)',
                  marginTop: '2px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {subtitle}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <a
              href={resolvedUrl}
              target="_blank"
              rel="noreferrer"
              title="Open raw image in new tab"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 10px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.06)',
                color: 'var(--ink, #f8fafc)',
                fontSize: '12px',
                textDecoration: 'none',
                fontWeight: 500,
                border: '1px solid var(--line, #334155)',
              }}
            >
              <ExternalLink size={13} />
              <span className="hide-on-tiny-screen">New Tab</span>
            </a>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close image preview"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                border: 'none',
                background: 'rgba(255, 255, 255, 0.08)',
                color: 'var(--ink, #f8fafc)',
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Image Content Area */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            background: 'var(--surface-inset, #0f172a)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '260px',
            position: 'relative',
          }}
        >
          {loadStatus === 'loading' && (
            <div
              style={{
                position: 'absolute',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px',
                color: 'var(--ink-muted, #94a3b8)',
                fontSize: '13px',
              }}
            >
              <Loader2 size={24} className="spin-animate" />
              <span>Loading proof image...</span>
            </div>
          )}

          {loadStatus === 'error' ? (
            <div
              style={{
                padding: '24px',
                textAlign: 'center',
                maxWidth: '420px',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '12px',
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '999px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  color: '#f87171',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px',
                }}
              >
                <AlertTriangle size={22} />
              </div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 6px', color: '#f87171' }}>
                Proof Image Unavailable
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--ink-muted, #94a3b8)', margin: '0 0 16px', lineHeight: 1.5 }}>
                This file was uploaded prior to persistent cloud storage integration and is no longer available in serverless storage.
                The ticket record and status remain fully verified and preserved in CampusHub.
              </p>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '8px 16px',
                  fontSize: '12px',
                  fontWeight: 600,
                  borderRadius: '8px',
                  border: '1px solid var(--line, #334155)',
                  background: 'var(--surface, #1e293b)',
                  color: 'var(--ink, #f8fafc)',
                  cursor: 'pointer',
                }}
              >
                Close Preview
              </button>
            </div>
          ) : (
            <img
              src={resolvedUrl}
              alt={title}
              onLoad={() => setLoadStatus('success')}
              onError={() => setLoadStatus('error')}
              style={{
                maxWidth: '100%',
                maxHeight: '65vh',
                objectFit: 'contain',
                borderRadius: '8px',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
                display: loadStatus === 'loading' ? 'none' : 'block',
              }}
            />
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 18px',
            borderTop: '1px solid var(--line, #334155)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '12px',
            color: 'var(--ink-muted, #94a3b8)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ImageIcon size={14} />
            <span>CampusHub Verified Storage</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: '1px solid var(--line, #334155)',
              background: 'transparent',
              color: 'var(--ink, #f8fafc)',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
