import { Link } from 'react-router-dom';
import { Home, ArrowLeft, GraduationCap } from 'lucide-react';

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--surface)', fontFamily: 'var(--font-sans)',
      padding: 'var(--space-8)', textAlign: 'center'
    }}>
      <div style={{
        background: 'var(--brand-muted)', borderRadius: '50%',
        width: '80px', height: '80px', display: 'flex',
        alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--space-6)'
      }}>
        <GraduationCap size={36} style={{ color: 'var(--brand)' }} />
      </div>
      <div style={{
        fontSize: '6rem', fontWeight: 800, color: 'var(--line-strong)',
        lineHeight: 1, marginBottom: 'var(--space-4)'
      }}>
        404
      </div>
      <h1 style={{
        fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--ink)',
        marginBottom: 'var(--space-2)'
      }}>
        Page not found
      </h1>
      <p style={{
        color: 'var(--ink-muted)', fontSize: 'var(--text-base)',
        maxWidth: '360px', marginBottom: 'var(--space-8)', lineHeight: 1.7
      }}>
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={() => window.history.back()}
          style={{
            display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
            padding: '10px 20px', borderRadius: 'var(--radius-md)',
            border: '1px solid var(--line-strong)', color: 'var(--ink-muted)',
            fontSize: 'var(--text-sm)', fontWeight: 500, cursor: 'pointer',
            background: 'var(--surface-raised)'
          }}
        >
          <ArrowLeft size={16} /> Go Back
        </button>
        <Link
          to="/"
          style={{
            display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
            padding: '10px 20px', borderRadius: 'var(--radius-md)',
            background: 'var(--brand)', color: '#fff',
            fontSize: 'var(--text-sm)', fontWeight: 600
          }}
        >
          <Home size={16} /> Home
        </Link>
      </div>
    </div>
  );
}
