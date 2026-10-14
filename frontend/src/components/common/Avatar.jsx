import { useState, useEffect } from 'react';

/**
 * Reusable Avatar component for CampusHub.
 * Handles persistent image URLs (Cloudinary, /uploads/, Mongo storage),
 * loading errors, and initials fallback.
 */
export default function Avatar({
  src,
  name = '',
  size = 40,
  className = '',
  style = {},
  alt = '',
}) {
  const [hasError, setHasError] = useState(false);

  // Reset error status if the src URL changes
  useEffect(() => {
    setHasError(false);
  }, [src]);

  const initial = (name || '?').trim().charAt(0).toUpperCase();

  // Color generator based on name hash
  const colors = [
    { bg: '#e0e7ff', text: '#4338ca' }, // indigo
    { bg: '#dbeafe', text: '#1d4ed8' }, // blue
    { bg: '#ccfbf1', text: '#0f766e' }, // teal
    { bg: '#fef3c7', text: '#b45309' }, // amber
    { bg: '#fce7f3', text: '#be185d' }, // pink
    { bg: '#ede9fe', text: '#6d28d9' }, // purple
  ];
  const charCode = name ? name.charCodeAt(0) + (name.charCodeAt(name.length - 1) || 0) : 0;
  const colorScheme = colors[charCode % colors.length];

  const dimension = typeof size === 'number' ? `${size}px` : size;
  const fontSize = typeof size === 'number' ? `${Math.max(12, Math.floor(size * 0.42))}px` : '14px';

  return (
    <div
      className={`app-avatar ${className}`}
      style={{
        width: dimension,
        height: dimension,
        minWidth: dimension,
        minHeight: dimension,
        borderRadius: '50%',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: colorScheme.bg,
        color: colorScheme.text,
        fontWeight: 700,
        fontSize,
        userSelect: 'none',
        flexShrink: 0,
        ...style,
      }}
      title={name || alt}
    >
      {src && !hasError ? (
        <img
          src={src}
          alt={alt || name || 'Avatar'}
          loading="lazy"
          decoding="async"
          onError={() => setHasError(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />
      ) : (
        <span>{initial}</span>
      )}
    </div>
  );
}
