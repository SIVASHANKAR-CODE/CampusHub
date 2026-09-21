import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true, // Send cookies
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

function toUploadFormData(fileOrFormData) {
  if (fileOrFormData instanceof FormData) return fileOrFormData;
  const formData = new FormData();
  formData.append('file', fileOrFormData);
  return formData;
}

function toMultipartRequest(data) {
  if (!data || data instanceof FormData) return data;
  const hasFile = Object.values(data).some((value) => value instanceof File || value instanceof Blob);
  if (!hasFile) return data;

  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (value instanceof File || value instanceof Blob) {
      formData.append(key, value);
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item) => formData.append(key, item));
      return;
    }
    formData.append(key, String(value));
  });
  return formData;
}

// Request interceptor — attach JWT from sessionStorage if available
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('campushub_token') || localStorage.getItem('campushub_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  // Let the browser set multipart boundary. A hardcoded Content-Type breaks multer.
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    const headers = config.headers;
    if (headers && typeof headers.delete === 'function') {
      headers.delete('Content-Type');
      headers.delete('content-type');
    } else if (headers) {
      delete headers['Content-Type'];
      delete headers['content-type'];
    }
    config.timeout = Math.max(config.timeout || 0, 60000);
  }
  return config;
});

// Response interceptor — handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem('campushub_token');
      try { localStorage.removeItem('campushub_token'); } catch {}
      // Only redirect if not already on login page
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

// Student
export const studentAPI = {
  dashboard: () => api.get('/students/dashboard'),
  profile: () => api.get('/students/profile'),
  updateProfile: (data) => api.patch('/students/profile', data),
  list: (params) => api.get('/students', { params }),
  search: (q) => api.get('/students/search', { params: { q } }),
  byRegistration: (reg) => api.get(`/students/by-registration/${reg}`),
  update: (id, data) => api.patch(`/students/${id}`, data),
};

// Attendance
export const attendanceAPI = {
  my: () => api.get('/attendance'),
  daily: (params) => api.get('/attendance/daily', { params }),
  markBulk: (data) => api.post('/attendance/mark', data),
  byStudent: (id) => api.get(`/attendance/student/${id}`),
  classStudents: (params) => api.get('/attendance/class', { params }),
  classRecords: (params) => api.get('/attendance/class/records', { params }),
  periodsSummary: (params) => api.get('/attendance/class/periods-summary', { params }),
};

// Fees
export const feesAPI = {
  my: (params) => api.get('/fees', { params }),
  byStudent: (id) => api.get(`/fees/student/${id}`),
  create: (data) => api.post('/fees', data),
  recordPayment: (id, data) => api.post(`/fees/${id}/payment`, data),
  all: (params) => api.get('/students', { params }),  // lists students; then byStudent for their fees
};

// Exams & Results
export const examsAPI = {
  upcoming: () => api.get('/exams'),
  results: () => api.get('/exams/results'),
  create: (data) => api.post('/exams', data),
  publish: (id) => api.patch(`/exams/${id}/publish`),
  postResult: (data) => api.post('/exams/results', data),
  publishResult: (id) => api.patch(`/exams/results/${id}/publish`),
  // Admin
  adminAll: (params) => api.get('/exams/admin/all', { params }),
  adminResultsAll: (params) => api.get('/exams/results/all', { params }),
  delete: (id) => api.delete(`/exams/${id}`),
  update: (id, data) => api.patch(`/exams/${id}`, data),
};

// Timetable
export const timetableAPI = {
  my: () => api.get('/timetable'),
  faculty: () => api.get('/timetable/faculty'),
  save: (data) => api.post('/timetable', data),
  all: (params) => api.get('/timetable/all', { params }),
  delete: (id) => api.delete(`/timetable/${id}`),
};

// Leave & OD
export const leaveAPI = {
  apply: (data) => api.post('/leave', toMultipartRequest(data)),
  my: (params) => api.get('/leave', { params }),
  cancel: (id) => api.patch(`/leave/${id}/cancel`),
  menteeList: (params) => api.get('/leave/mentee', { params }),
  review: (id, data) => api.patch(`/leave/${id}/review`, data),
};

export const odAPI = {
  apply: (data) => api.post('/od', toMultipartRequest(data)),
  my: () => api.get('/od'),
  menteeList: (params) => api.get('/od/mentee', { params }),
  review: (id, data) => api.patch(`/od/${id}/review`, data),
};

// Complaints
export const complaintsAPI = {
  create: (data) => api.post('/complaints', toMultipartRequest(data)),
  my: () => api.get('/complaints/my'),
  get: (id) => api.get(`/complaints/${id}`),
  acknowledge: (id) => api.patch(`/complaints/${id}/acknowledge`),
  all: (params) => api.get('/complaints', { params }),
  updateStatus: (id, data) => api.patch(`/complaints/${id}/status`, data),
  assigned: () => api.get('/complaints/assigned'),
  updateProgress: (id, data) => api.patch(`/complaints/${id}/progress`, data),
  claim: (id) => api.patch(`/complaints/${id}/claim`),
  addComment: (id, data) => api.post(`/complaints/${id}/comments`, data),
};

// Hostel
export const hostelAPI = {
  my: () => api.get('/hostel/my'),
  list: () => api.get('/hostel'),
  assign: (data) => api.post('/hostel', data),
  remove: (studentId) => api.delete(`/hostel/${studentId}`),
};

// Transport
export const transportAPI = {
  my: () => api.get('/transport/my'),
  location: (busId) => api.get(`/transport/bus/${busId}/location`),
  updateLocation: (data) => api.post('/transport/location', data),
  trip: (busId, data) => api.patch(`/transport/bus/${busId}/trip`, data),
  all: () => api.get('/transport'),
  create: (data) => api.post('/transport', data),
  updateStudents: (busId, data) => api.patch(`/transport/${busId}/students`, data),
  routes: () => api.get('/transport/routes'),
  createRoute: (data) => api.post('/transport/routes', data),
};

// Clubs
export const clubsAPI = {
  list: () => api.get('/clubs'),
  myMemberships: () => api.get('/clubs/my-memberships'),
  join: (id, data) => api.post(`/clubs/${id}/join`, data),
  joinRequests: () => api.get('/clubs/requests/membership'),
  reviewJoinRequest: (id, data) => api.patch(`/clubs/requests/membership/${id}`, data),
  request: (data) => api.post('/clubs/request', data),
  requests: () => api.get('/clubs/requests'),
  reviewRequest: (id, data) => api.patch(`/clubs/requests/${id}`, data),
  create: (data) => api.post('/clubs', data),
  updateMembers: (id, data) => api.patch(`/clubs/${id}/members`, data),
  delete: (id) => api.delete(`/clubs/${id}`),
};

// File & Image Upload
export const uploadAPI = {
  uploadFile: (fileOrFormData) => api.post('/upload', toUploadFormData(fileOrFormData)),
  uploadBase64: (data) => api.post('/upload/base64', data),
};

// Events
export const eventsAPI = {
  list: (params) => api.get('/events', { params }),
  register: (id) => api.post(`/events/${id}/register`),
  create: (data) => api.post('/events', data),
  publish: (id) => api.patch(`/events/${id}/publish`),
  update: (id, data) => api.patch(`/events/${id}`, data),
};

// Announcements
export const announcementsAPI = {
  list: (params) => api.get('/announcements', { params }),
  create: (data) => api.post('/announcements', data),
  update: (id, data) => api.patch(`/announcements/${id}`, data),
  delete: (id) => api.delete(`/announcements/${id}`),
};

// Library
export const libraryAPI = {
  search: (q) => api.get('/library/search', { params: { q } }),
  list: (params) => api.get('/library', { params }),
  add: (data) => api.post('/library', data),
  update: (id, data) => api.patch(`/library/${id}`, data),
};

// Question Papers
export const questionPapersAPI = {
  list: (params) => api.get('/question-papers', { params }),
  add: (data) => api.post('/question-papers', data),
  recordDownload: (id) => api.post(`/question-papers/${id}/download`),
  file: (id, download = false) => api.get(`/question-papers/${id}/file`, { params: download ? { download: 1 } : undefined, responseType: 'blob' }),
};

// Lost & Found
export const lostFoundAPI = {
  list: (params) => api.get('/lost-found', { params }),
  create: (data) => api.post('/lost-found', data),
  resolve: (id) => api.patch(`/lost-found/${id}/resolve`),
  report: (id, data) => api.post(`/lost-found/${id}/report`, data),
};

// Locations
export const locationsAPI = {
  list: (params) => api.get('/locations', { params }),
  add: (data) => api.post('/locations', data),
  update: (id, data) => api.patch(`/locations/${id}`, data),
};

// Notifications
export const notificationsAPI = {
  list: (params) => api.get('/notifications', { params }),
  read: (id) => api.patch(`/notifications/${id}/read`),
  dismiss: (id) => api.delete(`/notifications/${id}`),
  readAll: () => api.patch('/notifications/read-all'),
};

// AI
export const aiAPI = {
  chat: (message) => api.post('/ai/chat', { message }),
};

// Admin
export const adminAPI = {
  dashboard: () => api.get('/admin/dashboard'),
  auditLogs: (params) => api.get('/admin/audit-logs', { params }),
  knowledge: () => api.get('/admin/knowledge'),
  addKnowledge: (data) => api.post('/admin/knowledge', data),
  updateKnowledge: (id, data) => api.patch(`/admin/knowledge/${id}`, data),
  deleteKnowledge: (id) => api.delete(`/admin/knowledge/${id}`),
};
