import AIKnowledgeBase from '../models/AIKnowledgeBase.js';
import Student from '../models/Student.js';
import Attendance from '../models/Attendance.js';
import Fee from '../models/Fee.js';
import Exam from '../models/Exam.js';
import Result from '../models/Result.js';
import CampusLocation from '../models/CampusLocation.js';
import CampusEvent from '../models/CampusEvent.js';
import LeaveApplication from '../models/LeaveApplication.js';
import Complaint from '../models/Complaint.js';
import Announcement from '../models/Announcement.js';
import LibraryBook from '../models/LibraryBook.js';
import TransportBus from '../models/TransportBus.js';
import Timetable from '../models/Timetable.js';
import { connectDB, isDbConnected } from '../config/db.js';

const DEMO_STUDENT_REGNO_BY_EMAIL = {
  'student@demo.com': '21CS001',
  'student@campushub.edu': '21CS001',
  'student2@demo.com': '21CS002',
};

export const DEMO_STUDENT_CONTEXT_BY_EMAIL = {
  'student@demo.com': {
    student: {
      name: 'Aarav Patel',
      regNo: '21CS001',
      department: 'CSE',
      year: 2,
      semester: 3,
      section: 'A',
      hostelStatus: 'hosteller',
    },
    mentor: {
      name: 'Dr. Priya Raman',
      department: 'CSE',
      phone: '+91 94441 23456',
      email: 'mentor@campushub.edu',
    },
    attendance: {
      subjects: [
        { subject: 'Data Structures & Algorithms', present: 38, total: 45, percentage: 84 },
        { subject: 'Operating Systems', present: 28, total: 40, percentage: 70 },
        { subject: 'Cloud Computing', present: 35, total: 38, percentage: 92 },
        { subject: 'Database Management Systems', present: 27, total: 28, percentage: 96 },
        { subject: 'Advanced Algorithms', present: 25, total: 28, percentage: 89 },
      ],
      overall: 82,
      totalPresent: 153,
      totalClasses: 179,
    },
    fees: {
      currentSemester: 3,
      currentDue: 35000,
      totalDue: 35000,
      totalPaid: 40000,
      totalFees: 75000,
      status: 'partial',
    },
    exams: [
      { subject: 'Data Structures & Algorithms', date: '24 Sep 2026', time: '09:00 - 11:00', examType: 'internal', room: 'CS-204' },
      { subject: 'Operating Systems', date: '27 Sep 2026', time: '09:00 - 11:30', examType: 'semester', room: 'CS-205' },
      { subject: 'Cloud Computing', date: '02 Oct 2026', time: '09:30 - 12:30', examType: 'semester', room: 'Main Aud' },
    ],
    events: [
      { title: 'Smart Campus AI & IoT Hackathon 2026', date: '28 Sep 2026', location: 'Tech Park Auditorium' },
      { title: 'Full Stack Web Masterclass', date: '05 Oct 2026', location: 'Block A Seminar Hall' },
    ],
    announcements: [
      { title: 'Semester fee payment reminder', body: 'Pay Semester 3 fees before 30 Sep 2026 to avoid late penalty.', publishedAt: '2026-09-18' },
      { title: 'Mid-term examination timetable published', body: 'The timetable is accessible in Exams section.', publishedAt: '2026-09-15' },
    ],
    results: [
      {
        semester: 2, gpa: 8.75, cgpa: 8.6, subjects: [
          { subjectName: 'Python Programming', code: 'GE3151', grade: 'O', credits: 4, points: 10 },
          { subjectName: 'Digital Principles', code: 'EC3251', grade: 'A+', credits: 4, points: 9 },
          { subjectName: 'Engineering Math II', code: 'MA3251', grade: 'A', credits: 4, points: 8 },
        ],
      },
    ],
    leaveApplications: [
      { leaveType: 'casual', startDate: '27 Sep 2026', endDate: '28 Sep 2026', totalDays: 2, reason: 'Family function', status: 'pending' },
    ],
    complaints: [
      { ticketId: 'CMP-2026-00041', title: 'Split AC cooling issue in CS Lab 2', status: 'in_progress' },
      { ticketId: 'CMP-2026-00042', title: 'Water dispenser leakage near 1st floor staircase', status: 'submitted' },
    ],
    transport: {
      eligible: true,
      busNumber: 'BUS-07',
      routeName: 'Mettur Dam Line (Route 7)',
      origin: 'Mettur Square',
      destination: 'Campus Main Gate',
      status: 'on_trip',
      currentLocation: 'Mecheri',
      driverName: 'Ramesh Chandran',
      driverPhone: '+91 94444 55555',
      pickupPoint: 'Mecheri',
      stops: [
        { name: 'Mettur Square', time: '07:15' },
        { name: 'Mecheri', time: '07:45' },
        { name: 'Nangavalli', time: '08:05' },
        { name: 'Campus Main Gate', time: '08:35' },
      ],
    },
    locations: [
      {
        name: "Principal's Office",
        building: 'Administrative Block',
        floor: '1st Floor',
        roomNumber: 'Room 102',
        directions: 'Next to the main reception and opposite the registrar office.',
        description: 'Administrative office for principal and academic matters.',
      },
    ],
  },
};

DEMO_STUDENT_CONTEXT_BY_EMAIL['student@campushub.edu'] = DEMO_STUDENT_CONTEXT_BY_EMAIL['student@demo.com'];

export const DEMO_KNOWLEDGE_BASE = [
  {
    category: 'leave_procedure',
    question: 'How do I apply for leave in CampusHub?',
    answer: `To apply for leave in CampusHub:
1. Open **Leave & OD** from the sidebar menu.
2. Click **Apply for Leave**.
3. Select your leave type (Medical, Casual, Emergency, etc.).
4. Enter the **Start Date**, **End Date**, and **Reason**.
5. Attach a medical certificate or proof document if required.
6. Click **Submit Application**.

Your leave request is instantly forwarded to your assigned mentor for review. You can track status updates directly in the Leave & OD dashboard.`,
    keywords: ['leave', 'apply', 'medical', 'casual', 'permission', 'mentor', 'sick', 'epdi', 'panradhu'],
  },
  {
    category: 'od_procedure',
    question: 'How do I apply for On-Duty (OD) in CampusHub?',
    answer: `To apply for On-Duty (OD) in CampusHub:
1. Open **Leave & OD** from the sidebar menu.
2. Select **Apply for On-Duty (OD)**.
3. Enter the event title, organizing college/institution, venue, and date range.
4. Attach your event invitation, participation receipt, or acceptance letter.
5. Click **Submit OD Application**.

Your mentor reviews the OD request. Once approved, the attended periods are automatically credited to your attendance records.`,
    keywords: ['od', 'on duty', 'onduty', 'symposium', 'hackathon', 'competition', 'paper presentation'],
  },
  {
    category: 'complaint_procedure',
    question: 'How do I raise a complaint or report a campus maintenance issue?',
    answer: `To raise a complaint in CampusHub:
1. Navigate to **Complaints** from the sidebar.
2. Click **Raise New Complaint**.
3. Select the appropriate category (Electrical, Plumbing, Facilities, Infrastructure, Food, Hostel, IT).
4. Select the priority level (Low, Medium, High, Urgent).
5. Provide a clear title, description, and exact location.
6. Optionally upload a photo of the issue.
7. Click **Submit Complaint**.

You will receive a unique Ticket ID (e.g. CMP-2026-XXXXX). The campus administration and maintenance department will be notified immediately to inspect and resolve it.`,
    keywords: ['complaint', 'grievance', 'issue', 'problem', 'repair', 'broken', 'maintenance', 'raise'],
  },
  {
    category: 'club_procedure',
    question: 'How do I join a student club or technical society?',
    answer: `To join a campus club in CampusHub:
1. Open **Clubs** from the sidebar.
2. Browse through active technical, cultural, sports, and academic clubs (e.g. GDSC, ACM, Cultural Society).
3. Click the **Join Club** button on the club card.
4. Provide a brief note highlighting your interests.
5. Submit the request.

Your membership request is sent to the club coordinator/admin. Once approved, your status changes to "Member" and you will receive notifications for all club activities.`,
    keywords: ['club', 'society', 'join', 'member', 'gdsc', 'acm', 'cultural', 'sports'],
  },
  {
    category: 'event_procedure',
    question: 'How do I register for campus events, workshops, or hackathons?',
    answer: `To register for an event in CampusHub:
1. Open **Events** from the sidebar.
2. Filter by category (Technical, Workshop, Sports, Hackathon, Placement).
3. Find the event you wish to attend and review the venue, timings, and capacity.
4. Click **Register for Event**.
5. Once registered, the button updates to "✓ Registered" and your seat is reserved.`,
    keywords: ['event', 'register', 'hackathon', 'workshop', 'symposium', 'sports meet', 'enroll'],
  },
  {
    category: 'library',
    question: 'What are the working hours and borrowing rules of the Central Library?',
    answer: `**Dr. APJ Abdul Kalam Central Library Timings & Rules:**
• **Monday to Friday**: 8:00 AM – 8:00 PM
• **Saturday**: 9:00 AM – 6:00 PM
• **Examination Periods**: Reading halls remain open until 10:00 PM.
• **Book Borrowing**: Undergraduates can borrow up to 4 books for 14 days, renewable once through the Library portal.`,
    keywords: ['library', 'hours', 'timing', 'open', 'close', 'books', 'reading hall'],
  },
  {
    category: 'hostel',
    question: 'What are the hostel rules, mess timings, and curfew?',
    answer: `**Hostel Guidelines & Mess Timings:**
• **Curfew**: 8:30 PM on weekdays; 9:00 PM on weekends.
• **Breakfast**: 7:30 AM – 9:00 AM
• **Lunch**: 12:30 PM – 2:00 PM
• **Dinner**: 7:30 PM – 9:00 PM
• **Outpass**: Must be applied at least 24 hours in advance via the Leave & OD portal and approved by the Chief Warden.`,
    keywords: ['hostel', 'curfew', 'mess', 'timing', 'warden', 'room', 'hosteller'],
  },
  {
    category: 'location',
    question: 'Where is the Principal\'s Office and Administrative Block?',
    answer: `**Principal\'s Office Location:**
• **Building**: Administrative Block (Ground Floor to 1st Floor)
• **Room**: Room 102, 1st Floor
• **Directions**: Enter via the Main Gate portico, proceed up the central staircase to the 1st floor; the office is directly opposite the Registrar Office and next to the Board Room.`,
    keywords: ['principal', 'office', 'administrative block', 'where', 'location', 'directions'],
  },
];

const DEMO_TIMETABLE_PERIODS = [
  ['08:45', '09:35'], ['09:35', '10:25'], ['10:40', '11:30'], ['11:30', '12:20'],
  ['01:15', '02:05'], ['02:05', '02:55'], ['02:55', '03:45'], ['03:45', '04:30'],
];

const DEMO_TIMETABLE_SUBJECTS = [
  ['CS3301', 'Data Structures & Algorithms', 'Dr. Rajesh Sharma', 'CS-204'],
  ['CS3302', 'Operating Systems', 'Dr. Priya Raman', 'CS-205'],
  ['CS3303', 'Database Management Systems', 'Dr. Anita Desai', 'CS-202'],
  ['CS3304', 'Cloud Computing', 'Prof. Ananya Sen', 'CS-301'],
  ['CS3305', 'Computer Networks', 'Prof. Arvind Swaminathan', 'CS-203'],
  ['CS3311', 'Data Structures Lab', 'Dr. Rajesh Sharma', 'Computing Lab 2'],
];

function buildDemoTimetable() {
  const slots = [];
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  days.forEach((day) => {
    DEMO_TIMETABLE_PERIODS.forEach(([startTime, endTime], idx) => {
      const [subjectCode, subject, facultyName, room] = DEMO_TIMETABLE_SUBJECTS[idx % DEMO_TIMETABLE_SUBJECTS.length];
      slots.push({ day, period: idx + 1, startTime, endTime, subject, subjectCode, facultyName, room });
    });
  });
  return slots;
}

function getDayName(date) {
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date(date).getDay()];
}

// ─── High-Risk Action Patterns ────────────────────────────────────────────────
const HIGH_RISK_PATTERNS = [
  /approve.*leave/i, /reject.*leave/i,
  /change.*hostel.*status/i, /update.*hostel/i,
  /delete.*user/i, /remove.*student/i,
  /transfer.*fee/i, /pay.*fee.*for.*me/i,
  /give.*marks/i, /update.*result/i, /change.*attendance/i,
];

export function isHighRiskAction(message) {
  return HIGH_RISK_PATTERNS.some((p) => p.test(message));
}

// ─── Robust Multi-Lingual Intent Detection (English + Tamil / Tanglish) ────────
export function detectIntent(rawMessage) {
  const msg = String(rawMessage || '').toLowerCase().trim();

  // Normalize common phonetic Tanglish / Tamil patterns
  const isTamilTanglish =
    /epdi|eppadi|yeppadi|panradhu|panrathu|pannuvadhu|seyvathu|evlo|evvalavu|kattanum|katta|irukku|irukkiradhu|enga|enge|eppo|eppodhu|serarthu|podradhu|kudukka|solunga|sollunga|vanakkam|nandri/i.test(msg);

  // 1. Greetings & Politeness
  if (/^(hi|hello|hey|vanakkam|good morning|good afternoon|good evening|namaste|ola)\b/i.test(msg)) {
    return 'greeting';
  }
  if (/^(thanks|thank you|thx|ty|nandri|romba nandri)\b/i.test(msg)) {
    return 'thanks';
  }
  if (/who are you|your name|un peyar|unoda per/i.test(msg)) {
    return 'identity';
  }

  // 2. Leave
  if (/(leave|medical leave|casual leave|permission|outpass)/i.test(msg)) {
    if (/status|track|pending|approved|rejected|mudinjitha/i.test(msg)) return 'leave_status';
    return 'leave_procedure';
  }

  // 3. OD (On-Duty)
  if (/\b(od|on duty|onduty|on-duty)\b/i.test(msg)) {
    if (/status|track|pending|approved|rejected/i.test(msg)) return 'od_status';
    return 'od_procedure';
  }

  // 4. Complaints
  if (/(complaint|grievance|problem|issue|leakage|damage|broken|repair)/i.test(msg)) {
    if (/status|track|my complaints|ticket/i.test(msg)) return 'complaint_status';
    return 'complaint_procedure';
  }

  // 5. Clubs & Societies
  if (/\b(club|clubs|society|societies|gdsc|acm)\b/i.test(msg)) {
    if (/join|apply|serarthu|member|admission/i.test(msg)) return 'club_procedure';
    return 'clubs_list';
  }

  // 6. Events & Hackathons
  if (/(event|events|hackathon|workshop|seminar|fest|symposium)/i.test(msg)) {
    if (/register|enroll|apply|booking|serarthu/i.test(msg)) return 'event_procedure';
    return 'events';
  }

  // 7. Attendance
  if (/(attendance|present|absent|percentage|cutoff|threshold)/i.test(msg) || (isTamilTanglish && /attendance/i.test(msg))) {
    return 'attendance';
  }

  // 8. Fees & Payments
  if (/(fee|fees|tuition|dues|payment|balance|receipt|kattanum)/i.test(msg)) {
    return 'fees';
  }

  // 9. Exams
  if (/\b(exam|exams|test|tests|internal|assessment|hall ticket|schedule)\b/i.test(msg)) {
    return 'exams';
  }

  // 10. Results & CGPA
  if (/(result|results|gpa|cgpa|grade|grades|marks|marksheet)/i.test(msg)) {
    return 'results';
  }

  // 11. Timetable & Classes
  if (/(timetable|time table|schedule|class timing|today class|tomorrow class|classes today)/i.test(msg)) {
    return 'timetable';
  }

  // 12. Transport & Bus
  if (/(transport|bus|bus route|bus timing|pickup|driver|gps|bus enga)/i.test(msg)) {
    return 'transport';
  }

  // 13. Library
  if (/(library|book|books|reading hall|borrow|shelf)/i.test(msg)) {
    return 'library';
  }

  // 14. Locations & Navigation
  if (/(where is|location|room|office|lab|auditorium|block|building|enga irukku|directions)/i.test(msg)) {
    return 'location';
  }

  // 15. Hostel
  if (/(hostel|warden|mess|curfew|hosteller)/i.test(msg)) {
    return 'hostel';
  }

  // 16. Announcements
  if (/(announcement|announcements|circular|news|update|notice)/i.test(msg)) {
    return 'announcements';
  }

  return 'general_campus';
}

// ─── Build Local Demo Context ─────────────────────────────────────────────────
export function buildDemoFallbackContext(studentUserId, userEmail, intent, message) {
  const email = (userEmail || DEMO_STUDENT_REGNO_BY_EMAIL[studentUserId] || '').toLowerCase();
  const base = DEMO_STUDENT_CONTEXT_BY_EMAIL['student@demo.com'];
  const context = { ...base };

  // Intent-specific enrichment
  if (intent === 'timetable' || /timetable|class/i.test(message)) {
    const allSlots = buildDemoTimetable();
    const normalized = message.toLowerCase();
    const requestedDayMatch = normalized.match(/sunday|monday|tuesday|wednesday|thursday|friday|saturday/);
    const requestedDay = requestedDayMatch
      ? requestedDayMatch[0][0].toUpperCase() + requestedDayMatch[0].slice(1)
      : /tomorrow/i.test(normalized)
        ? getDayName(Date.now() + 24 * 60 * 60 * 1000)
        : getDayName(Date.now());
    context.timetableRequestedDay = requestedDay;
    context.timetable = allSlots.filter((slot) => slot.day === requestedDay);
  }

  // Attach knowledge base match
  const kbEntry = DEMO_KNOWLEDGE_BASE.find((k) => k.category === intent);
  if (kbEntry) {
    context.knowledgeBase = [kbEntry];
  }

  return context;
}

// ─── Main Context Retrieval (Fast-Path Optimized) ─────────────────────────────
export async function retrieveContext(intent, studentUserId, message, user = null) {
  const userEmail = user?.email || null;
  const normalizedIntent = intent || detectIntent(message);

  // FAST-PATH: Demo users or offline mode immediately load local context with 0ms DB latency
  const isMock = typeof studentUserId === 'string' && studentUserId.startsWith('mock_');
  if (isMock || !isDbConnected()) {
    return buildDemoFallbackContext(studentUserId, userEmail, normalizedIntent, message);
  }

  try {
    await connectDB();
  } catch {
    return buildDemoFallbackContext(studentUserId, userEmail, normalizedIntent, message);
  }

  const context = {};

  // Find knowledge base entry for procedural intents
  const staticMatch = DEMO_KNOWLEDGE_BASE.find((k) => k.category === normalizedIntent);
  if (staticMatch) {
    context.knowledgeBase = [staticMatch];
  }

  // If real student user, query ONLY the data matching the intent to keep latency low
  if (studentUserId) {
    try {
      const student = await Student.findOne({ userId: studentUserId })
        .populate('mentorId', 'name email phone department designation')
        .lean();

      if (student) {
        context.student = {
          name: student.name,
          regNo: student.regNo || student.registrationNumber,
          department: student.department,
          year: student.year,
          semester: student.semester,
          section: student.section,
          hostelStatus: student.hostelStatus,
        };

        if (student.mentorId) {
          context.mentor = {
            name: student.mentorId.name,
            department: student.mentorId.department,
            phone: student.mentorId.phone,
            email: student.mentorId.email,
          };
        }

        // Targeted query based on intent
        if (normalizedIntent === 'attendance') {
          const attendance = await Attendance.aggregate([
            { $match: { studentId: student._id } },
            { $group: {
              _id: '$subject',
              total: { $sum: 1 },
              present: { $sum: { $cond: [{ $in: ['$status', ['present', 'od', 'leave']] }, 1, 0] } },
            }},
          ]);
          const subList = attendance.map((a) => ({
            subject: a._id,
            present: a.present,
            total: a.total,
            percentage: a.total > 0 ? Math.round((a.present / a.total) * 100) : 0,
          }));
          const totalPresent = subList.reduce((acc, s) => acc + s.present, 0);
          const totalClasses = subList.reduce((acc, s) => acc + s.total, 0);
          const overall = totalClasses > 0 ? Math.round((totalPresent / totalClasses) * 100) : 0;
          context.attendance = { subjects: subList, overall, totalPresent, totalClasses };
        } else if (normalizedIntent === 'fees') {
          const fees = await Fee.find({ studentId: student._id }).sort({ semester: -1 }).lean();
          if (fees.length > 0) {
            const currentFee = fees[0];
            const totalDue = fees.reduce((acc, f) => acc + (f.dueAmount || 0), 0);
            const totalPaid = fees.reduce((acc, f) => acc + (f.paidAmount || 0), 0);
            const totalFees = fees.reduce((acc, f) => acc + (f.totalFee || 0), 0);
            context.fees = {
              currentSemester: currentFee.semester,
              currentDue: currentFee.dueAmount,
              totalDue,
              totalPaid,
              totalFees,
              status: currentFee.status,
            };
          }
        } else if (normalizedIntent === 'exams') {
          const exams = await Exam.find({
            department: student.department,
            year: student.year,
            semester: student.semester,
            isPublished: true,
            date: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          }).sort({ date: 1 }).limit(5).lean();
          context.exams = exams.map((e) => ({
            subject: e.subject,
            date: e.date ? new Date(e.date).toLocaleDateString('en-IN') : '',
            time: e.startTime ? `${e.startTime} - ${e.endTime}` : '',
            examType: e.examType,
            room: e.room || 'Main Exam Hall',
          }));
        } else if (normalizedIntent === 'results') {
          context.results = await Result.find({ studentId: student._id, isPublished: true })
            .populate('examId', 'examType subject date')
            .sort({ semester: -1 }).lean();
        } else if (normalizedIntent === 'timetable') {
          const todayName = getDayName(Date.now());
          const tt = await Timetable.findOne({
            department: student.department,
            year: student.year,
            semester: student.semester,
            section: student.section,
            isActive: true,
          }).lean();
          if (tt?.slots) {
            context.timetable = tt.slots.filter((s) => s.day === todayName);
            context.timetableRequestedDay = todayName;
          }
        }
      }
    } catch {
      // Fallback cleanly on query error
      return buildDemoFallbackContext(studentUserId, userEmail, normalizedIntent, message);
    }
  }

  return context;
}
