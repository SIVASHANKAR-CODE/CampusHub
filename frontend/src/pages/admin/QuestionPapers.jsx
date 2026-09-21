import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { questionPapersAPI } from '../../services/api';
import { FileText, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';

const initialForm = { department: 'CSE', subject: '', subjectCode: '', semester: '3', year: String(new Date().getFullYear()), academicYear: '', examType: 'semester' };

function AddQuestionPaper({ onClose }) {
  const [form, setForm] = useState(initialForm);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const qc = useQueryClient();

  async function submit(event) {
    event.preventDefault();
    if (!file) return toast.error('Please choose a PDF question paper.');
    if (file.size > 10 * 1024 * 1024) return toast.error('PDF must be under 10MB.');
    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => data.append(key, value));
    data.append('file', file);
    setLoading(true);
    try {
      await questionPapersAPI.add(data);
      toast.success('Question paper added successfully.');
      qc.invalidateQueries({ queryKey: ['admin-question-papers'] });
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to add question paper.');
    } finally { setLoading(false); }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-4)', background: 'rgba(0,0,0,.5)' }}>
      <div className="card" style={{ width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>Add Question Paper</h2>
          <button type="button" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="form-group"><label className="label">Subject *</label><input className="input" required value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="Data Structures & Algorithms" /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <div className="form-group"><label className="label">Subject Code</label><input className="input" value={form.subjectCode} onChange={e => setForm({ ...form, subjectCode: e.target.value })} placeholder="CS3301" /></div>
            <div className="form-group"><label className="label">Department *</label><input className="input" required value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)' }}>
            <div className="form-group"><label className="label">Semester *</label><input className="input" type="number" min="1" max="12" required value={form.semester} onChange={e => setForm({ ...form, semester: e.target.value })} /></div>
            <div className="form-group"><label className="label">Exam Year *</label><input className="input" type="number" min="2000" max="2100" required value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} /></div>
            <div className="form-group"><label className="label">Exam Type *</label><select className="select" value={form.examType} onChange={e => setForm({ ...form, examType: e.target.value })}><option value="internal">Internal</option><option value="model">Model</option><option value="semester">Semester</option><option value="practical">Practical</option></select></div>
          </div>
          <div className="form-group"><label className="label">Academic Year *</label><input className="input" required value={form.academicYear} onChange={e => setForm({ ...form, academicYear: e.target.value })} placeholder="2025-2026" /></div>
          <div className="form-group"><label className="label">PDF File * (maximum 10MB)</label><input className="input" type="file" accept="application/pdf,.pdf" required onChange={e => setFile(e.target.files?.[0] || null)} /></div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}><button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button><button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Uploading...' : 'Add Question Paper'}</button></div>
        </form>
      </div>
    </div>
  );
}

export default function AdminQuestionPapers() {
  const [showAdd, setShowAdd] = useState(false);
  const { data = [], isLoading } = useQuery({
    queryKey: ['admin-question-papers'],
    queryFn: async () => { const { data } = await questionPapersAPI.list(); return data.data?.papers || []; },
  });

  return (
    <div>
      {showAdd && <AddQuestionPaper onClose={() => setShowAdd(false)} />}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '12px' }}>
        <div><h1 className="page-title">Question Papers</h1><p className="page-subtitle">Upload and manage papers available to students</p></div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}><Plus size={16} /> Add Question Paper</button>
      </div>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {isLoading ? <div style={{ padding: 'var(--space-6)' }}>Loading question papers...</div> : data.length === 0 ? <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>No question papers uploaded.</div> : (
          <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse' }}><thead><tr style={{ background: 'var(--surface-inset)' }}>{['Subject', 'Code', 'Semester', 'Year', 'Type', 'File'].map(label => <th key={label} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 'var(--text-xs)', color: 'var(--ink-faint)' }}>{label}</th>)}</tr></thead><tbody>{data.map(paper => <tr key={paper._id} style={{ borderBottom: '1px solid var(--line)' }}><td style={{ padding: '12px 16px', fontWeight: 600 }}>{paper.subject}</td><td style={{ padding: '12px 16px', color: 'var(--ink-muted)' }}>{paper.subjectCode || '—'}</td><td style={{ padding: '12px 16px' }}>{paper.semester}</td><td style={{ padding: '12px 16px' }}>{paper.year}</td><td style={{ padding: '12px 16px', textTransform: 'capitalize' }}>{paper.examType}</td><td style={{ padding: '12px 16px', fontSize: 'var(--text-xs)' }}>{paper.fileName || 'PDF'}</td></tr>)}</tbody></table></div>
        )}
      </div>
    </div>
  );
}
