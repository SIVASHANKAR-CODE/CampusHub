import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '../../services/api';
import { FileText, Search, Filter } from 'lucide-react';

const ACTION_COLORS = {
  create: 'badge-success',
  update: 'badge-info',
  delete: 'badge-danger',
  login: 'badge-neutral',
  logout: 'badge-neutral',
  approve: 'badge-success',
  reject: 'badge-danger',
};

export default function AdminAuditLogs() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-audit-logs', page],
    queryFn: async () => {
      const { data } = await adminAPI.auditLogs({ page, limit: 30 });
      return data.data;
    },
    staleTime: 15000,
  });

  const logs = data?.logs ?? data ?? [];
  const total = data?.total ?? logs.length;
  const totalPages = data?.totalPages ?? 1;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Audit Logs</h1>
        <p className="page-subtitle">Track all system actions and changes for accountability</p>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: 'var(--space-6)' }}>
            {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton" style={{ height: '44px', marginBottom: 'var(--space-2)', borderRadius: 'var(--radius-md)' }} />)}
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding: 'var(--space-10)', textAlign: 'center', color: 'var(--ink-faint)' }}>
            <FileText size={36} style={{ margin: '0 auto var(--space-3)' }} />
            <p style={{ fontSize: 'var(--text-sm)' }}>No audit logs found</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--surface-inset)' }}>
                  {['Timestamp', 'User', 'Role', 'Action', 'Entity', 'Details'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <tr key={log._id || i} style={{ borderBottom: '1px solid var(--line)' }}>
                    <td style={{ padding: '10px 16px', fontSize: 'var(--text-xs)', color: 'var(--ink-faint)', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
                      {log.createdAt ? new Date(log.createdAt).toLocaleString('en-IN', { hour12: false }) : '—'}
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: 'var(--text-sm)', fontWeight: 500 }}>
                      {log.user?.name ?? log.userId ?? '—'}
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <span className="badge badge-neutral" style={{ textTransform: 'capitalize', fontSize: '11px' }}>
                        {log.user?.role ?? log.role ?? '—'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <span className={`badge ${ACTION_COLORS[log.action?.toLowerCase()] || 'badge-neutral'}`} style={{ textTransform: 'capitalize', fontSize: '11px' }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: 'var(--text-sm)', color: 'var(--ink-muted)' }}>
                      {log.entity || log.module || '—'}
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: 'var(--text-xs)', color: 'var(--ink-faint)', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {log.details || log.description || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 'var(--space-3)', marginTop: 'var(--space-5)' }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              padding: '6px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--line)',
              color: page === 1 ? 'var(--ink-faint)' : 'var(--ink)', cursor: page === 1 ? 'not-allowed' : 'pointer',
              fontSize: 'var(--text-sm)', fontWeight: 500, background: 'var(--surface-raised)'
            }}
          >
            Previous
          </button>
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-muted)' }}>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{
              padding: '6px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--line)',
              color: page === totalPages ? 'var(--ink-faint)' : 'var(--ink)', cursor: page === totalPages ? 'not-allowed' : 'pointer',
              fontSize: 'var(--text-sm)', fontWeight: 500, background: 'var(--surface-raised)'
            }}
          >
            Next
          </button>
        </div>
      )}

      <div style={{ marginTop: 'var(--space-3)', fontSize: 'var(--text-xs)', color: 'var(--ink-faint)' }}>
        {total} total log entries
      </div>
    </div>
  );
}
