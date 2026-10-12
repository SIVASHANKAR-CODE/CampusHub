import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { questionPapersAPI } from '../../services/api';
import { Download, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

const EXAM_TYPES = ['', 'internal', 'model', 'semester', 'practical'];

export default function StudentQuestionPapers() {
  const [filters, setFilters] = useState({ department: '', semester: '', examType: '', year: '' });
  const [fileAction, setFileAction] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['question-papers', filters],
    queryFn: async () => {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
      const { data } = await questionPapersAPI.list(params);
      return data.data?.papers || [];
    },
  });

  const handleFile = async (paper, shouldDownload = false) => {
    const actionKey = `${paper._id}:${shouldDownload ? 'download' : 'view'}`;
    let viewer;
    if (!shouldDownload) {
      viewer = window.open('', '_blank');
      if (!viewer) {
        toast.error('Allow pop-ups to view this question paper.');
        return;
      }
      viewer.document.title = 'Opening question paper...';
      viewer.document.body.textContent = 'Opening question paper...';
    }

    setFileAction(actionKey);
    try {
      const response = await questionPapersAPI.file(paper._id, shouldDownload);
      if (shouldDownload) await questionPapersAPI.recordDownload(paper._id);
      const blobUrl = URL.createObjectURL(response.data);
      if (shouldDownload) {
        const anchor = document.createElement('a');
        anchor.href = blobUrl;
        anchor.download = paper.fileName || `${paper.subjectCode || 'question-paper'}-${paper.year}.pdf`;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
      } else {
        viewer.location.href = blobUrl;
      }
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
      if (shouldDownload) toast.success('Question paper downloaded.');
    } catch (error) {
      if (viewer && !viewer.closed) viewer.close();
      toast.error(error.response?.data?.message || 'Question paper file is currently unavailable.');
    } finally {
      setFileAction(null);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Question Papers</h1>
        <p className="page-subtitle">Previous year question papers for all subjects</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
        <select className="select" value={filters.semester} onChange={e => setFilters({ ...filters, semester: e.target.value })}>
          <option value="">All Semesters</option>
          {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Sem {s}</option>)}
        </select>
        <select className="select" value={filters.examType} onChange={e => setFilters({ ...filters, examType: e.target.value })}>
          <option value="">All Types</option>
          {EXAM_TYPES.filter(Boolean).map(t => <option key={t} value={t} style={{ textTransform: 'capitalize' }}>{t}</option>)}
        </select>
        <select className="select" value={filters.year} onChange={e => setFilters({ ...filters, year: e.target.value })}>
          <option value="">All Years</option>
          {[2024, 2023, 2022, 2021, 2020].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {isLoading && [...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: '64px', borderRadius: '12px', marginBottom: '8px' }} />)}
      {data?.length === 0 && !isLoading && (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--ink-muted)' }}>
          No question papers found for these filters.
        </div>
      )}

      {data?.map((paper) => (
        <div key={paper._id} className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <FileText size={20} style={{ color: 'var(--brand)', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{paper.subject}</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)', marginTop: '2px' }}>
              Sem {paper.semester} • {paper.year} • <span style={{ textTransform: 'capitalize' }}>{paper.examType}</span> • {paper.department}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" onClick={() => handleFile(paper)} disabled={fileAction === `${paper._id}:view`} className="btn btn-outline btn-sm">
              {fileAction === `${paper._id}:view` ? 'Opening...' : 'View'}
            </button>
            <button type="button" onClick={() => handleFile(paper, true)} disabled={fileAction === `${paper._id}:download`} className="btn btn-outline btn-sm">
              <Download size={14} /> {fileAction === `${paper._id}:download` ? 'Downloading...' : 'Download'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
