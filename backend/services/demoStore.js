/**
 * Unified in-process store for mock/demo accounts when MongoDB is unavailable
 * or the user authenticated via DEMO_PRESET_USERS (mock_* ids).
 * Data lasts for the lifetime of the Node process and provides complete,
 * cohesive multi-role parity between Student, Maintenance, Admin, Faculty, and Mentor.
 */

// ─── Initial Demo Complaints ─────────────────────────────────────────────────
const initialDemoComplaints = [
  {
    _id: 'mock_comp_001',
    ticketId: 'CMP-2026-00041',
    title: 'Split AC cooling issue in CS Lab 2',
    category: 'electrical',
    subCategory: 'air_conditioning',
    description: 'The split AC unit in CS Lab 2 (Room 204) is not blowing cold air. Temperature is reaching 32°C during lab sessions.',
    priority: 'high',
    status: 'in_progress',
    location: 'Block B, 2nd Floor, Room 204',
    studentId: {
      _id: 'mock_student_001',
      userId: 'mock_student_001',
      name: 'Aarav Patel',
      regNo: '21CS001',
      registrationNumber: '21CS001',
      department: 'CSE',
      year: 2,
      section: 'A',
    },
    assignedTo: 'mock_maint_001',
    assignedToName: 'Suresh Kumar',
    createdAt: new Date(Date.now() - 3600000 * 5),
    updatedAt: new Date(Date.now() - 3600000 * 2),
    timeline: [
      { status: 'submitted', note: 'Complaint submitted by student.', updatedByName: 'Aarav Patel', updatedByRole: 'student', timestamp: new Date(Date.now() - 3600000 * 5) },
      { status: 'assigned', note: 'Assigned to Suresh Kumar (Maintenance).', updatedByName: 'admin@demo.com', updatedByRole: 'admin', timestamp: new Date(Date.now() - 3600000 * 4) },
      { status: 'in_progress', note: 'Technician inspected the condenser. Filter replacement in progress.', updatedByName: 'Suresh Kumar', updatedByRole: 'maintenance', timestamp: new Date(Date.now() - 3600000 * 2) },
    ],
  },
  {
    _id: 'mock_comp_002',
    ticketId: 'CMP-2026-00042',
    title: 'Water dispenser leakage near 1st floor staircase',
    category: 'plumbing',
    subCategory: 'water_cooler',
    description: 'Drinking water dispenser valve has a continuous leak creating a slipping hazard near staircase 1.',
    priority: 'urgent',
    status: 'submitted',
    location: 'Main Block, 1st Floor, Near Staircase 1',
    studentId: {
      _id: 'mock_student_001',
      userId: 'mock_student_001',
      name: 'Aarav Patel',
      regNo: '21CS001',
      registrationNumber: '21CS001',
      department: 'CSE',
      year: 2,
      section: 'A',
    },
    createdAt: new Date(Date.now() - 3600000 * 1),
    updatedAt: new Date(Date.now() - 3600000 * 1),
    timeline: [
      { status: 'submitted', note: 'Complaint submitted by student.', updatedByName: 'Aarav Patel', updatedByRole: 'student', timestamp: new Date(Date.now() - 3600000 * 1) },
    ],
  },
];

const demoComplaints = [...initialDemoComplaints];

export function addDemoComplaint(userId, complaint) {
  const existingIndex = demoComplaints.findIndex((c) => c._id === complaint._id);
  if (existingIndex >= 0) {
    demoComplaints[existingIndex] = { ...demoComplaints[existingIndex], ...complaint };
    return demoComplaints[existingIndex];
  }
  demoComplaints.unshift(complaint);
  return complaint;
}

export function getDemoComplaints(userId) {
  return demoComplaints.filter((c) => c.studentId?._id === userId || c.studentId?.userId === userId);
}

export function getAllDemoComplaints() {
  return [...demoComplaints];
}

export function getDemoComplaintById(id) {
  return demoComplaints.find((c) => c._id === id || c.ticketId === id) || null;
}

export function updateDemoComplaint(id, updater) {
  const item = demoComplaints.find((c) => c._id === id || c.ticketId === id);
  if (!item) return null;
  const updates = typeof updater === 'function' ? updater(item) : updater;
  Object.assign(item, updates);
  return item;
}

// ─── Leave & OD ──────────────────────────────────────────────────────────────
const leaves = [];
const ods = [];

export function addDemoLeave(leave) {
  leaves.unshift(leave);
  return leave;
}

export function getDemoLeaves({ studentKey, mentorList = false, status } = {}) {
  return leaves.filter((item) => {
    if (mentorList) return !status || item.status === status;
    if (studentKey) return item.studentKey === studentKey;
    return true;
  });
}

export function updateDemoLeave(id, updater) {
  const item = leaves.find((leave) => leave._id === id);
  if (!item) return null;
  const updates = typeof updater === 'function' ? updater(item) : updater;
  Object.assign(item, updates);
  return item;
}

export function addDemoOd(od) {
  ods.unshift(od);
  return od;
}

export function getDemoOds({ studentKey, mentorList = false, status } = {}) {
  return ods.filter((item) => {
    if (mentorList) return !status || item.status === status;
    if (studentKey) return item.studentKey === studentKey;
    return true;
  });
}

export function updateDemoOd(id, updater) {
  const item = ods.find((od) => od._id === id);
  if (!item) return null;
  const updates = typeof updater === 'function' ? updater(item) : updater;
  Object.assign(item, updates);
  return item;
}

// ─── Clubs & Memberships ─────────────────────────────────────────────────────
const initialDemoClubs = [
  {
    _id: 'demo-club-gdsc',
    name: 'Google Developer Student Club',
    description: 'A technical community for workshops, mobile/web development, cloud study jams, and hackathons.',
    category: 'technical',
    memberIds: ['mock_st_002', 'mock_st_003', 'mock_st_004', 'mock_st_005'],
    isActive: true,
  },
  {
    _id: 'demo-club-acm',
    name: 'ACM Student Chapter',
    description: 'Competitive programming, algorithms, algorithmic research talks, and peer mentorship.',
    category: 'academic',
    memberIds: ['mock_st_006', 'mock_st_007'],
    isActive: true,
  },
  {
    _id: 'demo-club-cultural',
    name: 'Dhwani Cultural Society',
    description: 'Music, dance, theatre, fine arts, and inter-collegiate cultural fest organization.',
    category: 'cultural',
    memberIds: ['mock_st_008', 'mock_st_009', 'mock_st_010'],
    isActive: true,
  },
  {
    _id: 'demo-club-sports',
    name: 'Campus Sports & Athletics Club',
    description: 'Intramural tournaments, badminton, football, basketball, cricket, and fitness bootcamps.',
    category: 'sports',
    memberIds: ['mock_st_011', 'mock_st_012'],
    isActive: true,
  },
];

let demoClubs = [...initialDemoClubs];

export function getDemoClubs() {
  return [...demoClubs];
}

export function addDemoClub(club) {
  const newClub = {
    _id: `demo-club-${Date.now()}`,
    memberIds: [],
    isActive: true,
    ...club,
  };
  demoClubs.push(newClub);
  return newClub;
}

export function deleteDemoClub(id) {
  const idx = demoClubs.findIndex((c) => c._id === id);
  if (idx !== -1) {
    demoClubs.splice(idx, 1);
    return true;
  }
  return false;
}

const demoMemberships = [];

export function getDemoMemberships(studentId) {
  return demoMemberships.filter((m) => m.studentId === studentId || m.studentId?._id === studentId);
}

export function getAllDemoMemberships() {
  return [...demoMemberships];
}

export function addDemoMembership(membership) {
  const existingIdx = demoMemberships.findIndex(
    (m) => (m.studentId === membership.studentId || m.studentId?._id === membership.studentId) &&
           (m.clubId === membership.clubId || m.clubId?._id === membership.clubId)
  );
  if (existingIdx !== -1) {
    demoMemberships[existingIdx] = { ...demoMemberships[existingIdx], ...membership };
    return demoMemberships[existingIdx];
  }
  demoMemberships.unshift(membership);
  return membership;
}

export function updateDemoMembership(id, updater) {
  const item = demoMemberships.find((m) => m._id === id);
  if (!item) return null;
  const updates = typeof updater === 'function' ? updater(item) : updater;
  Object.assign(item, updates);

  // If approved, update club memberIds
  if (updates.status === 'approved') {
    const clubId = item.clubId?._id || item.clubId;
    const studentId = item.studentId?._id || item.studentId;
    const club = demoClubs.find((c) => c._id === clubId);
    if (club && !club.memberIds.includes(studentId)) {
      club.memberIds.push(studentId);
    }
  }
  return item;
}

// Club creation requests
const demoClubRequests = [
  {
    _id: 'demo-cr-001',
    clubName: 'Robotics & Automation Society',
    category: 'technical',
    purpose: 'To build autonomous robots and compete in Robocon competitions.',
    description: 'Hardware, microcontrollers, ROS, and drone engineering club.',
    expectedMembers: 35,
    status: 'pending',
    requestedBy: {
      _id: 'mock_student_002',
      name: 'Sneha Reddy',
      regNo: '21CS002',
    },
    createdAt: new Date(Date.now() - 86400000 * 2),
  },
];

export function getDemoClubRequests() {
  return [...demoClubRequests];
}

export function addDemoClubRequest(req) {
  const newReq = { _id: `demo-cr-${Date.now()}`, status: 'pending', createdAt: new Date(), ...req };
  demoClubRequests.unshift(newReq);
  return newReq;
}

export function updateDemoClubRequest(id, updater) {
  const item = demoClubRequests.find((r) => r._id === id);
  if (!item) return null;
  const updates = typeof updater === 'function' ? updater(item) : updater;
  Object.assign(item, updates);
  return item;
}

// ─── Events ──────────────────────────────────────────────────────────────────
const initialDemoEvents = [
  {
    _id: 'demo-event-hackathon',
    name: 'Smart Campus AI & IoT Hackathon 2026',
    description: 'Build practical AI and IoT solutions for campus energy, security, and learning in a 36-hour challenge.',
    category: 'hackathon',
    date: new Date(Date.now() + 10 * 86400000),
    startTime: '09:00',
    endTime: '18:00',
    venue: 'Auditorium - Tech Park',
    organizer: 'GDSC & ACM Chapter',
    maxCapacity: 120,
    registrations: ['mock_student_002', 'mock_student_003'],
    registrationDeadline: new Date(Date.now() + 7 * 86400000),
    isPublished: true,
  },
  {
    _id: 'demo-event-workshop',
    name: 'Full Stack Web Development Masterclass',
    description: 'Hands-on workshop covering REST APIs, React state architecture, JWT security, and cloud deployment.',
    category: 'workshop',
    date: new Date(Date.now() + 15 * 86400000),
    startTime: '10:00',
    endTime: '13:00',
    venue: 'Block A Seminar Hall',
    organizer: 'Computer Science Department',
    maxCapacity: 80,
    registrations: [],
    registrationDeadline: new Date(Date.now() + 12 * 86400000),
    isPublished: true,
  },
  {
    _id: 'demo-event-sports',
    name: 'Annual Inter-Department Sports Meet',
    description: 'Track and field, football, badminton, and basketball tournament selections.',
    category: 'sports',
    date: new Date(Date.now() + 22 * 86400000),
    startTime: '08:00',
    endTime: '16:00',
    venue: 'Campus Sports Ground',
    organizer: 'Student Council',
    maxCapacity: 200,
    registrations: [],
    registrationDeadline: new Date(Date.now() + 18 * 86400000),
    isPublished: true,
  },
];

let demoEvents = [...initialDemoEvents];

export function getDemoEvents({ isAdmin = false, category } = {}) {
  return demoEvents.filter((ev) => {
    if (!isAdmin && !ev.isPublished) return false;
    if (category && ev.category !== category) return false;
    return true;
  });
}

export function addDemoEvent(event) {
  const newEvent = {
    _id: `demo-event-${Date.now()}`,
    registrations: [],
    isPublished: false,
    ...event,
  };
  demoEvents.unshift(newEvent);
  return newEvent;
}

export function publishDemoEvent(id) {
  const event = demoEvents.find((e) => e._id === id);
  if (event) {
    event.isPublished = true;
    return event;
  }
  return null;
}

export function registerDemoEvent(eventId, studentId) {
  const event = demoEvents.find((e) => e._id === eventId);
  if (!event) return { success: false, message: 'Event not found' };
  if (!event.registrations) event.registrations = [];
  if (event.registrations.includes(studentId)) {
    return { success: false, message: 'Already registered for this event' };
  }
  if (event.maxCapacity && event.registrations.length >= event.maxCapacity) {
    return { success: false, message: 'Event is at full capacity' };
  }
  event.registrations.push(studentId);
  return { success: true, count: event.registrations.length };
}

// ─── Notifications ───────────────────────────────────────────────────────────
const demoNotificationsByUser = new Map();

const DEFAULT_DEMO_NOTIFICATIONS = {
  mock_student_001: [
    { _id: 'notif-01', type: 'important', category: 'academic', targetRole: 'student', title: 'Mid-term timetable published', body: 'The mid-term examination timetable is now available in the Exams section.', link: '/student/exams', read: false, createdAt: new Date() },
    { _id: 'notif-02', type: 'info', category: 'academic', targetRole: 'student', title: 'Hackathon registration is open', body: 'Register for the Smart Campus Hackathon before the deadline.', link: '/student/events', read: true, createdAt: new Date(Date.now() - 86400000) },
  ],
  mock_admin_001: [
    { _id: 'notif-adm-01', type: 'warning', category: 'complaint', targetRole: 'admin', title: 'New urgent complaint submitted', body: 'Water dispenser leakage near 1st floor staircase requires attention.', link: '/admin/complaints', read: false, createdAt: new Date(Date.now() - 3600000) },
  ],
  mock_maint_001: [
    { _id: 'notif-mnt-01', type: 'warning', category: 'task', targetRole: 'maintenance', title: 'New maintenance task assigned', body: 'AC cooling issue in CS Lab 2 has been assigned to you.', link: '/maintenance', read: false, createdAt: new Date(Date.now() - 3600000 * 4) },
  ],
};

export function addDemoNotification(notification) {
  const targets = Array.isArray(notification) ? notification : [notification];
  targets.forEach((n) => {
    const userId = String(n.userId);
    const existing = demoNotificationsByUser.get(userId) || DEFAULT_DEMO_NOTIFICATIONS[userId] || [];
    const created = {
      _id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      read: false,
      createdAt: new Date(),
      ...n,
    };
    demoNotificationsByUser.set(userId, [created, ...existing]);
  });
}

export function getDemoNotificationsForUser(userId, role) {
  const key = String(userId);
  if (!demoNotificationsByUser.has(key)) {
    const initial = DEFAULT_DEMO_NOTIFICATIONS[key] || [];
    demoNotificationsByUser.set(key, [...initial]);
  }
  return demoNotificationsByUser.get(key) || [];
}

export function markDemoNotificationRead(userId, id) {
  const list = getDemoNotificationsForUser(userId);
  const item = list.find((n) => n._id === id);
  if (item) item.read = true;
  return item;
}

export function dismissDemoNotification(userId, id) {
  const list = getDemoNotificationsForUser(userId);
  const idx = list.findIndex((n) => n._id === id);
  if (idx !== -1) {
    list.splice(idx, 1);
    return true;
  }
  return false;
}

export function markAllDemoNotificationsRead(userId) {
  const list = getDemoNotificationsForUser(userId);
  list.forEach((n) => { n.read = true; });
  return list.length;
}

// ─── Demo Student Stub Helper ────────────────────────────────────────────────
export function demoStudentStub(req) {
  return {
    _id: req.user?.id || 'mock_student_001',
    userId: req.user?.id || 'mock_student_001',
    name: req.user?.email?.split('@')[0] || 'Aarav Patel',
    regNo: '21CS001',
    registrationNumber: '21CS001',
    department: 'CSE',
    year: 2,
    semester: 3,
    section: 'A',
  };
}
