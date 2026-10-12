import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentAPI, feesAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { Search, IndianRupee, Plus, ChevronDown, ChevronUp, X } from 'lucide-react';

const FEE_STATUS_BADGE = {
  paid:    'badge-success',
  partial: 'badge-warning',
  pending: 'badge-danger',
  overdue: 'badge-danger',
};

function FeeStatusBadge({ status }) {
  return <span className={`badge ${FEE_STATUS_BADGE[status] || 'badge-neutral'}`} style={{ textTransform: 'capitalize' }}>{status}</span>;
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 200, padding: 'var(--space-4)'
    }}>
      <div style={{
        background: 'var(--surface-raised)', borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-modal)', width: '100%', maxWidth: '520px',
        maxHeight: '90vh', overflowY: 'auto'
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: 'var(--space-5) var(--space-6)', borderBottom: '1px solid var(--line)'
        }}>
          <h2 style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--ink)' }}>{title}</h2>
          <button onClick={onClose} style={{ color: 'var(--ink-faint)', padding: '4px' }}><X size={20} /></button>
        </div>
        <div style={{ padding: 'var(--space-6)' }}>{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}

function FeeRecord({ fee, onRecordPayment }) {
  const [expanded, setExpanded] = useState(false);
  const totalPct = fee.totalFee > 0 ? Math.round((fee.paidAmount / fee.totalFee) * 100) : 0;

  return (
    <div style={{ border: '1px solid var(--line)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: 'var(--space-3)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-4) var(--space-5)', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: '4px' }}>
            <span style={{ fontWeight: 700, color: 'var(--ink)' }}>Semester {fee.semester}</span>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)' }}>{fee.academicYear}</span>
            <FeeStatusBadge status={fee.status} />
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-4)', fontSize: 'var(--text-sm)' }}>
            <span>Total: <strong>₹{fee.totalFee?.toLocaleString()}</strong></span>
            <span style={{ color: 'var(--success)' }}>Paid: ₹{fee.paidAmount?.toLocaleString()}</span>
            <span style={{ color: fee.dueAmount > 0 ? 'var(--danger)' : 'var(--ink-faint)' }}>Due: ₹{fee.dueAmount?.toLocaleString()}</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <button onClick={() => onRecordPayment(fee)} style={{
            padding: '5px 12px', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)',
            fontWeight: 600, background: 'var(--success)', color: '#fff'
          }}>+ Payment</button>
          <button onClick={() => setExpanded(e => !e)} style={{ color: 'var(--ink-faint)', padding: '4px' }}>
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: '4px', background: 'var(--line)', margin: '0 var(--space-5)' }}>
        <div style={{ height: '100%', width: `${totalPct}%`, background: fee.dueAmount === 0 ? 'var(--success)' : 'var(--warning)', borderRadius: '999px', transition: 'width 0.6s ease' }} />
      </div>

      {expanded && (
        <div style={{ padding: 'var(--space-4) var(--space-5)', borderTop: '1px solid var(--line)', background: 'var(--surface-inset)' }}>
          {/* Breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
            {[
              { label: 'Tuition', value: fee.tuitionFee },
              { label: 'Hostel', value: fee.hostelFee },
              { label: 'Transport', value: fee.transportFee },
              { label: 'Lab', value: fee.labFee },
              { label: 'Exam', value: fee.examFee },
              { label: 'Other', value: fee.otherFee },
            ].filter(f => f.value).map(({ label, value }) => (
              <div key={label} style={{ background: 'var(--surface-raised)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)' }}>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)' }}>{label}</div>
                <div style={{ fontWeight: 700, color: 'var(--ink)' }}>₹{value?.toLocaleString()}</div>
              </div>
            ))}
          </div>
          {/* Transaction history */}
          {fee.transactionHistory?.length > 0 && (
            <>
              <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', marginBottom: 'var(--space-2)' }}>Payment History</div>
              {fee.transactionHistory.map((t, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--line)' }}>
                  <div>
                    <div style={{ fontWeight: 500 }}>{t.method}</div>
                    {t.referenceNo && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)' }}>Ref: {t.referenceNo}</div>}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, color: 'var(--success)' }}>+₹{t.amount?.toLocaleString()}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)' }}>{t.date ? new Date(t.date).toLocaleDateString('en-IN') : '—'}</div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

const EMPTY_FEE_FORM = {
  semester: 1, academicYear: '2025-2026',
  tuitionFee: '', hostelFee: '', transportFee: '', labFee: '', examFee: '', otherFee: '',
  dueDate: '',
};
const EMPTY_PAYMENT = { amount: '', referenceNo: '', method: 'cash', date: new Date().toISOString().split('T')[0], description: '' };

export default function AdminFees() {
  const qc = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showFeeForm, setShowFeeForm] = useState(false);
  const [feeForm, setFeeForm] = useState(EMPTY_FEE_FORM);
  const [paymentModal, setPaymentModal] = useState(null); // fee record
  const [paymentForm, setPaymentForm] = useState(EMPTY_PAYMENT);

  // Debounced search
  const { data: searchResults = [], isLoading: searching } = useQuery({
    queryKey: ['student-search-fees', searchQuery],
    queryFn: async () => {
      if (searchQuery.length < 2) return [];
      const { data } = await studentAPI.search(searchQuery);
      return data.data || [];
    },
    enabled: searchQuery.length >= 2,
    staleTime: 10000,
  });

  // Load fees for selected student
  const { data: fees = [], isLoading: feesLoading } = useQuery({
    queryKey: ['student-fees', selectedStudent?._id],
    queryFn: async () => {
      const { data } = await feesAPI.byStudent(selectedStudent._id);
      return data.data || [];
    },
    enabled: !!selectedStudent,
    staleTime: 15000,
  });

  const createFeeMut = useMutation({
    mutationFn: (payload) => feesAPI.create(payload),
    onSuccess: () => {
      toast.success('Fee record saved');
      qc.invalidateQueries({ queryKey: ['student-fees'] });
      setShowFeeForm(false);
      setFeeForm(EMPTY_FEE_FORM);
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to save fee record'),
  });

  const paymentMut = useMutation({
    mutationFn: ({ id, data }) => feesAPI.recordPayment(id, data),
    onSuccess: () => {
      toast.success('Payment recorded');
      qc.invalidateQueries({ queryKey: ['student-fees'] });
      setPaymentModal(null);
      setPaymentForm(EMPTY_PAYMENT);
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to record payment'),
  });

  const totalDue = fees.reduce((s, f) => s + (f.dueAmount || 0), 0);
  const totalPaid = fees.reduce((s, f) => s + (f.paidAmount || 0), 0);

  const handleFeeSubmit = (e) => {
    e.preventDefault();
    createFeeMut.mutate({
      studentId: selectedStudent._id,
      ...feeForm,
      semester: parseInt(feeForm.semester),
      tuitionFee: parseFloat(feeForm.tuitionFee) || 0,
      hostelFee: parseFloat(feeForm.hostelFee) || 0,
      transportFee: parseFloat(feeForm.transportFee) || 0,
      labFee: parseFloat(feeForm.labFee) || 0,
      examFee: parseFloat(feeForm.examFee) || 0,
      otherFee: parseFloat(feeForm.otherFee) || 0,
    });
  };

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    paymentMut.mutate({
      id: paymentModal._id,
      data: { ...paymentForm, amount: parseFloat(paymentForm.amount) },
    });
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Fee Management</h1>
        <p className="page-subtitle">Search a student to view and manage their fee records</p>
      </div>

      {/* Student Search */}
      <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-faint)' }} />
          <input
            className="input" style={{ paddingLeft: '40px' }}
            placeholder="Search student by name or registration number…"
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); if (selectedStudent) setSelectedStudent(null); }}
          />
        </div>

        {searchQuery.length >= 2 && !selectedStudent && (
          <div style={{ marginTop: 'var(--space-2)', border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            {searching && <div style={{ padding: 'var(--space-4)', color: 'var(--ink-faint)', fontSize: 'var(--text-sm)', textAlign: 'center' }}>Searching…</div>}
            {!searching && searchResults.length === 0 && (
              <div style={{ padding: 'var(--space-4)', color: 'var(--ink-faint)', fontSize: 'var(--text-sm)', textAlign: 'center' }}>No students found</div>
            )}
            {searchResults.map(s => (
              <button key={s._id} onClick={() => { setSelectedStudent(s); setSearchQuery(s.name); }} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                width: '100%', padding: 'var(--space-3) var(--space-4)',
                textAlign: 'left', borderBottom: '1px solid var(--line)',
                background: 'var(--surface-raised)', transition: 'background var(--transition-fast)'
              }}>
                <div>
                  <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--ink)' }}>{s.name}</span>
                  <span style={{ marginLeft: 'var(--space-3)', fontSize: 'var(--text-xs)', color: 'var(--ink-faint)', fontFamily: 'monospace', fontWeight: 600 }}>{s.regNo || s.registrationNumber}</span>
                </div>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-muted)' }}>{s.department} • Year {s.year} • Sec {s.section}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Student Selected State */}
      {selectedStudent && (
        <>
          {/* Student Info Bar */}
          <div className="card" style={{ marginBottom: 'var(--space-5)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '50%',
                background: 'var(--brand)', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 'var(--text-xl)', fontWeight: 700, flexShrink: 0
              }}>
                {selectedStudent.name.charAt(0)}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 700, fontSize: 'var(--text-lg)', color: 'var(--ink)' }}>{selectedStudent.name}</span>
                  <span className="badge badge-info" style={{ fontSize: '0.75rem' }}>{selectedStudent.regNo || selectedStudent.registrationNumber}</span>
                </div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-muted)' }}>
                  {selectedStudent.department} • Year {selectedStudent.year} • Sec {selectedStudent.section}
                </div>
              </div>
            </div>
            {!feesLoading && (
              <div style={{ display: 'flex', gap: 'var(--space-6)' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 700, fontSize: 'var(--text-xl)', color: 'var(--success)' }}>₹{totalPaid.toLocaleString()}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)' }}>Total Paid</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 700, fontSize: 'var(--text-xl)', color: totalDue > 0 ? 'var(--danger)' : 'var(--ink-faint)' }}>₹{totalDue.toLocaleString()}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)' }}>Total Due</div>
                </div>
              </div>
            )}
          </div>

          {/* Fee Records Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            <h2 className="section-title" style={{ margin: 0 }}>Fee Records ({fees.length})</h2>
            <button onClick={() => setShowFeeForm(true)} style={{
              display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
              background: 'var(--brand)', color: '#fff', padding: 'var(--space-2) var(--space-4)',
              borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: 'var(--text-sm)'
            }}>
              <Plus size={16} /> Create Fee Record
            </button>
          </div>

          {feesLoading && [1, 2].map(i => <div key={i} className="skeleton" style={{ height: '90px', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-3)' }} />)}

          {!feesLoading && fees.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--ink-faint)' }}>
              <IndianRupee size={40} style={{ margin: '0 auto var(--space-3)', opacity: 0.4 }} />
              <p>No fee records for this student. Click "Create Fee Record" to add one.</p>
            </div>
          )}

          {fees.map(fee => (
            <FeeRecord key={fee._id} fee={fee} onRecordPayment={(f) => { setPaymentModal(f); setPaymentForm(EMPTY_PAYMENT); }} />
          ))}
        </>
      )}

      {/* Create Fee Record Modal */}
      {showFeeForm && (
        <Modal title={`Create Fee Record — ${selectedStudent?.name}`} onClose={() => { setShowFeeForm(false); setFeeForm(EMPTY_FEE_FORM); }}>
          <form onSubmit={handleFeeSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <Field label="Semester *">
                <select className="select" value={feeForm.semester} onChange={e => setFeeForm({ ...feeForm, semester: e.target.value })}>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                </select>
              </Field>
              <Field label="Academic Year">
                <input className="input" value={feeForm.academicYear} onChange={e => setFeeForm({ ...feeForm, academicYear: e.target.value })} placeholder="e.g. 2025-2026" />
              </Field>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)' }}>
              {[
                { key: 'tuitionFee', label: 'Tuition Fee' },
                { key: 'hostelFee', label: 'Hostel Fee' },
                { key: 'transportFee', label: 'Transport Fee' },
                { key: 'labFee', label: 'Lab Fee' },
                { key: 'examFee', label: 'Exam Fee' },
                { key: 'otherFee', label: 'Other Fee' },
              ].map(({ key, label }) => (
                <div key={key} className="form-group" style={{ marginBottom: 'var(--space-3)' }}>
                  <label className="label">{label}</label>
                  <input className="input" type="number" min="0" value={feeForm[key]} onChange={e => setFeeForm({ ...feeForm, [key]: e.target.value })} placeholder="₹ 0" />
                </div>
              ))}
            </div>
            <Field label="Due Date">
              <input className="input" type="date" value={feeForm.dueDate} onChange={e => setFeeForm({ ...feeForm, dueDate: e.target.value })} />
            </Field>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
              <button type="button" onClick={() => { setShowFeeForm(false); setFeeForm(EMPTY_FEE_FORM); }} style={{
                padding: 'var(--space-2) var(--space-5)', borderRadius: 'var(--radius-md)',
                border: '1px solid var(--line)', color: 'var(--ink-muted)', fontWeight: 600
              }}>Cancel</button>
              <button type="submit" disabled={createFeeMut.isPending} style={{
                padding: 'var(--space-2) var(--space-5)', borderRadius: 'var(--radius-md)',
                background: 'var(--brand)', color: '#fff', fontWeight: 600,
                opacity: createFeeMut.isPending ? 0.7 : 1
              }}>{createFeeMut.isPending ? 'Saving…' : 'Create Record'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Record Payment Modal */}
      {paymentModal && (
        <Modal title={`Record Payment — Semester ${paymentModal.semester}`} onClose={() => { setPaymentModal(null); setPaymentForm(EMPTY_PAYMENT); }}>
          <div style={{ background: 'var(--surface-inset)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)', marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)' }}>
            <span>Due: </span><strong style={{ color: 'var(--danger)' }}>₹{paymentModal.dueAmount?.toLocaleString()}</strong>
            <span style={{ marginLeft: 'var(--space-4)' }}>Paid so far: </span><strong style={{ color: 'var(--success)' }}>₹{paymentModal.paidAmount?.toLocaleString()}</strong>
          </div>
          <form onSubmit={handlePaymentSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <Field label="Amount (₹) *">
                <input className="input" type="number" min="1" required value={paymentForm.amount} onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })} placeholder="Enter amount" />
              </Field>
              <Field label="Method *">
                <select className="select" value={paymentForm.method} onChange={e => setPaymentForm({ ...paymentForm, method: e.target.value })}>
                  {['cash', 'online', 'bank_transfer', 'cheque', 'dd'].map(m => <option key={m} value={m} style={{ textTransform: 'capitalize' }}>{m.replace('_', ' ')}</option>)}
                </select>
              </Field>
              <Field label="Reference No.">
                <input className="input" value={paymentForm.referenceNo} onChange={e => setPaymentForm({ ...paymentForm, referenceNo: e.target.value })} placeholder="Transaction / receipt no." />
              </Field>
              <Field label="Payment Date">
                <input className="input" type="date" value={paymentForm.date} onChange={e => setPaymentForm({ ...paymentForm, date: e.target.value })} />
              </Field>
            </div>
            <Field label="Notes">
              <input className="input" value={paymentForm.description} onChange={e => setPaymentForm({ ...paymentForm, description: e.target.value })} placeholder="Optional notes" />
            </Field>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
              <button type="button" onClick={() => { setPaymentModal(null); setPaymentForm(EMPTY_PAYMENT); }} style={{
                padding: 'var(--space-2) var(--space-5)', borderRadius: 'var(--radius-md)',
                border: '1px solid var(--line)', color: 'var(--ink-muted)', fontWeight: 600
              }}>Cancel</button>
              <button type="submit" disabled={paymentMut.isPending} style={{
                padding: 'var(--space-2) var(--space-5)', borderRadius: 'var(--radius-md)',
                background: 'var(--success)', color: '#fff', fontWeight: 600,
                opacity: paymentMut.isPending ? 0.7 : 1
              }}>{paymentMut.isPending ? 'Saving…' : 'Record Payment'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
