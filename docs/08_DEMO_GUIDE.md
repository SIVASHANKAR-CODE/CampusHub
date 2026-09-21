# Demo & Presentation Guide — CampusHub

This guide details demonstration walkthroughs showcasing CampusHub's capabilities across multiple user personas.

---

## 1. Demo Credentials Matrix

All demo accounts share the password: **`Demo@2026`**

| Persona | Role | Email | Key Features to Inspect |
|---|---|---|---|
| **Aarav Patel** | Student (Hosteller) | `student@demo.com` | Attendance warning, hostel block room, mess menu, leave application, fee status |
| **Sneha Reddy** | Student (Day Scholar) | `student2@demo.com` | **Hostel isolation check** (no hostel tabs), transit bus route pass |
| **Prof. Ananthakrishnan** | Faculty | `faculty@demo.com` | Attendance roster marking, lecture schedule, departmental notices |
| **Dr. Priya Raman** | Mentor / Proctor | `mentor@demo.com` | Ward approval queue, leave/OD review, attendance drill-down |
| **Kavitha Sundaram** | Administrator | `admin@demo.com` | Operational metrics, student roster, role controls, system audit logs |
| **Ramesh Kumar** | Maintenance Staff | `maintenance@demo.com` | Assigned ticket queue (`CMP-2026-00101`), status updates, work notes |
| **Suresh Babu** | Transport Driver | `driver@demo.com` | Bus route status, stop progression |

---

## 2. Guided Walkthrough Scenarios

### Scenario A: The Hosteller Student Experience
1. Navigate to `/login` and click **Student (Demo)** or enter `student@demo.com` / `Demo@2026`.
2. Observe the **Student Dashboard**:
   - Notice the **Attendance Gauge**: A clear warning highlights subjects where attendance is below 80% with an explanation of exam eligibility consequences.
   - The **Upcoming Lecture** tile shows today's immediate class based on the live timetable.
   - The **Due Fees** banner alerts the student of upcoming payment deadlines.
3. Open the **Hostel** tab (`/student/hostel`):
   - View allocated room (Kaveri Hostel, Room 304), bed number, roommate info, and today's mess menu.
4. Navigate to **Leave / OD** (`/student/leave`):
   - Submit a new leave request (Reason: "Family function", dates: upcoming weekend).
   - The application status appears as `Pending Mentor Approval`.

---

### Scenario B: Strict Hostel Isolation (Day Scholar Verification)
1. Log out and sign in as `student2@demo.com` (Sneha Reddy — Day Scholar).
2. Inspect the sidebar / navigation:
   - Notice that the **Hostel** tab is completely absent from the UI.
3. Attempt direct navigation by typing `/student/hostel` into the browser URL bar:
   - The application guards the route and redirects to `/student`, displaying: *"This module is restricted to residential students."*
4. Open the **Transport** tab (`/student/transport`):
   - View allocated Bus Route #12, pickup point (Anna Nagar Circle), and assigned driver contact.

---

### Scenario C: Mentor Review & Digital Gate Pass Generation
1. Sign in as `mentor@demo.com` (Dr. Priya Raman).
2. The dashboard automatically loads the **Mentor Portal**:
   - Inspect the **Assigned Wards** list.
   - Click on the **Leave & OD Requests** panel.
3. Review the application submitted by Aarav Patel in Scenario A:
   - Check Aarav's current attendance rate displayed directly on the review card.
   - Click **Approve** and append a mentor remark: *"Approved. Ensure assignments are submitted on Monday."*
4. Switch back to student account `student@demo.com`:
   - Notice the updated status: **Approved**.
   - Click **View Gate Pass** to display the digital pass with QR code and verification ID for campus security.

---

### Scenario D: Grievance Resolution Lifecycle
1. As `student@demo.com`, navigate to **Complaints** (`/student/complaints`).
2. Submit a new ticket:
   - Category: `Electrical`
   - Title: *"Ceiling fan regulator not working"*
   - Priority: `Medium`
   - The system generates an official ticket ID (e.g. `CMP-2026-00105`).
3. Sign in as `maintenance@demo.com`:
   - View the technician work order dashboard.
   - Locate ticket `CMP-2026-00105`.
   - Update status to `In Progress` with note: *"Technician dispatched with replacement capacitor."*
   - Change status to `Resolved`.
4. Return to the student dashboard:
   - A notification alerts the student that their ticket has been successfully resolved.

---

### Scenario E: Faculty Lecture Attendance Entry
1. Sign in as `faculty@demo.com`.
2. Select **Mark Attendance**:
   - Select Course: `CS8401 — Data Structures & Algorithms`, Section `A`.
   - The student roster loads with default "Present".
   - Toggle specific students to "Absent" or "OD".
   - Click **Submit Attendance Register**.
3. Re-check the student account to verify instant percentage recalculation.
