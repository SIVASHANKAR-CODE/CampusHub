# End-to-End Workflows — CampusHub

This document outlines key operational processes within CampusHub, detailing branching logic, role interactions, and state progressions.

---

## 1. Student Leave & On-Duty (OD) Approval Workflow

The leave workflow enforces hierarchical verification: only the student's designated faculty mentor can review and authorize absences.

```mermaid
sequenceDiagram
    autonumber
    actor Student
    participant API as CampusHub API
    participant DB as MongoDB
    actor Mentor
    actor Security

    Student->>API: POST /api/leave/apply (type, reason, dates, emergency contact)
    API->>DB: Validate ward-mentor relation & store status='pending'
    API-->>Student: Application submitted (Status: Pending Review)
    
    Mentor->>API: GET /api/mentor/leave-requests (Assigned wards only)
    API->>DB: Query LeaveApplications where mentorId matches
    API-->>Mentor: Ward pending leave list with attendance %
    
    alt Mentor Approves
        Mentor->>API: PATCH /api/mentor/leave/:id/approve (remarks)
        API->>DB: Update status='approved', generate gatePassId
        API->>DB: Trigger Notification to Student
        API-->>Mentor: Marked as Approved
        Student->>API: GET /api/leave/my-applications
        API-->>Student: Display Approved Status + Digital Gate Pass (QR Code)
        Student->>Security: Present Digital Gate Pass at Campus Checkpoint
        Security->>API: Verify gatePassId & timestamp
        API-->>Security: Gate clearance valid
    else Mentor Rejects
        Mentor->>API: PATCH /api/mentor/leave/:id/reject (rejection reason)
        API->>DB: Update status='rejected', save mentor comments
        API->>DB: Trigger Notification to Student
        API-->>Mentor: Marked as Rejected
        Student->>API: GET /api/leave/my-applications
        API-->>Student: Display Rejected Status + Reason
    end
```

---

## 2. Complaint & Maintenance Resolution Lifecycle

Tickets are routed based on problem category (Hostel, Electrical, IT, Plumbing, Civil, Mess) to appropriate departments.

```mermaid
stateDiagram-v2
    [*] --> Submitted: Student submits complaint (/api/complaints)
    Submitted --> InReview: System assigns CMP-YYYY-XXXXX & department queue
    
    state InReview {
        [*] --> Triaged
        Triaged --> AssignedToStaff: Maintenance lead assigns technician
    }

    InReview --> InProgress: Technician begins on-site inspection
    
    state InProgress {
        [*] --> MaterialProcurement
        MaterialProcurement --> WorkUnderway
        WorkUnderway --> Verification
    }

    InProgress --> Resolved: Maintenance technician marks resolved + resolution notes
    Resolved --> Closed: Student confirms resolution or auto-closes after 48h
    
    Resolved --> InProgress: Student reopens with feedback
    Closed --> [*]
```

---

## 3. Hostel Status Access Gating Workflow

To prevent unauthorized access or visual clutter, hostel features are protected at both the frontend presentation layer and the backend API authorization layer.

```mermaid
flowchart TD
    User([User Logs In]) --> FetchProfile[Fetch Student Profile from API]
    FetchProfile --> CheckRole{Role == 'student'?}
    
    CheckRole -- No --> RoleRedirect[Redirect to Staff/Admin Dashboard]
    CheckRole -- Yes --> CheckHostel{student.hostelStatus == 'hosteller'?}
    
    CheckHostel -- Yes --> AllowHostel[Show Hostel Navigation Item & Allow /student/hostel Route]
    AllowHostel --> HostellerView[Hosteller Experience: Room Details, Mess Menu, Block Warden, Room Complaints]
    
    CheckHostel -- No (Day Scholar) --> HideHostel[Remove Hostel Item from Navigation]
    HideHostel --> GuardRoute{Direct URL navigation to /student/hostel?}
    GuardRoute -- Yes --> RedirectDash[Redirect to /student with Alert: 'Feature restricted to residential students']
    
    HostellerAPI[API: /api/hostel/*] --> ServerGuard{Backend Verify: req.user.hostelStatus == 'hosteller'}
    ServerGuard -- Allowed --> ReturnHostelData[200 OK: Hostel Data Payload]
    ServerGuard -- Denied --> Forbid[403 Forbidden: 'Access restricted to resident hostellers']
```

---

## 4. Attendance Monitoring & Exam Eligibility Trigger

```mermaid
flowchart LR
    FacultyMark[Faculty Marks Daily Lecture] --> CalcPercent[System Recalculates Cumulative %]
    CalcPercent --> ThresholdCheck{Attendance < 80%?}
    ThresholdCheck -- Yes --> FlagLow[Set lowAttendance Warning Flag]
    FlagLow --> AlertBanner[Render Attention Alert on Student Dashboard]
    FlagLow --> NotifyWard[Send System Notification: Risk of Exam Debarment]
    ThresholdCheck -- No --> ClearWarning[Normal Display: In Good Standing]
```
