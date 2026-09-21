# API Reference & Endpoints — CampusHub

All CampusHub endpoints are prefixed with `/api` and return standardized envelopes:
`{ "success": boolean, "message": string, "data"?: any }`.

Authentication is handled via JWT tokens passed via Authorization Bearer headers or HTTP-only cookies.

---

## 1. Authentication & Session (`/api/auth`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | Public | Authenticates credentials (email + password), sets cookie / returns token. |
| `POST` | `/api/auth/logout` | Authenticated | Clears user session. |
| `GET` | `/api/auth/me` | Authenticated | Returns current authenticated user and associated profile. |
| `POST` | `/api/auth/change-password` | Authenticated | Updates password after verifying old Argon2id hash. |

---

## 2. Student Academics & Schedule

### 2.1 Attendance (`/api/attendance`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/attendance/summary` | Student | Returns per-subject attendance percentages, total lectures, and warning flags. |
| `GET` | `/api/attendance/history` | Student | Returns dated attendance records with pagination. |
| `POST` | `/api/attendance/mark` | Faculty | Records lecture attendance roster for a class section. |
| `GET` | `/api/attendance/faculty-roster` | Faculty | Retrieves class list for designated lecture period. |

### 2.2 Timetable (`/api/timetable`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/timetable/my-schedule` | Student / Faculty | Retrieves weekly day-wise lecture grid. |
| `POST` | `/api/timetable` | Admin | Updates or creates class section timetable. |

### 2.3 Exams & Results (`/api/exams`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/exams/schedule` | Student | Retrieves published assessment and semester exam dates. |
| `GET` | `/api/exams/results` | Student | Returns student result sheets, semester SGPA, and cumulative CGPA. |
| `POST` | `/api/exams` | Admin | Schedules new internal or external examination. |

---

## 3. Financial Services (`/api/fees`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/fees/my-dues` | Student | Returns itemized fee breakdown (Tuition, Hostel, Transport, Library). |
| `POST` | `/api/fees/pay` | Student | Processes fee settlement and issues simulated transaction receipt. |
| `GET` | `/api/fees/all` | Admin | Financial summary of institute fee collection rates. |

---

## 4. Student Leave & OD Workflow (`/api/leave`, `/api/od`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/leave/apply` | Student | Submits new leave application to assigned mentor. |
| `GET` | `/api/leave/my-applications` | Student | Returns history of leave applications and gate pass statuses. |
| `POST` | `/api/od/apply` | Student | Submits On-Duty request with proof event details. |
| `GET` | `/api/mentor/leave-requests` | Mentor | Lists pending leave/OD applications for assigned wards. |
| `PATCH` | `/api/mentor/leave/:id/approve` | Mentor | Approves application and generates digital gate pass. |
| `PATCH` | `/api/mentor/leave/:id/reject` | Mentor | Rejects application with mentor remarks. |

---

## 5. Grievances & Work Orders (`/api/complaints`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/complaints` | Student / Staff | Lodges a categorized grievance; generates ticket ID (e.g. `CMP-2026-00101`). |
| `GET` | `/api/complaints/my-tickets` | Student | Returns status timeline of logged tickets. |
| `GET` | `/api/complaints/department-queue` | Maintenance | Returns tickets assigned to technician's craft. |
| `PATCH` | `/api/complaints/:id/status` | Maintenance / Admin | Advances ticket state (`in_progress`, `resolved`, `closed`). |

---

## 6. Residential & Logistics

### 6.1 Hostel (`/api/hostel`)
*Restricted*: Gated server-side so day scholars cannot fetch room allocations or mess menus.
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/hostel/my-room` | Hosteller | Returns room allocation, block details, bed number, and room-mates. |
| `GET` | `/api/hostel/mess-menu` | Hosteller | Returns weekly mess meal timings and menu items. |

### 6.2 Transport (`/api/transport`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/transport/routes` | Authenticated | Lists campus bus routes and stoppage coordinates. |
| `GET` | `/api/transport/my-bus` | Student | Details student's allocated route and driver contact. |
| `PATCH` | `/api/transport/bus/:id/location` | Driver | Updates current vehicle stop/status. |

---

## 7. AI Campus Assistant (`/api/ai`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/ai/query` | Authenticated | Processes conversational query grounded in campus KB and user's private data. |

---

## 8. Institute Administration (`/api/admin`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/admin/metrics` | Admin | Operational metrics: student headcounts, hostellers, pending tickets, buses. |
| `GET` | `/api/admin/audit-logs` | Admin | Read-only access to tamper-proof administrative audit entries. |
| `PATCH` | `/api/admin/users/:id/role` | Admin | Updates user authorization role. |
| `PATCH` | `/api/admin/students/:id/hostel-status`| Admin | Toggles student `hosteller` vs `day_scholar` status. |
