import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { studentAPI } from '../../services/api';
import { Search, User, Filter } from 'lucide-react';

function StudentRow({ student }) {
  return (
    <tr style={{ borderBottom: '1px solid var(--line)' }}>
      <td style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div style={{
            width: '34px', height: '34px', borderRadius: '50%',
            background: 'var(--brand-muted)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            {student.profilePhoto
              ? <img src={student.profilePhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              : <User size={16} style={{ color: 'var(--brand)' }} />
            }
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--ink)' }}>{student.name}</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)' }}>{student.registrationNumber}</div>
          </div>
        </div>
      </td>
      <td style={{ padding: '12px 16px', fontSize: 'var(--text-sm)', color: 'var(--ink-muted)' }}>{student.department}</td>
      <td style={{ padding: '12px 16px', fontSize: 'var(--text-sm)', color: 'var(--ink-muted)' }}>Year {student.year} • {student.section}</td>
      <td style={{ padding: '12px 16px', fontSize: 'var(--text-sm)', color: 'var(--ink-muted)', textTransform: 'capitalize' }}>{student.hostelStatus?.replace('_', ' ')}</td>
      <td style={{ padding: '12px 16px' }}>
        <span className={`badge ${student.isActive !== false ? 'badge-success' : 'badge-neutral'}`}>
          {student.isActive !== false ? 'Active' : 'Inactive'}
        </span>
      </td>
    </tr>
  );
}

export default function AdminStudents() {
  const [search, setSearch] = useState('');
  const [dept, setDept] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-students', search, dept],
    queryFn: async () => {
      const params = {};
      if (search) params.search = search;
      if (dept) params.department = dept;
      const { data } = await studentAPI.list(params);
      return data.data;
    },
    staleTime: 30000,
  });

  const students = data?.students ?? data ?? [];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Students</h1>
        <p className="page-subtitle">Manage all enrolled students</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-5)', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={15} style={{
            position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
            color: 'var(--ink-faint)', pointerEvents: 'none'
          }} />
          <input
            className="input"
            style={{ paddingLeft: '36px' }}
            placeholder="Search by name or register number..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="select" style={{ width: 'auto', minWidth: '160px' }} value={dept} onChange={e => setDept(e.target.value)}>
          <option value="">All Departments</option>
          {['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'AIDS', 'CSBS'].map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: 'var(--space-6)' }}>
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="skeleton" style={{ height: '48px', marginBottom: 'var(--space-2)', borderRadius: 'var(--radius-md)' }} />
            ))}
          </div>
        ) : students.length === 0 ? (
          <div style={{ padding: 'var(--space-10)', textAlign: 'center', color: 'var(--ink-faint)' }}>
            <User size={32} style={{ margin: '0 auto var(--space-3)' }} />
            <p style={{ fontSize: 'var(--text-sm)' }}>No students found</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--surface-inset)' }}>
                  {['Student', 'Department', 'Year / Section', 'Hostel Status', 'Status'].map(h => (
                    <th key={h} style={{
                      padding: '10px 16px', textAlign: 'left',
                      fontSize: 'var(--text-xs)', fontWeight: 600,
                      color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '0.05em'
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map(s => <StudentRow key={s._id} student={s} />)}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div style={{ marginTop: 'var(--space-3)', fontSize: 'var(--text-xs)', color: 'var(--ink-faint)' }}>
        {students.length} students shown
      </div>
    </div>
  );
}
