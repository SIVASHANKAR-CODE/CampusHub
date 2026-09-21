# Database Schema & Data Models — CampusHub

CampusHub utilizes MongoDB Atlas with Mongoose schemas. Models are strongly typed, validated, and optimized with compound and single-field indexes for high-frequency queries.

---

## 1. Entity Relationship Overview

```
User (Base Identity: email, passwordHash, role, isActive)
 ├── Student (1:1 via userId, refs mentorId)
 ├── Faculty (1:1 via userId)
 └── Mentor (1:1 via userId, 1:N assignedStudents -> Student)

Academic Entities:
 ├── Attendance (studentId, subjectCode, date, status, facultyId)
 ├── Timetable (department, year, semester, section, schedule[])
 ├── Exam (name, type, semester, timetable[])
 └── Result (studentId, examId, semester, subjects[], sgpa, cgpa)

Operations & Student Welfare:
 ├── Fee (studentId, academicYear, semester, components[], total, paid, status)
 ├── LeaveApplication (studentId, mentorId, type, fromDate, toDate, status, gatePassId)
 ├── ODApplication (studentId, mentorId, eventName, date, proofUrl, status)
 ├── Complaint (studentId, ticketId, category, title, description, priority, status, assignedTo)
 └── HostelStudent (studentId, block, roomNo, bedNo, wardenId)

Campus Community & Logistics:
 ├── TransportBus (busNumber, routeId, driverId, capacity, currentStop, activeStatus)
 ├── BusRoute (routeNumber, routeName, stops[])
 ├── Club (name, category, presidentId, description, facultyAdvisorId)
 ├── ClubRequest (clubId, studentId, statement, status)
 ├── CampusEvent (title, organizer, date, venue, category, registeredStudents[])
 ├── LibraryBook (isbn, title, author, category, availableCopies, totalCopies)
 ├── QuestionPaper (subjectCode, subjectName, year, semester, fileUrl)
 ├── LostAndFound (title, category, itemStatus, locationFound, image, reportedBy)
 ├── CampusLocation (name, code, category, floor, block, coordinates)
 ├── Notification (recipientUserId, title, message, type, read, actionUrl)
 ├── AIKnowledgeBase (topic, category, content, keywords[])
 └── AuditLog (performedBy, action, resource, resourceId, details, ipAddress)
```

---

## 2. Core Collections & Schema Details

### 2.1 `users`
| Field | Type | Attributes | Description |
|---|---|---|---|
| `email` | String | Unique, Required, Lowercase, Indexed | University login email |
| `passwordHash` | String | Required | Argon2id hash |
| `role` | String | Enum, Required, Indexed | `student`, `faculty`, `mentor`, `admin`, `maintenance`, `transport_staff`, `driver`, `security`, `club_president` |
| `isActive` | Boolean | Default: `true` | Account active flag |
| `createdAt` / `updatedAt` | Date | Timestamps | Auto-generated |

### 2.2 `students`
| Field | Type | Attributes | Description |
|---|---|---|---|
| `userId` | ObjectId | Ref: `User`, Unique, Indexed | Linked account |
| `regNo` | String | Unique, Required, Uppercase, Indexed | Registration number (e.g. `21CS001`) |
| `name` | String | Required, Trimmed | Full legal student name |
| `department` | String | Required, Indexed | E.g. `CSE`, `ECE`, `MECH` |
| `year` | Number | Required (1 to 4) | Academic year |
| `semester` | Number | Required (1 to 8) | Current semester |
| `section` | String | Required | Section identifier (e.g. `A`) |
| `hostelStatus` | String | Enum, Indexed | `hosteller` or `day_scholar` (Admin controlled) |
| `transportEligible`| Boolean | Default: `false` | Campus bus eligibility |
| `mentorId` | ObjectId | Ref: `Mentor`, Indexed | Assigned proctor |

### 2.3 `attendance`
| Field | Type | Attributes | Description |
|---|---|---|---|
| `studentId` | ObjectId | Ref: `Student`, Required, Indexed | Attending student |
| `subjectCode` | String | Required, Indexed | E.g. `CS8401` |
| `subjectName` | String | Required | Subject title |
| `date` | Date | Required, Indexed | Date of attendance record |
| `period` | Number | Required (1 to 8) | Daily period slot |
| `status` | String | Enum: `present`, `absent`, `od` | Attendance status |
| `facultyId` | ObjectId | Ref: `Faculty` | Faculty who submitted register |

*Index*: Compound index on `{ studentId: 1, date: -1, subjectCode: 1 }`.

### 2.4 `leaveApplications` & `odApplications`
| Field | Type | Attributes | Description |
|---|---|---|---|
| `studentId` | ObjectId | Ref: `Student`, Required, Indexed | Requesting student |
| `mentorId` | ObjectId | Ref: `Mentor`, Required, Indexed | Approving mentor |
| `type` | String | Enum: `medical`, `personal`, `family_event`, `academic` | Reason type |
| `fromDate` | Date | Required | Absence start |
| `toDate` | Date | Required | Absence return date |
| `reason` | String | Required | Explanation |
| `status` | String | Enum: `pending`, `approved`, `rejected` | Review status |
| `mentorRemarks` | String | Optional | Notes from proctor |
| `gatePassId` | String | Unique, Sparse | Alphanumeric gate clearance code |

### 2.5 `complaints`
| Field | Type | Attributes | Description |
|---|---|---|---|
| `ticketId` | String | Unique, Required, Indexed | Formatted identifier (e.g. `CMP-2026-00101`) |
| `studentId` | ObjectId | Ref: `Student`, Required, Indexed | Reporting student |
| `category` | String | Enum: `hostel`, `academic`, `infrastructure`, `electrical`, `plumbing`, `mess`, `transport`, `it` | Category |
| `title` | String | Required | Short summary |
| `description` | String | Required | Detailed issue description |
| `status` | String | Enum: `submitted`, `in_review`, `in_progress`, `resolved`, `closed` | Lifecycle stage |
| `priority` | String | Enum: `low`, `medium`, `high`, `urgent` | Ticket urgency |
| `assignedTo` | ObjectId | Ref: `User` (Maintenance) | Assigned technician |
| `resolutionNotes` | String | Optional | Maintenance resolution report |

### 2.6 `fees`
| Field | Type | Attributes | Description |
|---|---|---|---|
| `studentId` | ObjectId | Ref: `Student`, Required, Indexed | Student account |
| `academicYear` | String | Required | E.g. `2025-2026` |
| `semester` | Number | Required | Semester slot |
| `totalAmount` | Number | Required | Sum of itemized fees |
| `paidAmount` | Number | Default: 0 | Total remitted |
| `status` | String | Enum: `paid`, `partial`, `pending`, `overdue` | Payment state |
| `dueDate` | Date | Required | Fine threshold date |

---

## 3. Database Indexes & Query Optimizations

1. **Compound Search Indexes**:
   - `leaveApplications`: `{ mentorId: 1, status: 1, createdAt: -1 }` for instant mentor queue retrieval.
   - `attendance`: `{ studentId: 1, subjectCode: 1 }` for calculating percentage ratios without full table scans.
   - `complaints`: `{ studentId: 1, status: 1 }` and `{ category: 1, status: 1 }` for department queues.
2. **Text Indexes**:
   - `aiKnowledgeBase`: `{ topic: 'text', content: 'text', keywords: 'text' }` for keyword retrieval.
   - `libraryBooks`: `{ title: 'text', author: 'text', isbn: 'text' }`.
