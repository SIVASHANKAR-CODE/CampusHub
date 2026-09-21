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
