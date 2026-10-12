import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceAPI, timetableAPI } from '../../services/api';
import toast from 'react-hot-toast';
import {
  CheckCircle2, Search, CheckCheck, RefreshCw, AlertCircle, Sparkles, BookOpen, Clock, Calendar
} from 'lucide-react';

const DEPARTMENTS = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'AIDS', 'AIML'];
const SECTIONS = ['A', 'B', 'C', 'D'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

const PERIOD_TIMES = {
  1: '09:00 – 09:55',
  2: '09:55 – 10:50',
  3: '11:10 – 12:05',
  4: '12:05 – 01:00',
  5: '01:50 – 02:45',
  6: '02:45 – 03:40',
  7: '03:50 – 04:40',
  8: '04:40 – 05:30',
};

const DEFAULT_SUBJECTS_BY_PERIOD = {
  1: { subject: 'Data Structures & Algorithms', code: 'CS3301' },
  2: { subject: 'Operating Systems', code: 'CS3302' },
  3: { subject: 'Cloud Computing', code: 'CS3303' },
  4: { subject: 'Computer Networks', code: 'CS3304' },
  5: { subject: 'Database Management Systems', code: 'CS3305' },
  6: { subject: 'Advanced Algorithms', code: 'CS3306' },
  7: { subject: 'DS & Algo Lab (Session 1)', code: 'CS3311' },
  8: { subject: 'DS & Algo Lab (Session 2)', code: 'CS3311' },
};

export default function FacultyAttendance() {
  const queryClient = useQueryClient();
  const location = useLocation();
  const todayStr = new Date().toISOString().split('T')[0];

  // Form state
  const [department, setDepartment] = useState('CSE');
  const [year, setYear] = useState(2);
  const [semester, setSemester] = useState(3);
  const [section, setSection] = useState('A');
  const [subject, setSubject] = useState('Data Structures & Algorithms');
  const [subjectCode, setSubjectCode] = useState('CS3301');
  const [date, setDate] = useState(todayStr);
  const [period, setPeriod] = useState(1);

  // Student list search & status map
  const [searchQuery, setSearchQuery] = useState('');
  const [statuses, setStatuses] = useState({}); // { [studentId]: 'present' | 'absent' | 'od' | 'leave' }

  // Check if slot was passed via router navigation state (e.g. from Faculty Dashboard)
  useEffect(() => {
    if (location.state?.slot) {
      const s = location.state.slot;
      if (s.department) setDepartment(s.department);
      if (s.year) setYear(Number(s.year));
      if (s.semester) setSemester(Number(s.semester));
      if (s.section) setSection(s.section);
      if (s.subject) setSubject(s.subject);
      if (s.subjectCode) setSubjectCode(s.subjectCode);
      if (s.period) setPeriod(Number(s.period));
    }
  }, [location.state]);

  // Load faculty's timetable slots to offer quick-pick classes
  const { data: facultyTimetable } = useQuery({
    queryKey: ['faculty-timetable-classes'],
    queryFn: async () => {
      const { data } = await timetableAPI.faculty();
      return data.data || [];
    },
    staleTime: 60000,
  });

  // Extract distinct class offerings from timetable
  const distinctClasses = useMemo(() => {
    if (!facultyTimetable || !Array.isArray(facultyTimetable)) return [];
    const map = new Map();
    facultyTimetable.forEach(tt => {
      const slots = Array.isArray(tt.slots) ? tt.slots : [tt];
      slots.forEach(s => {
        if (!s.subject) return;
        const key = `${s.department || tt.department}-${s.year || tt.year}-${s.section || tt.section}-${s.subject}-${s.period}`;
        if (!map.has(key)) {
          map.set(key, {
            department: s.department || tt.department || 'CSE',
            year: s.year || tt.year || 2,
            semester: s.semester || tt.semester || 3,
            section: s.section || tt.section || 'A',
            subject: s.subject,
            subjectCode: s.subjectCode || '',
            period: s.period || 1,
            label: `Period ${s.period}: ${s.subject} (${s.department || tt.department} Yr ${s.year || tt.year} Sec ${s.section || tt.section})`,
          });
        }
      });
    });
    return Array.from(map.values());
  }, [facultyTimetable]);

  const selectQuickClass = (cls) => {
    setDepartment(cls.department);
    setYear(cls.year);
    setSemester(cls.semester);
    setSection(cls.section);
    setSubject(cls.subject);
    setSubjectCode(cls.subjectCode);
    if (cls.period) setPeriod(cls.period);
  };

  // Fetch all 8 periods summary for this class & date
  const { data: periodsSummary = [] } = useQuery({
    queryKey: ['class-periods-summary', date, department, year, section],
    queryFn: async () => {
      const { data } = await attendanceAPI.periodsSummary({
        date,
        department,
        year,
        section,
      });
      return data.data || [];
    },
    enabled: Boolean(date && department && year && section),
  });

  // Fetch students for selected class
  const {
    data: students = [],
    isLoading: studentsLoading,
    refetch: refetchStudents,
  } = useQuery({
    queryKey: ['class-students', department, year, semester, section],
    queryFn: async () => {
      if (!department || !year || !section) return [];
      const { data } = await attendanceAPI.classStudents({
        department,
        year,
        semester,
        section,
      });
      return data.data || [];
    },
    enabled: Boolean(department && year && section),
  });

  // Fetch existing attendance records for the specific period, date, and class
  const { data: existingRecords = {}, isFetching: recordsLoading } = useQuery({
    queryKey: ['class-attendance-records', date, department, year, section, period],
    queryFn: async () => {
      if (!date) return {};
      const { data } = await attendanceAPI.classRecords({
        date,
        department,
        year,
        section,
        period,
      });
      return data.data || {};
    },
    enabled: Boolean(date && department && year && section),
  });

  // Synchronize statuses whenever students or existingRecords change
  useEffect(() => {
    if (!students || students.length === 0) {
      setStatuses({});
      return;
    }
    const initial = {};
    students.forEach((st) => {
      const id = st._id?.toString() || st._id;
      // If an existing record is fetched for this period, use it; otherwise default to 'present'
      initial[id] = existingRecords[id] || 'present';
    });
    setStatuses(initial);
  }, [students, existingRecords]);

  // When switching period, if the period summary has a subject, auto-fill it
  useEffect(() => {
    const periodData = periodsSummary.find(p => p.period === period);
    if (periodData && periodData.isMarked && periodData.subject) {
      setSubject(periodData.subject);
    } else if (DEFAULT_SUBJECTS_BY_PERIOD[period]) {
      setSubject(DEFAULT_SUBJECTS_BY_PERIOD[period].subject);
      setSubjectCode(DEFAULT_SUBJECTS_BY_PERIOD[period].code);
    }
  }, [period, periodsSummary]);

  // Bulk status assignment
  const setAllStatus = (status) => {
    const updated = {};
    students.forEach((st) => {
      const id = st._id?.toString() || st._id;
      updated[id] = status;
    });
    setStatuses(updated);
  };

  const handleStatusChange = (studentId, status) => {
    setStatuses((prev) => ({ ...prev, [studentId]: status }));
  };

  // Mark attendance mutation
  const markMutation = useMutation({
    mutationFn: async () => {
      if (!subject.trim()) throw new Error('Please enter or select a subject name');
      const records = Object.entries(statuses).map(([studentId, status]) => ({
        studentId,
        status,
      }));
      if (records.length === 0) throw new Error('No students found to mark attendance');

      const payload = {
        subject,
        subjectCode,
        date,
        records,
        department,
        year: Number(year),
        semester: Number(semester),
        section,
        period: Number(period),
      };
      const { data } = await attendanceAPI.markBulk(payload);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data?.message || `Attendance for Period ${period} submitted successfully!`);
      queryClient.invalidateQueries({ queryKey: ['class-attendance-records'] });
      queryClient.invalidateQueries({ queryKey: ['class-periods-summary'] });
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || 'Failed to submit attendance');
    },
  });

  // Filter students based on search query
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const q = searchQuery.toLowerCase();
    return students.filter(
      (s) =>
        s.name?.toLowerCase().includes(q) ||
        s.registrationNumber?.toLowerCase().includes(q) ||
        s.regNo?.toLowerCase().includes(q)
    );
  }, [students, searchQuery]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = students.length;
    if (total === 0) return { present: 0, absent: 0, od: 0, leave: 0, pct: 0, total: 0 };
    let present = 0;
    let absent = 0;
    let od = 0;
    let leave = 0;
    Object.values(statuses).forEach((st) => {
      if (st === 'present') present++;
      else if (st === 'absent') absent++;
      else if (st === 'od') od++;
      else if (st === 'leave') leave++;
    });
    const effectivePresent = present + od + leave;
    const pct = total > 0 ? ((effectivePresent / total) * 100).toFixed(1) : 0;
    return { present, absent, od, leave, pct, total };
  }, [students, statuses]);

  const activePeriodSummary = periodsSummary.find(p => p.period === period);
  const isCurrentPeriodMarked = Object.keys(existingRecords).length > 0 || activePeriodSummary?.isMarked;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <div>
            <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <CheckCheck className="text-brand" size={28} />
              Period-Wise Attendance
            </h1>
            <p className="page-subtitle">Mark and verify student attendance for each period (Periods 1 to 8)</p>
          </div>
          {students.length > 0 && (
            <button
              className="btn btn-primary"
              disabled={markMutation.isPending}
              onClick={() => markMutation.mutate()}
              style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
            >
              {markMutation.isPending ? <RefreshCw className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
              {markMutation.isPending ? 'Saving...' : `Save Period ${period} Attendance`}
            </button>
          )}
        </div>
      </div>

      {/* Quick Picks from Timetable */}
      {distinctClasses.length > 0 && (
        <div className="card" style={{ marginBottom: 'var(--space-5)', background: 'var(--surface-raised)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)', color: 'var(--brand)', fontWeight: 600, fontSize: 'var(--text-sm)' }}>
            <Sparkles size={16} /> Quick Select Scheduled Period:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
            {distinctClasses.map((cls, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => selectQuickClass(cls)}
                className="btn btn-secondary"
                style={{
                  fontSize: 'var(--text-xs)',
                  padding: '6px 12px',
                  background: period === cls.period && subject === cls.subject && section === cls.section ? 'var(--brand-muted)' : undefined,
                  borderColor: period === cls.period && subject === cls.subject && section === cls.section ? 'var(--brand)' : undefined,
                  color: period === cls.period && subject === cls.subject && section === cls.section ? 'var(--brand)' : undefined,
                }}
              >
                <BookOpen size={13} style={{ marginRight: '6px' }} />
                {cls.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Class & Date Controls */}
      <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
        <h2 style={{ fontSize: 'var(--text-md)', fontWeight: 600, marginBottom: 'var(--space-4)', color: 'var(--ink)' }}>
          Class & Date Selection
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-4)'
        }}>
          <div>
            <label className="label">Department</label>
            <select
              className="select"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            >
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Year</label>
            <select
              className="select"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              <option value={1}>1st Year</option>
              <option value={2}>2nd Year</option>
              <option value={3}>3rd Year</option>
              <option value={4}>4th Year</option>
            </select>
          </div>

          <div>
            <label className="label">Semester</label>
            <select
              className="select"
              value={semester}
              onChange={(e) => setSemester(Number(e.target.value))}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <option key={s} value={s}>Semester {s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Section</label>
            <select
              className="select"
              value={section}
              onChange={(e) => setSection(e.target.value)}
            >
              {SECTIONS.map((sec) => (
                <option key={sec} value={sec}>Section {sec}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Date</label>
            <input
              type="date"
              className="input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
          <div>
            <label className="label">Subject Name *</label>
            <input
              type="text"
              className="input"
              placeholder="e.g., Data Structures & Algorithms"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Subject Code (Optional)</label>
            <input
              type="text"
              className="input"
              placeholder="e.g., CS3301"
              value={subjectCode}
              onChange={(e) => setSubjectCode(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Interactive Period Ribbon (Periods 1 to 8) */}
      <div className="card" style={{ marginBottom: 'var(--space-5)', padding: 'var(--space-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
          <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={16} className="text-brand" />
            Select Period for Today ({department} Yr {year} Sec {section}):
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)' }}>
            Active: Period {period} ({PERIOD_TIMES[period]})
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(105px, 1fr))',
          gap: 'var(--space-2)',
        }}>
          {PERIODS.map((p) => {
            const summary = periodsSummary.find(s => s.period === p);
            const isMarked = summary?.isMarked || (p === period && Object.keys(existingRecords).length > 0);
            const isSelected = period === p;

            return (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                style={{
                  padding: '8px 6px',
                  borderRadius: 'var(--radius-md)',
                  border: isSelected ? '2px solid var(--brand)' : '1px solid var(--line)',
                  background: isSelected ? 'var(--brand-muted)' : 'var(--surface-raised)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  position: 'relative',
                  transition: 'all 0.15s ease',
                  boxShadow: isSelected ? '0 0 0 1px var(--brand)' : 'none',
                }}
              >
                <div style={{
                  fontWeight: isSelected ? 700 : 600,
                  fontSize: 'var(--text-sm)',
                  color: isSelected ? 'var(--brand)' : 'var(--ink)',
                }}>
                  Period {p}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--ink-faint)', whiteSpace: 'nowrap' }}>
                  {PERIOD_TIMES[p]}
                </div>
                {isMarked ? (
                  <span style={{
                    fontSize: '9px',
                    padding: '1px 6px',
                    borderRadius: '999px',
                    background: 'rgba(34, 197, 94, 0.15)',
                    color: 'var(--success)',
                    fontWeight: 700,
                  }}>
                    ✓ Marked
                  </span>
                ) : (
                  <span style={{
                    fontSize: '9px',
                    padding: '1px 6px',
                    borderRadius: '999px',
                    background: 'var(--surface-inset)',
                    color: 'var(--ink-faint)',
                    fontWeight: 500,
                  }}>
                    Pending
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Attendance Stats Bar for Active Period */}
      {students.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: 'var(--space-3)',
          marginBottom: 'var(--space-5)'
        }}>
          <div className="card" style={{ padding: 'var(--space-3)', textAlign: 'center' }}>
            <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--ink)' }}>{stats.total}</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-muted)' }}>Class Strength</div>
          </div>
          <div className="card" style={{ padding: 'var(--space-3)', textAlign: 'center', borderColor: 'rgba(34,197,94,0.3)' }}>
            <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--success)' }}>{stats.present}</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-muted)' }}>Present</div>
          </div>
          <div className="card" style={{ padding: 'var(--space-3)', textAlign: 'center', borderColor: 'rgba(239,68,68,0.3)' }}>
            <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--danger)' }}>{stats.absent}</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-muted)' }}>Absent</div>
          </div>
          <div className="card" style={{ padding: 'var(--space-3)', textAlign: 'center', borderColor: 'rgba(234,179,8,0.3)' }}>
            <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--warning)' }}>{stats.od}</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-muted)' }}>On Duty (OD)</div>
          </div>
          <div className="card" style={{ padding: 'var(--space-3)', textAlign: 'center', borderColor: 'rgba(168,85,247,0.3)' }}>
            <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: '#a855f7' }}>{stats.leave}</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-muted)' }}>Leave</div>
          </div>
          <div className="card" style={{ padding: 'var(--space-3)', textAlign: 'center' }}>
            <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: Number(stats.pct) >= 80 ? 'var(--success)' : 'var(--danger)' }}>
              {stats.pct}%
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-muted)' }}>Period Attendance</div>
          </div>
        </div>
      )}

      {/* Roster & Controls */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Action Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'var(--space-4) var(--space-6)',
          borderBottom: '1px solid var(--line)',
          flexWrap: 'wrap',
          gap: 'var(--space-3)',
          background: 'var(--surface-raised)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flex: 1, minWidth: '240px' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-faint)' }} />
              <input
                type="text"
                className="input"
                placeholder="Search student or Reg No..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '32px', height: '36px', fontSize: 'var(--text-sm)' }}
              />
            </div>
            {isCurrentPeriodMarked && (
              <span className="badge badge-success" style={{ fontSize: 'var(--text-xs)' }}>
                Period {period} Previously Marked
              </span>
            )}
            {recordsLoading && (
              <RefreshCw size={14} className="animate-spin text-brand" />
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setAllStatus('present')}
              style={{ fontSize: 'var(--text-xs)', padding: '6px 12px' }}
            >
              All Present
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setAllStatus('absent')}
              style={{ fontSize: 'var(--text-xs)', padding: '6px 12px' }}
            >
              All Absent
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => refetchStudents()}
              title="Refresh Roster"
              style={{ padding: '6px 10px' }}
            >
              <RefreshCw size={14} className={studentsLoading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Student List */}
        {studentsLoading ? (
          <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--ink-muted)' }}>
            <RefreshCw className="animate-spin" size={24} style={{ margin: '0 auto var(--space-2)' }} />
            <p style={{ fontSize: 'var(--text-sm)' }}>Loading class roster...</p>
          </div>
        ) : students.length === 0 ? (
          <div style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--ink-muted)' }}>
            <AlertCircle size={36} style={{ margin: '0 auto var(--space-3)', color: 'var(--ink-faint)' }} />
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--ink)', marginBottom: '4px' }}>
              No students found for this class
            </h3>
            <p style={{ fontSize: 'var(--text-sm)' }}>
              Check the selected Department, Year, and Section above.
            </p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--ink-muted)' }}>
            <p style={{ fontSize: 'var(--text-sm)' }}>No students match your search filter.</p>
          </div>
        ) : (
          <div>
            {filteredStudents.map((student, idx) => {
              const id = student._id?.toString() || student._id;
              const currentStatus = statuses[id] || 'present';

              return (
                <div
                  key={id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 'var(--space-3) var(--space-6)',
                    borderBottom: idx < filteredStudents.length - 1 ? '1px solid var(--line)' : 'none',
                    background: currentStatus === 'absent' ? 'rgba(239, 68, 68, 0.04)' : undefined,
                    transition: 'background 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', minWidth: 0, flex: 1 }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'var(--brand-muted)',
                      color: 'var(--brand)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 'var(--text-xs)',
                      fontWeight: 700,
                      flexShrink: 0
                    }}>
                      {idx + 1}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {student.name}
                      </div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-faint)' }}>
                        {student.registrationNumber || student.regNo} • {student.department} Sec {student.section}
                      </div>
                    </div>
                  </div>

                  {/* Status Picker Buttons */}
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => handleStatusChange(id, 'present')}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-md)',
                        fontSize: 'var(--text-xs)',
                        fontWeight: 600,
                        border: '1px solid',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        background: currentStatus === 'present' ? 'var(--success)' : 'transparent',
                        color: currentStatus === 'present' ? '#fff' : 'var(--ink-muted)',
                        borderColor: currentStatus === 'present' ? 'var(--success)' : 'var(--line)',
                      }}
                    >
                      Present
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStatusChange(id, 'absent')}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-md)',
                        fontSize: 'var(--text-xs)',
                        fontWeight: 600,
                        border: '1px solid',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        background: currentStatus === 'absent' ? 'var(--danger)' : 'transparent',
                        color: currentStatus === 'absent' ? '#fff' : 'var(--ink-muted)',
                        borderColor: currentStatus === 'absent' ? 'var(--danger)' : 'var(--line)',
                      }}
                    >
                      Absent
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStatusChange(id, 'od')}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-md)',
                        fontSize: 'var(--text-xs)',
                        fontWeight: 600,
                        border: '1px solid',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        background: currentStatus === 'od' ? 'var(--warning)' : 'transparent',
                        color: currentStatus === 'od' ? '#000' : 'var(--ink-muted)',
                        borderColor: currentStatus === 'od' ? 'var(--warning)' : 'var(--line)',
                      }}
                    >
                      OD
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStatusChange(id, 'leave')}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-md)',
                        fontSize: 'var(--text-xs)',
                        fontWeight: 600,
                        border: '1px solid',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        background: currentStatus === 'leave' ? '#a855f7' : 'transparent',
                        color: currentStatus === 'leave' ? '#fff' : 'var(--ink-muted)',
                        borderColor: currentStatus === 'leave' ? '#a855f7' : 'var(--line)',
                      }}
                    >
                      Leave
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer save action */}
        {students.length > 0 && (
          <div style={{
            padding: 'var(--space-4) var(--space-6)',
            borderTop: '1px solid var(--line)',
            background: 'var(--surface-raised)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 'var(--space-3)'
          }}>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-muted)' }}>
              Submitting for <strong>Period {period} ({PERIOD_TIMES[period]})</strong> — {students.length} students ({stats.present} present, {stats.absent} absent).
            </div>
            <button
              className="btn btn-primary"
              disabled={markMutation.isPending}
              onClick={() => markMutation.mutate()}
              style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
            >
              {markMutation.isPending ? <RefreshCw className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
              {markMutation.isPending ? 'Saving...' : `Save Period ${period} Attendance`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
