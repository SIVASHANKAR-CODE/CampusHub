const routeLoaders = {
  '/student': () => import('../pages/student/Dashboard'),
  '/student/fees': () => import('../pages/student/Fees'),
  '/student/attendance': () => import('../pages/student/Attendance'),
  '/student/exams': () => import('../pages/student/Exams'),
  '/student/results': () => import('../pages/student/Results'),
  '/student/timetable': () => import('../pages/student/Timetable'),
  '/student/leave': () => import('../pages/student/Leave'),
  '/student/complaints': () => import('../pages/student/Complaints'),
  '/student/hostel': () => import('../pages/student/Hostel'),
  '/student/transport': () => import('../pages/student/Transport'),
  '/student/clubs': () => import('../pages/student/Clubs'),
  '/student/events': () => import('../pages/student/Events'),
  '/student/announcements': () => import('../pages/student/Announcements'),
  '/student/library': () => import('../pages/student/Library'),
  '/student/question-papers': () => import('../pages/student/QuestionPapers'),
  '/student/lost-found': () => import('../pages/student/LostFound'),
  '/student/ai': () => import('../pages/student/AIAssistant'),
  '/student/notifications': () => import('../pages/student/Notifications'),
  '/student/profile': () => import('../pages/student/Profile'),
  '/faculty': () => import('../pages/faculty/Dashboard'),
  '/faculty/attendance': () => import('../pages/faculty/Attendance'),
  '/mentor': () => import('../pages/mentor/Dashboard'),
  '/mentor/leave': () => import('../pages/mentor/LeaveReview'),
  '/admin': () => import('../pages/admin/Dashboard'),
  '/admin/students': () => import('../pages/admin/Students'),
  '/admin/exams': () => import('../pages/admin/Exams'),
  '/admin/timetable': () => import('../pages/admin/Timetable'),
  '/admin/fees': () => import('../pages/admin/Fees'),
  '/admin/complaints': () => import('../pages/admin/Complaints'),
  '/admin/hostel': () => import('../pages/admin/Hostel'),
  '/admin/transport': () => import('../pages/admin/Transport'),
  '/admin/clubs': () => import('../pages/admin/Clubs'),
  '/admin/events': () => import('../pages/admin/Events'),
  '/admin/announcements': () => import('../pages/admin/Announcements'),
  '/admin/library': () => import('../pages/admin/Library'),
  '/admin/question-papers': () => import('../pages/admin/QuestionPapers'),
  '/admin/knowledge': () => import('../pages/admin/Knowledge'),
  '/admin/audit-logs': () => import('../pages/admin/AuditLogs'),
  '/maintenance': () => import('../pages/maintenance/Dashboard'),
  '/driver': () => import('../pages/driver/Dashboard'),
};

export function preloadRoute(path) {
  const loader = routeLoaders[path];
  if (!loader) return;

  if (!loader.__prefetched) {
    loader.__prefetched = true;
    loader().catch(() => {
      loader.__prefetched = false;
    });
  }
}

export function preloadStudentRoutes() {
  Object.keys(routeLoaders)
    .filter((path) => path.startsWith('/student'))
    .forEach((path) => preloadRoute(path));
}
