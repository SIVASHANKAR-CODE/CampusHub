import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { feesAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { CreditCard, X, CheckCircle, ShieldCheck } from 'lucide-react';

function FeeStatusBadge({ status }) {
  const map = { paid: 'badge-success', partial: 'badge-warning', pending: 'badge-danger', overdue: 'badge-danger' };
  return <span className={`badge ${map[status] || 'badge-neutral'}`}>{status}</span>;
}

export default function StudentFees() {
  const queryClient = useQueryClient();
  const [selectedFee, setSelectedFee] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('UPI');

  const { data, isLoading } = useQuery({
    queryKey: ['fees'],
    queryFn: async () => { const { data } = await feesAPI.my(); return data.data; },
  });

  const payMutation = useMutation({
    mutationFn: ({ id, amount, method }) => feesAPI.recordPayment(id, {
      amount: Number(amount),
      method,
      description: `Student self-settlement via ${method}`,
    }),
    onSuccess: () => {
      toast.success('Payment completed successfully!');
      queryClient.invalidateQueries({ queryKey: ['fees'] });
      setSelectedFee(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Payment could not be processed.');
    },
  });

  const openPayModal = (fee) => {
    setSelectedFee(fee);
    setPayAmount(fee.dueAmount);
  };

  const handlePaySubmit = (e) => {
    e.preventDefault();
    if (!payAmount || Number(payAmount) <= 0) {
      toast.error('Please specify a valid payment amount.');
      return;
    }
    payMutation.mutate({
      id: selectedFee._id,
      amount: payAmount,
      method: payMethod,
    });
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Fee Status</h1>
        <p className="page-subtitle">View and settle semester dues securely online</p>
      </div>

      {isLoading && (
        <div className="skeleton" style={{ height: '200px', borderRadius: '12px' }} />
      )}

      {data?.length === 0 && (
        <div className="card" style={{ textAlign: 'center', color: 'var(--ink-muted)', padding: '48px' }}>
          No fee records found. Contact your admin.
        </div>
      )}

      {data?.map((fee) => (
        <div key={fee._id} className="card" style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 'var(--text-lg)' }}>Semester {fee.semester}</div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-faint)' }}>{fee.academicYear}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <FeeStatusBadge status={fee.status} />
              {fee.dueAmount > 0 && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => openPayModal(fee)}
                  style={{ fontSize: 'var(--text-xs)', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <CreditCard size={14} /> Pay Dues (₹{fee.dueAmount?.toLocaleString()})
                </button>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
            {[
              { label: 'Total', value: fee.totalFee, color: 'var(--ink)' },
              { label: 'Paid', value: fee.paidAmount, color: 'var(--success)' },
              { label: 'Due', value: fee.dueAmount, color: fee.dueAmount > 0 ? 'var(--danger)' : 'var(--ink-faint)' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: 'var(--surface-inset)', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)', marginBottom: '4px' }}>{label}</div>
                <div style={{ fontWeight: 700, color, fontSize: 'var(--text-lg)' }}>₹{value?.toLocaleString()}</div>
              </div>
            ))}
          </div>

          {fee.dueDate && (
            <div style={{ fontSize: 'var(--text-xs)', color: fee.dueAmount > 0 ? 'var(--warning)' : 'var(--ink-faint)' }}>
              Due date: {new Date(fee.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          )}

          {fee.transactionHistory?.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', marginBottom: '8px' }}>Payment History</div>
              {fee.transactionHistory.map((t, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)', padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
                  <div>
                    <div style={{ fontWeight: 500 }}>{t.method}</div>
                    {t.referenceNo && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)' }}>Ref: {t.referenceNo}</div>}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 600, color: 'var(--success)' }}>+₹{t.amount?.toLocaleString()}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)' }}>{new Date(t.date).toLocaleDateString('en-IN')}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Pay Modal */}
      {selectedFee && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 200, padding: 'var(--space-4)'
        }}>
          <div style={{
            background: 'var(--surface-raised)', borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-modal)', width: '100%', maxWidth: '440px',
            overflow: 'hidden'
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: 'var(--space-4) var(--space-6)', borderBottom: '1px solid var(--line)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={20} style={{ color: 'var(--brand)' }} />
                <h3 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--ink)' }}>
                  Semester {selectedFee.semester} Fee Settlement
                </h3>
              </div>
              <button onClick={() => setSelectedFee(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-faint)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handlePaySubmit} style={{ padding: 'var(--space-6)' }}>
              <div style={{ background: 'var(--surface-inset)', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--ink-faint)' }}>Total Outstanding:</span>
                  <strong style={{ color: 'var(--danger)' }}>₹{selectedFee.dueAmount?.toLocaleString()}</strong>
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)' }}>
                  Academic Year: {selectedFee.academicYear}
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="label">Payment Amount (₹)</label>
                <input
                  type="number"
                  className="input"
                  min="1"
                  max={selectedFee.dueAmount}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="label">Payment Method</label>
                <select
                  className="select"
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                >
                  <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                  <option value="NetBanking">Net Banking</option>
                  <option value="Debit Card">Debit / Credit Card</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedFee(null)}
                  disabled={payMutation.isPending}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={payMutation.isPending}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {payMutation.isPending ? 'Processing...' : `Pay ₹${Number(payAmount || 0).toLocaleString()}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
