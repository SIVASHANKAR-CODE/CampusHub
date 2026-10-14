# CampusHub — Master Build Prompt

### Unified AI Campus Platform — Production-Ready PWA

# BUILD A PRODUCTION-READY UNIFIED AI CAMPUS PWA

You are a senior product architect, UX/UI designer, full-stack engineer, security engineer, database architect, and DevOps engineer.

I want you to design and build a **production-ready, real-world, product-based Progressive Web Application (PWA)** called:

# "CampusOne"

### Unified AI Campus Platform

The product should solve the problem that college students currently use multiple disconnected channels for fees, exams, attendance, timetable, leave/OD, complaints, hostel, transport, clubs, events, library, campus information, navigation, lost & found, and other student services.

The goal is to create **ONE unified digital campus platform** where students, faculty, administrators, maintenance staff, transport staff, security staff, mentors, and club presidents can perform their respective activities from a single application.

This must NOT look like a student mini-project.

It should look like a **real SaaS/product company application** designed by a world-class professional UI/UX team.

The application should feel:

- Professional
- Modern
- Premium
- Attractive
- Clean
- Fast
- Easy to understand
- Easy for first-time users
- Mobile-first
- Responsive
- Accessible
- Trustworthy
- Enterprise-ready
- Production-ready

IMPORTANT:

Do NOT make the UI look AI-generated.

Do NOT overuse gradients, glassmorphism, glowing effects, neon colors, unnecessary animations, excessive rounded cards, or futuristic AI visuals.

The design should look like a carefully designed product from a top technology company.

---

# 1. CORE TECHNOLOGY STACK

Use exactly this architecture unless there is a strong technical reason otherwise.

## Frontend

- React.js
- Vite
- JavaScript or TypeScript
- React Router
- Modern component architecture
- Responsive PWA
- Service Worker
- Web App Manifest
- Installable on Android, iOS-supported browsers, Windows and desktop browsers

## Backend

- Node.js
- Express.js
- Serverless architecture
- Vercel deployment

IMPORTANT:

The backend must NOT depend on a traditional always-running Express server.

Adapt Express.js to work correctly with Vercel Serverless Functions.

Use a structure compatible with:

/api

or another clean Vercel-compatible serverless architecture.

Do NOT use:

- app.listen()
- long-running server processes
- local-only backend assumptions
- WebSocket-only architecture that breaks on Vercel Serverless

The application must be deployable using Vercel.

---

# 2. DATABASE

Use:

MongoDB

Prefer MongoDB Atlas for cloud deployment.

Create a clean scalable database structure.

Main collections should include:

- users
- students
- faculty
- admins
- mentors
- attendance
- fees
- exams
- results
- timetables
- leaveApplications
- odApplications
- announcements
- complaints
- maintenanceRequests
- hostelStudents
- transportBuses
- transportStudents
- busRoutes
- clubs
- clubMembers
- clubRequests
- campusEvents
- externalEvents
- libraryBooks
- questionPapers
- lostAndFound
- campusLocations
- notifications
- aiKnowledgeBase
- auditLogs

Avoid unnecessary duplication.

Use references/ObjectIds wherever appropriate.

Create proper indexes for frequently searched data.

---

# 3. AUTHENTICATION AND SECURITY

Authentication must use:

## Argon2id

Passwords must NEVER be stored as plain text.

Implement:

- Password hashing using Argon2id
- Secure login
- Session/token-based authentication
- Role-based authorization
- Protected routes
- Secure HTTP-only cookies where appropriate
- Input validation
- Request validation
- Rate limiting
- Security headers
- CORS configuration
- Authentication middleware
- Authorization middleware
- Audit logging
- Secure error handling
- No password exposure in API responses

Never return:

- password hashes
- authentication secrets
- private credentials

to the frontend.

Use environment variables for secrets.

Example:

MONGODB_URI=
JWT_SECRET=
ARGON2_MEMORY_COST=
AI_API_KEY=
CLOUDINARY_URL=
VITE_API_URL=

Never hardcode secrets.

---

# 4. ROLE-BASED ACCESS CONTROL

Create a proper RBAC system.

Roles:

1. Student
2. Faculty
3. Mentor
4. Admin
5. Maintenance Staff
6. Transport Staff
7. Driver
8. Security Staff
9. Club President

Admin must have the highest management privileges.

Create permissions based on role instead of simply checking UI visibility.

IMPORTANT:

Frontend hiding a button is NOT security.

Backend APIs must independently verify permissions.

---

# 5. STUDENT MODULE

Students should have a personalized dashboard.

Dashboard should show:

- Student name
- Profile photo
- Registration number
- Department
- Year
- Section
- Current semester
- Attendance percentage
- Fee status
- Upcoming exams
- Today's timetable
- Pending applications
- Important announcements
- Campus events
- Notifications
- Complaint status
- Quick actions

Quick actions:

- Fees
- Attendance
- Timetable
- Exams
- Results
- Apply Leave
- Apply OD
- Complaints
- Hostel
- Transport
- Library
- Clubs
- Events
- Lost & Found
- Question Papers
- AI Campus Assistant
- Campus Navigation

---

# 6. FEES MODULE

Student should be able to view:

- Semester fee
- Tuition fee
- Transport fee
- Hostel fee if applicable
- Other fees
- Due amount
- Paid amount
- Payment status
- Payment history
- Transaction/reference number
- Payment date

Example:

SEMESTER 3

Total Fee: ₹50,000
Paid: ₹35,000
Due: ₹15,000

Create a clean financial dashboard.

If student is a day scholar:

Do NOT show hostel fee information.

If student is a hostel student:

Show hostel-related fees.

Admin can update fee records.

---

# 7. EXAM MODULE

Students can view:

- Upcoming exams
- Exam timetable
- Subject
- Date
- Time
- Room
- Exam type

Examples:

Internal Exam
Model Exam
Semester Exam
Practical Exam

Results section:

- Subject
- Marks
- Grade
- Result
- GPA/CGPA if applicable
- Semester history

Admin/faculty authorized users can upload/update results.

Students have read-only access.

---

# 8. TIMETABLE MODULE

Admin should be able to create and manage class-wise timetables.

Timetable should support:

- Department
- Year
- Semester
- Section
- Day
- Period
- Subject
- Faculty
- Room
- Lab

Students should automatically see their class timetable.

Faculty should see their teaching timetable.

Provide:

- Daily view
- Weekly view

Make it extremely easy to understand on mobile.

---

# 9. LEAVE AND OD MODULE

Students can apply for:

## Leave

Fields:

- Date
- Start date
- End date
- Reason
- Description
- Supporting document if required

## OD

Fields:

- Date
- Event/program
- Organization
- Reason
- Supporting document
- Description

Workflow:

Student
↓
Application Submitted
↓
Mentor receives notification
↓
Mentor reviews
↓
Approve / Reject
↓
Student receives notification
↓
Application history updated

Both student and mentor must be able to view the application.

Status:

- Pending
- Approved
- Rejected
- Cancelled

Record timestamps and reviewer information.

---

# 10. ATTENDANCE MODULE

Show attendance:

## Subject-wise

Example:

Data Structures
Present: 38
Total: 45
Attendance: 84.4%

Computer Networks
Present: 32
Total: 45
Attendance: 71.1%

## Overall Attendance

Calculate automatically.

IMPORTANT:

If attendance falls below 80%, show a warning.

Example:

"Attendance Warning"

"Your attendance in Computer Networks is below the required threshold."

Do not only show a red number.

Clearly explain:

- Current percentage
- Required percentage
- Total classes
- Present
- Absent

Faculty can mark attendance for their assigned subjects.

Mentors can view students under their responsibility.

Admin can audit attendance.

---

# 11. CAMPUS EVENTS

Admin can create internal college events.

Fields:

- Event name
- Description
- Date
- Time
- Venue
- Organizer
- Image/poster
- Registration deadline
- Registration link
- Capacity

Students can:

- View
- Search
- Filter
- Register

Create categories:

- Technical
- Cultural
- Sports
- Workshop
- Seminar
- Hackathon
- Placement
- Club
- Other

---

# 12. COMPLAINT MANAGEMENT

Create a complete complaint/ticket management system.

Students can raise complaints.

Complaint categories:

## Academic

- Faculty
- Classroom
- Exam
- Academic services
- Other

## Hostel

- Room
- Water
- Electricity
- Food
- Wi-Fi
- Cleaning
- Maintenance
- Security
- Other

## Transport

- Bus
- Driver
- Route
- Timing
- Other

## Facilities

- Classroom
- Lab
- Library
- Washroom
- Electricity
- Wi-Fi
- Furniture
- Equipment
- Other

Complaint workflow:

Student
↓
Create complaint
↓
Ticket generated
↓
Admin receives complaint
↓
Admin verifies
↓
Admin assigns to Maintenance Staff / relevant department
↓
Staff takes action
↓
Status updated
↓
Student receives notification
↓
Complaint resolved
↓
Student can view resolution

Statuses:

- Submitted
- Under Review
- Assigned
- In Progress
- Resolved
- Rejected
- Closed

Generate unique complaint/ticket IDs.

Example:

CMP-2026-00124

Students should be able to track their complaint.

---

# 13. HOSTEL MODULE

Hostel functionality must depend on the student's current hostel status.

Student types:

1. Day Scholar
2. Hostel Student

IMPORTANT:

This is controlled ONLY by Admin.

A student cannot change their own hostel status.

If:

hostelStatus = "hosteller"

show:

- Hostel Dashboard
- Room
- Block
- Warden information
- Hostel complaints
- Hostel announcements
- Hostel-related services

If:

hostelStatus = "day_scholar"

DO NOT SHOW hostel options.

Admin can:

- Add hostel student
- Remove hostel student
- Assign room
- Change block
- Change hostel status
- Update hostel information

When a student vacates hostel:

Admin changes status to:

day_scholar

Immediately hide hostel-related features from that student's account.

---

# 14. TRANSPORT MODULE

Transport is only available for eligible day scholars.

Transport staff can create buses.

Example:

BUS TN-01
Route: Salem → College
Driver: XXXXX
Capacity: 50

Transport staff can:

- Create bus
- Edit bus
- Assign driver
- Add student
- Remove student
- Assign route
- Update bus status

Driver can:

- View assigned bus
- View assigned students
- View route
- Start trip
- End trip
- Update current location if supported

Student can:

- View assigned bus
- View driver details
- View route
- View pickup point
- Track bus

Implement tracking using a Vercel-compatible approach.

Do NOT build the system around a persistent WebSocket server.

For MVP:

Use periodic location updates / polling.

Keep the architecture extensible for future real-time tracking.

---

# 15. FACILITIES MODULE

Create a facilities directory.

Students can discover:

- Labs
- Classrooms
- Library
- Auditorium
- Seminar Hall
- Sports facilities
- Cafeteria
- Medical room
- Office
- Administrative blocks
- Parking
- Other campus facilities

Show:

- Name
- Description
- Location
- Opening hours
- Contact
- Availability if applicable

---

# 16. CLUB MANAGEMENT

Admin controls club creation.

Student cannot directly create a club.

Workflow:

Student
↓
Request New Club
↓
Admin Review
↓
Admin Approves
↓
Admin creates club
↓
Admin assigns Club President
↓
Club President gets club management access

Club President can:

- Add members
- Remove members
- View members
- Create club announcements
- Create club events
- Share club content

Admin can:

- Create club
- Delete club
- Approve/reject club requests
- Assign president
- Remove president
- Manage club members

Create separate club groups.

Examples:

- Coding Club
- Cyber Security Club
- Robotics Club
- AI Club
- Cultural Club
- Sports Club

---

# 17. ANNOUNCEMENT SYSTEM

Create a centralized notice board.

Admin can publish:

- Exam results
- Exam notifications
- Events
- Holidays
- Fee notices
- Transport notices
- Hostel notices
- Academic notices
- Emergency announcements
- General notices

Support:

- Title
- Description
- Category
- Attachment
- Priority
- Publish date
- Expiry date
- Target audience

Target audience can be:

- Everyone
- Specific department
- Specific year
- Specific section
- Faculty
- Hostel students
- Day scholars

---

# 18. LIBRARY ASSISTANT

Create a searchable library system.

Student searches:

"Data Structures"

System should show:

Book found / not found.

If available:

Book Name
Author
ISBN
Book ID
Shelf
Available Copies
Total Copies

Example:

Data Structures and Algorithms

Available Copies: 3
Shelf: C-12

If unavailable:

"Currently unavailable"

Optionally show:

- Issued
- Reserved
- Expected return date

Admin/library staff can:

- Add books
- Edit books
- Remove books
- Update copies
- Update availability

---

# 19. AI CAMPUS ASSISTANT

Create:

# AI Campus Assistant

The AI assistant should provide a conversational interface for campus-related questions.

Examples:

"Library eppo close aagum?"

"Office room eppo open?"

"Fees collection center open ah?"

"Where is Computer Lab 3?"

"When is the next exam?"

"What is my attendance?"

"How much fee do I have to pay?"

"Where is the library?"

"Are there any events today?"

"How can I apply for OD?"

"How do I raise a hostel complaint?"

The AI should answer using authorized campus information.

IMPORTANT:

Do NOT allow the AI to invent campus information.

Use a controlled knowledge/data layer.

For campus-specific questions:

AI should retrieve relevant information from MongoDB / knowledge base before generating the answer.

For personal student questions:

AI must retrieve only the authenticated student's authorized information.

Example:

Student asks:

"What is my attendance?"

The backend should retrieve ONLY that logged-in student's attendance.

Never allow one student to access another student's private information.

Implement an AI service abstraction so that the LLM provider can be configured through environment variables.

Do NOT hardcode API keys.

Structure:

AI Chat UI
↓
Backend AI API
↓
Intent Detection
↓
Permission Check
↓
Data Retrieval
↓
AI Response Generation
↓
Response

For high-risk actions, AI must not perform changes automatically.

For example:

AI may explain how to apply leave.

But it should not approve leave.

---

# 20. CAMPUS NAVIGATION

Create a campus navigation system.

Students can search:

- Classroom
- Lab
- Library
- Office
- Department
- Hostel
- Bus stop
- Auditorium
- Cafeteria
- Sports ground
- Other locations

Show:

- Building
- Floor
- Room number
- Description
- Directions

Design this so that a future map integration can be added.

For MVP, create an internal campus map/location directory.

---

# 21. LOST AND FOUND

Students can create Lost & Found posts.

Fields:

- Lost / Found
- Item name
- Description
- Image
- Location
- Date
- Contact method
- Status

Students can:

- View posts
- Search
- Filter
- Report found
- Mark resolved

Admin can moderate posts.

Add abuse/report functionality.

---

# 22. PREVIOUS YEAR QUESTION PAPERS

Admin can upload previous-year question papers.

Fields:

- Department
- Subject
- Semester
- Year
- Exam type
- Academic year
- PDF

Students can:

- Search
- Filter
- Preview metadata
- Download/view papers

Do NOT expose private admin upload functionality to students.

---

# 23. NOTIFICATION SYSTEM

Create a centralized notification system.

Notify students when:

- Leave approved/rejected
- OD approved/rejected
- Complaint status changes
- Attendance warning
- New announcement
- New event
- Exam schedule posted
- Results published
- Fee due reminder
- Transport update
- Hostel update
- Club notification

Create notification types:

- INFO
- WARNING
- SUCCESS
- IMPORTANT
- EMERGENCY

---

# 24. FACULTY MODULE

Faculty dashboard:

- Today's timetable
- Assigned subjects
- Attendance
- Student list
- Leave/OD requests where applicable
- Announcements
- Notifications

Faculty can:

- Mark attendance
- Edit attendance according to permissions
- View assigned students
- View subject attendance
- Publish permitted academic information

Faculty should NOT access unrelated administrative functionality.

---

# 25. MENTOR MODULE

Mentor dashboard:

- Assigned students
- Attendance overview
- Low-attendance students
- Leave requests
- OD requests
- Student alerts
- Notifications

Mentor can:

- Review leave
- Review OD
- Approve
- Reject
- Add remarks
- View student academic overview

---

# 26. ADMIN DASHBOARD

Admin dashboard should be the central control panel.

Show:

- Total students
- Faculty
- Hostellers
- Day scholars
- Pending complaints
- Active complaints
- Low attendance students
- Upcoming exams
- Upcoming events
- Pending leave requests
- Pending OD requests
- Active buses
- Club statistics
- Library statistics

Admin management modules:

- Students
- Faculty
- Mentors
- Fees
- Exams
- Results
- Timetable
- Attendance
- Complaints
- Hostel
- Transport
- Clubs
- Events
- Announcements
- Library
- Question Papers
- Lost & Found
- Campus Locations
- AI Knowledge Base
- Notifications
- Audit Logs

---

# 27. MAINTENANCE STAFF

Maintenance dashboard:

- Assigned complaints
- Priority
- Location
- Description
- Student information where appropriate
- Status
- Action notes
- Resolution evidence

Staff can update:

Assigned
↓
In Progress
↓
Resolved

They should not access unrelated student academic information.

---

# 28. SECURITY STAFF

Security dashboard can include:

- Visitor information
- Campus alerts
- Emergency announcements
- Lost & Found moderation support
- Transport/security information

Keep permissions strictly limited.

---

# 29. UI/UX DESIGN REQUIREMENTS

This is extremely important.

The application must NOT look like a generic React admin template.

Create a professional design system.

Design inspiration should be based on the principles used by high-quality technology products such as:

- Google
- Microsoft
- Apple
- Linear
- Notion
- Stripe
- Airbnb

Do NOT copy their interfaces.

Instead, learn from their:

- Information hierarchy
- Spacing
- Typography
- Accessibility
- Navigation
- Component consistency
- Interaction design
- Visual simplicity

The final product must have its own identity.

---

# 30. VISUAL DESIGN

Use a professional modern color system.

Suggested foundation:

Primary:
Deep professional blue

Secondary:
Neutral/slate

Success:
Green

Warning:
Amber

Error:
Red

Background:
Very light neutral

Dark mode:
Professional dark neutral theme

Do not use too many colors.

Use colors mainly to communicate status and hierarchy.

---

# 31. TYPOGRAPHY

Use a clean modern font such as:

Inter

or

another highly readable professional sans-serif.

Typography hierarchy:

- Large dashboard headings
- Medium section headings
- Clear labels
- Readable body text
- Small metadata

Do not make everything bold.

---

# 32. RESPONSIVE DESIGN

Must work perfectly on:

- Mobile
- Tablet
- Laptop
- Desktop
- Large screens

Mobile-first design is mandatory.

Student users will primarily use mobile devices.

Navigation should adapt.

Desktop:

Sidebar + content

Mobile:

Bottom navigation / collapsible navigation

---

# 33. STUDENT MOBILE NAVIGATION

Suggested bottom navigation:

Home
Services
AI
Notifications
Profile

Inside Services:

Fees
Attendance
Exams
Timetable
Leave/OD
Complaints
Hostel
Transport
Library
Clubs
Events
Lost & Found
Question Papers
Campus Navigation

---

# 34. UX PRINCIPLES

Every important action should be easy to understand.

For example:

Do NOT make students search through multiple pages to apply leave.

Use:

Dashboard
→ Apply Leave
→ Form
→ Submit
→ Confirmation

Similarly:

Dashboard
→ Complaint
→ Select category
→ Describe issue
→ Upload image
→ Submit

Use:

- Empty states
- Loading states
- Skeleton screens
- Success states
- Error states
- Confirmation dialogs
- Toast notifications
- Search
- Filters
- Pagination
- Sorting
- Form validation

---

# 35. ACCESSIBILITY

Implement:

- Proper contrast
- Keyboard navigation
- Accessible labels
- Semantic HTML
- Focus states
- Screen-reader-friendly controls
- Touch-friendly buttons
- Minimum reasonable touch target size

Do not rely only on color to communicate status.

---

# 36. PWA FEATURES

Implement a real PWA.

Include:

manifest.webmanifest

service worker

installability

offline fallback

app icons

splash behavior where supported

responsive layout

cached static assets

Network-aware UX.

For sensitive information:

DO NOT cache private API responses insecurely.

Show an offline screen/message when required.

Example:

"You are offline. Some campus services may be temporarily unavailable."

---

# 37. BACKEND API ARCHITECTURE

Create REST APIs.

Example:

/api/auth/login
/api/auth/logout
/api/auth/me

/api/students
/api/students/:id

/api/fees
/api/attendance
/api/exams
/api/results
/api/timetable

/api/leave
/api/od

/api/complaints
/api/maintenance

/api/hostel
/api/transport

/api/clubs
/api/events
/api/announcements

/api/library
/api/question-papers
/api/lost-found

/api/campus-locations

/api/notifications

/api/ai/chat

Use proper HTTP methods:

GET
POST
PUT/PATCH
DELETE

Use consistent response format.

Example:

{
"success": true,
"message": "Attendance fetched successfully",
"data": {}
}

Error:

{
"success": false,
"message": "Unauthorized"
}

---

# 38. SERVERLESS VERCEL ARCHITECTURE

This is mandatory.

The final application must work with:

Frontend → Vercel
Backend API → Vercel Serverless Functions
Database → MongoDB Atlas

Do NOT create a separate always-running backend server.

Avoid:

app.listen()

Instead, expose Express through a Vercel-compatible serverless entry point.

Create appropriate:

vercel.json

API structure

environment configuration

build configuration

frontend API configuration

The architecture should support:

Development:

localhost frontend

- localhost/serverless-compatible API development

Production:

Vercel frontend

- Vercel API
- MongoDB Atlas

  ***

# 39. DATABASE CONNECTION

MongoDB connection must be serverless-safe.

Do NOT create a new database connection on every request unnecessarily.

Implement connection caching/reuse suitable for serverless environments.

Use:

MONGODB_URI

from environment variables.

Never expose:

MONGODB_URI

to the browser.

---

# 40. FILE STORAGE

For:

- Profile images
- Complaint images
- Event posters
- Question papers
- Lost & Found images
- Supporting documents

Do NOT depend on local filesystem storage in production.

Use a cloud-compatible storage abstraction.

Make it configurable through environment variables.

For example:

Cloudinary / another object storage provider.

Keep the storage provider replaceable.

---

# 41. DATA VALIDATION

Use schema validation for:

- Login
- Student forms
- Leave
- OD
- Complaints
- Events
- Clubs
- Library
- Fees
- Transport

Reject invalid requests at backend level.

Never trust frontend validation alone.

---

# 42. AUDIT LOGGING

Create audit logs for important administrative operations.

Examples:

Admin changed student hostel status.

Admin updated fee.

Mentor approved leave.

Admin deleted club.

Transport staff removed student from bus.

Record:

- actor
- role
- action
- resource
- timestamp
- relevant metadata

---

# 43. ANTI-ABUSE AND SECURITY

Implement reasonable protection against:

- Brute force
- Spam complaints
- Fake lost/found posts
- Unauthorized access
- IDOR
- Privilege escalation
- Malicious file uploads
- Invalid input
- Excessive API requests
- Unauthorized role changes

Use:

- Rate limiting
- Validation
- Authorization checks
- File type restrictions
- File size restrictions
- Audit logs
- Secure headers
- Sanitization where required

---

# 44. SEARCH

Implement global search where useful.

Students should be able to search:

- Events
- Announcements
- Books
- Question papers
- Campus locations
- Clubs
- Lost & Found

Use filters and clear results.

---

# 45. DEMO MODE

Create a complete working demo environment.

Create demo accounts for every role.

Example:

Student:
[student@demo.com](mailto:student@demo.com)

Faculty:
[faculty@demo.com](mailto:faculty@demo.com)

Mentor:
[mentor@demo.com](mailto:mentor@demo.com)

Admin:
[admin@demo.com](mailto:admin@demo.com)

Maintenance:
[maintenance@demo.com](mailto:maintenance@demo.com)

Transport:
[transport@demo.com](mailto:transport@demo.com)

Driver:
[driver@demo.com](mailto:driver@demo.com)

Security:
[security@demo.com](mailto:security@demo.com)

Club President:
[clubpresident@demo.com](mailto:clubpresident@demo.com)

Use a common demo password only for local/demo environment.

IMPORTANT:

Clearly label these as demo accounts.

Create realistic demo data.

Student demo should contain:

- Fees
- Attendance
- Exams
- Results
- Timetable
- Leave applications
- OD applications
- Complaints
- Events
- Library books
- Notifications
- Clubs
- Transport
- Hostel/day-scholar state

Admin demo should have enough data to demonstrate the entire platform.

---

# 46. DEMO SCENARIOS

The application must demonstrate complete end-to-end workflows.

## Scenario 1

Student logs in.

↓
Dashboard

↓
Checks attendance

↓
Sees one subject below 80%

↓
Receives warning.

---

## Scenario 2

Student applies Leave.

↓
Mentor receives notification.

↓
Mentor opens application.

↓
Mentor approves.

↓
Student receives notification.

---

## Scenario 3

Student raises hostel complaint.

↓
Admin verifies.

↓
Admin assigns maintenance staff.

↓
Maintenance staff updates status.

↓
Student sees:

"Resolved"

---

## Scenario 4

Admin changes student from Hostel Student to Day Scholar.

↓
Student logs in again.

↓
Hostel section disappears.

---

## Scenario 5

Admin creates bus.

↓
Assigns driver.

↓
Adds students.

↓
Driver sees assigned students.

↓
Student sees bus and route.

---

## Scenario 6

Student searches:

"Python books"

↓
Library results appear.

↓
Available copies shown.

---

## Scenario 7

Student asks AI:

"When does the library close?"

↓
AI retrieves campus information.

↓
Provides answer.

---

## Scenario 8

Student asks:

"Where is Computer Lab 3?"

↓
AI/location system provides location.

---

# 47. ERROR HANDLING

Every API must have proper error handling.

Frontend should show human-readable messages.

Example:

Instead of:

"MongoServerSelectionError"

show:

"Unable to load your information right now. Please try again."

Log technical details only on the server.

---

# 48. PROJECT STRUCTURE

Create a clean professional folder structure.

Suggested:

/campusone

/frontend
/src
/components
/pages
/layouts
/features
/hooks
/services
/utils
/routes
/contexts
/assets

/backend
/api
/controllers
/models
/routes
/middleware
/services
/utils
/validators
/config

/shared

/docs

/public

Keep frontend and backend modular.

Do NOT create one giant file.

Do NOT put all API logic inside React components.

Do NOT put database logic inside route definitions.

Use separation of concerns.

---

# 49. DOCUMENTATION

Create these documents inside:

/docs

## 01_PRD.md

Include:

- Product vision
- Problem statement
- Target users
- Goals
- Non-goals
- Features
- User stories
- Functional requirements
- Non-functional requirements
- Success metrics
- MVP scope
- Future scope

---

## 02_ARCHITECTURE.md

Include:

- System architecture
- Frontend architecture
- Backend architecture
- Serverless architecture
- MongoDB architecture
- Authentication architecture
- RBAC
- API architecture
- AI architecture
- File storage architecture
- Notification architecture
- Deployment architecture

---

## 03_END_TO_END_WORKFLOW.md

Document complete workflows for:

- Student login
- Admin login
- Faculty login
- Mentor login
- Leave
- OD
- Attendance
- Fees
- Exams
- Results
- Timetable
- Complaints
- Maintenance
- Hostel
- Transport
- Clubs
- Events
- Library
- AI Assistant
- Navigation
- Lost & Found
- Question Papers
- Notifications

Use diagrams where useful using Mermaid.

---

## 04_DATABASE_SCHEMA.md

Document every MongoDB collection.

For every collection explain:

- Fields
- Data types
- Required fields
- Relationships
- Indexes

---

## 05_API_DOCUMENTATION.md

Document:

- Endpoint
- HTTP method
- Authentication
- Required role
- Request body
- Response
- Errors

---

## 06_SECURITY.md

Document:

- Argon2id
- Authentication
- Authorization
- RBAC
- Rate limiting
- Validation
- File security
- Audit logs
- Environment variables
- Security headers
- Threat model
- OWASP considerations

---

## 07_DEPLOYMENT.md

Explain step-by-step deployment to:

Vercel

- MongoDB Atlas

Include:

- Environment variables
- Build configuration
- Vercel configuration
- MongoDB Atlas configuration
- Production deployment
- Common errors
- Troubleshooting

---

## 08_DEMO_GUIDE.md

Explain:

- Demo accounts
- Passwords
- Demo workflows
- What to show during presentation
- Complete product demonstration sequence

---

# 50. LANDING PAGE

Create a professional landing page.

Hero:

"One Campus. Everything Connected."

Subheading:

"A unified digital campus platform for students, faculty and campus teams."

CTA:

"Explore Campus"

"Demo Login"

Sections:

- Campus services
- Student experience
- AI Campus Assistant
- Smart complaints
- Attendance
- Fees
- Events
- Transport
- Library
- Clubs
- Campus navigation

Do not make the landing page overly flashy.

It should feel like a professional SaaS company website.

---

# 51. DESIGN DETAILS

Use:

- Consistent spacing system
- Reusable cards
- Professional tables
- Clean forms
- Clear status badges
- Responsive modals
- Accessible dialogs
- Proper hover states
- Smooth but subtle transitions
- Skeleton loading
- Empty states
- Error states

Animations should be subtle.

Do NOT animate everything.

The application must prioritize usability over visual effects.

---

# 52. MOBILE UX

For mobile:

- Bottom navigation
- Floating quick actions where appropriate
- Large touch targets
- Swipe-friendly cards only when useful
- Sticky important actions
- Responsive tables converted into cards where necessary
- Mobile-friendly forms

The application should feel like a native mobile app even though it is a PWA.

---

# 53. PERFORMANCE

Optimize:

- Lazy loading
- Code splitting
- Image optimization
- API calls
- Database queries
- MongoDB indexes
- Caching where safe
- Bundle size

Avoid unnecessary API calls.

Do not fetch the entire database to display a small list.

Use pagination.

---

# 54. CODE QUALITY

Write production-quality code.

Requirements:

- Clean architecture
- Reusable components
- Meaningful names
- No duplicate logic
- No hardcoded secrets
- No unnecessary dependencies
- Proper error handling
- Proper loading states
- Proper API abstraction
- Environment configuration

Avoid:

- giant components
- spaghetti code
- duplicate API calls
- inline database queries everywhere
- insecure authentication
- fake backend responses

---

# 55. IMPORTANT: NO FAKE FUNCTIONALITY

The application must actually work.

Do NOT create buttons that only display:

"Coming Soon"

for core features.

Implement actual:

- authentication
- database operations
- APIs
- CRUD
- role permissions
- notifications
- workflows
- demo data

If a feature cannot be fully implemented because an external service is required, create a clean abstraction and document the required environment variable/setup.

---

# 56. ADMIN DATA CONTROL

Admin must be able to create/update:

- Students
- Faculty
- Mentors
- Fees
- Exams
- Results
- Timetable
- Events
- Announcements
- Hostel status
- Transport
- Clubs
- Library books
- Question papers
- Campus locations
- AI knowledge information

Admin should have proper CRUD interfaces.

---

# 57. STUDENT PRIVACY

Students should only see their own:

- Fees
- Attendance
- Results
- Applications
- Complaints
- Hostel information
- Transport information
- Personal information

Never allow:

Student A → Student B private data.

Mentor should only access assigned students.

Faculty should only access authorized academic information.

---

# 58. FINAL ACCEPTANCE CRITERIA

Before considering the project complete, verify:

[ ] Student can register/login according to the defined system
[ ] Admin login works
[ ] Faculty login works
[ ] Mentor login works
[ ] Maintenance login works
[ ] Transport login works
[ ] Driver login works
[ ] Security login works
[ ] Club President login works
[ ] Argon2id password hashing works
[ ] RBAC works
[ ] MongoDB connection works
[ ] Fees work
[ ] Attendance works
[ ] Attendance warning works
[ ] Exams work
[ ] Results work
[ ] Timetable works
[ ] Leave workflow works
[ ] OD workflow works
[ ] Complaints work
[ ] Maintenance workflow works
[ ] Hostel status logic works
[ ] Day Scholar does not see hostel
[ ] Hostel student sees hostel
[ ] Transport works
[ ] Clubs work
[ ] Club request workflow works
[ ] Events work
[ ] Announcements work
[ ] Library search works
[ ] Question papers work
[ ] Lost & Found works
[ ] Campus navigation works
[ ] AI Campus Assistant works with authorized data
[ ] Notifications work
[ ] PWA installation works
[ ] Responsive design works
[ ] Mobile UI works
[ ] Error handling works
[ ] Loading states work
[ ] Audit logs work
[ ] Demo accounts work
[ ] Vercel deployment configuration works
[ ] MongoDB Atlas production configuration works
[ ] No secrets are exposed
[ ] No app.listen() exists in production backend
[ ] Serverless API architecture works
[ ] Production build succeeds

---

# 59. DEVELOPMENT APPROACH

Do NOT try to create everything as one huge untested implementation.

Build in phases.

## PHASE 1

Project setup

- React
- Vite
- Express
- Vercel serverless structure
- MongoDB
- Argon2id
- Authentication
- RBAC
- Base UI system
- PWA

## PHASE 2

Student dashboard

- Profile
- Fees
- Attendance
- Exams
- Results
- Timetable

## PHASE 3

Applications

- Leave
- OD
- Notifications

## PHASE 4

Campus services

- Complaints
- Maintenance
- Hostel
- Transport

## PHASE 5

Community

- Clubs
- Events
- Announcements
- Lost & Found

## PHASE 6

Knowledge

- Library
- Question Papers
- Campus Navigation

## PHASE 7

AI

- AI Campus Assistant
- Campus knowledge retrieval
- Student-specific authorized queries

## PHASE 8

Production

- Security
- Performance
- Testing
- Demo data
- Documentation
- Vercel deployment

After each phase, test the existing functionality before continuing.

---

# 60. TESTING

Create tests for important functionality.

At minimum test:

- Authentication
- Authorization
- Student data isolation
- Admin permissions
- Leave approval
- OD approval
- Attendance calculation
- Fee calculation
- Complaint workflow
- Hostel visibility logic
- Transport permissions
- Club permissions
- AI authorization

Also perform manual end-to-end testing using demo accounts.

---

# 61. FINAL PRODUCT EXPERIENCE

The final product should feel like:

A real digital campus operating system.

Not:

- a college CRUD project
- a basic admin dashboard
- a generic AI chatbot
- a collection of unrelated pages

Everything must feel connected.

Example:

Student sees low attendance
→ warning appears

Student has fee due
→ notification appears

Exam is approaching
→ dashboard highlights exam

New event published
→ event appears

Complaint raised
→ ticket appears

Leave approved
→ notification appears

AI assistant
→ understands campus services

The entire application should feel like ONE unified ecosystem.

---

# 62. FINAL INSTRUCTION

First analyze the complete requirements.

Then:

1. Create the architecture.
2. Create the project structure.
3. Create the database schema.
4. Create the authentication/RBAC system.
5. Create the design system.
6. Build the frontend.
7. Build the serverless Express backend.
8. Connect MongoDB.
9. Implement all major workflows.
10. Create demo data.
11. Create demo accounts.
12. Create all documentation.
13. Test the application.
14. Fix errors.
15. Verify production build.
16. Verify Vercel compatibility.
17. Verify PWA functionality.
18. Provide final setup instructions.

IMPORTANT:

Do not stop at UI mockups.

Do not create fake APIs.

Do not use localStorage as the primary database.

Do not store passwords in plain text.

Do not expose MongoDB credentials.

Do not use app.listen() for the production Vercel backend.

Do not allow frontend-only authorization.

Do not allow students to modify admin-controlled properties such as hostel status.

Do not allow users to access data belonging to other users.

Build the application as a **real-world, scalable, secure, production-ready PWA product**.

The final result should be something that can be demonstrated to:

- College management
- Students
- Faculty
- Mentors
- Maintenance teams
- Transport department
- Club teams
- Potential customers
- Companies
- Investors

and should clearly communicate that this is a serious **Unified AI Campus Platform** rather than a normal academic project.

> Paste this entire document as your first prompt to the coding agent. It is self-contained — build order, design system, and functional scope are all inside it.

You are acting as **design lead + senior full-stack architect** for a real product company. The client has already rejected work that "looks AI-generated" — templated SaaS-card layouts, generic gradients, tracked-out ALL-CAPS eyebrow labels, the same soft grey card shadow on everything. They are paying for a **distinct, deliberate, human-designed visual identity** and a genuinely working full-stack application underneath it. Both halves matter equally: a beautiful shell with fake data is a failure, and a working app with a templated UI is also a failure.

Read this whole prompt before writing any code. Work in the two-pass process described in Part 1 (plan → critique against this brief → build), not straight to code.

---

## PART 1 — DESIGN PHILOSOPHY (read this first, it governs everything visual)

### 1.1 Ground the design in the actual subject matter

This is not "a dashboard." It is **a campus** — a physical place with buildings, timetables, bells, ID cards, notice boards, bus routes, library shelves. Let that vocabulary shape the design's small decisions: how a schedule is laid out, how a status is worded, how a complaint ticket looks. Do not default to the visual language of a generic B2B SaaS admin panel. A campus platform used mostly on a phone, by 18–22 year-olds and by 45-year-old admin staff, has a different personality than a fintech dashboard — legible, calm, quick to scan, not cute, not corporate-cold.

### 1.2 Explicitly avoid the AI-generated "tells"

Before building anything, rule these out. If any appear in your plan, revise before coding:

- A warm cream background with a high-contrast serif headline and a terracotta/clay accent.
- A near-black background with one bright acid-green or vermilion accent.
- The "SaaS-card kit": every block chopped into identically rounded cards, one border-radius used everywhere regardless of hierarchy, the same soft `rgba(0,0,0,.1)` shadow under each, gradient washes as decoration.
- Tracked-out ALL-CAPS eyebrow labels above every heading.
- Meta text joined with middle dots (`A · B · C`) or em-dashes (`WORD — fragment`).
- A `→` glued onto every link/button label.
- Bolding or italicizing a single word inside a headline for "emphasis."
- Numbered markers (01 / 02 / 03) on content that isn't actually a sequence.
- Fade-and-slide-up entrance animation on every section, hover-lift on every card.

None of these are forbidden by law — they're forbidden by default. Use a structural device (a number, a divider, a border) only when the content is actually numbered, actually divided, actually bordered for a reason.

### 1.3 Build a real design-token system (define these before any component)

Work through this as a plan first, written out, then check it doesn't collapse into the generic defaults above:

- **Color** — 4–6 named hex values, not "primary/secondary/accent" left abstract. Pick a deep, slightly desaturated blue as the institutional anchor (not a bright SaaS blue), a warm neutral/slate for structure, and let amber/green/red carry _only_ status meaning — never decoration. Example starting point to adapt, not copy verbatim: `--ink: #17202B` (near-black text, not pure #000/#111), `--brand: #1F4E79` (deep institutional blue), `--brand-muted: #E7EEF5`, `--surface: #F7F8FA`, `--line: #DFE3E8`, `--success: #1E7A46`, `--warning: #B4740E`, `--danger: #B3261E`. Dark mode gets its own considered neutral scale, not an inverted light theme.
- **Type** — one or two typefaces max, chosen deliberately for a campus/institutional feel (something like Inter, IBM Plex Sans, or Public Sans for UI; if you want a second face for display numbers/headings pick something with real character, not a default geometric sans). Set a real type scale (Elements-of-Typographic-Style-style ratio), intentional weights, line length under ~80 characters for body text. Never make everything bold; use weight and size to carry hierarchy, not color alone.
- **Layout** — sketch it in prose + ASCII wireframe before coding. Decide alignment intentionally (left-aligned, dense information grid for dashboards; centered only for the landing page hero). Sidebar-for-desktop / bottom-nav-for-mobile is a fine structural choice here (it matches how campus apps are actually used) — the point isn't to avoid every convention, it's to avoid _unconsidered_ ones.
- **Motion** — one deliberate moment (e.g. a single orchestrated dashboard load-in), not scattered fade-ins on every card. Motion answers user actions (opening a drawer, confirming a submission, expanding a row) — it doesn't decorate scroll.
- **Structural devices carry information** — a status pill, a divider between today's and tomorrow's timetable, a border around an overdue fee — each exists because it means something, not because it looks nice.

### 1.4 Writing is part of the design

Every label, button, and empty state is written from the _student's_ vocabulary, not the system's schema. "Apply for leave," not "Create leave request object." Buttons say exactly what happens ("Submit application," not "Submit") and the confirmation echoes the same verb ("Application submitted"). Empty states and errors explain what happened and what to do next, in plain sentence case — no apologizing, no vague "Something went wrong."

### 1.5 Self-critique before calling it done

Spend your visual boldness in one place per screen (e.g. the attendance ring on the dashboard, or the hero on the landing page) and keep everything around it quiet. Before finishing each major screen: strip one unnecessary decoration, confirm it holds up in dark mode, confirm keyboard focus is visible, confirm it doesn't read as a template if you imagine the same layout built for a totally different product.

---

## PART 2 — PRODUCT SCOPE

Build **CampusHub**, a unified campus platform replacing the scattered channels (fees, attendance, exams, timetable, leave/OD, complaints, hostel, transport, clubs, events, library, navigation, lost & found) students currently juggle across disconnected systems.

**Roles:** Student, Faculty, Mentor, Admin, Maintenance Staff, Transport Staff, Driver, Security Staff, Club President. Admin has top-level management access; every other role is scoped tightly to what it needs — enforced **in the backend**, never just hidden in the UI.

**Core modules:** student dashboard · fees · exams & results · timetable · leave & OD (with mentor approval workflow) · attendance (with an explained, not just red-numbered, below-80% warning) · campus events · complaint/ticket management (categorized, with a generated ticket ID like `CMP-2026-00124`, full status workflow, and department routing) · hostel module (visibility gated entirely by an admin-controlled `hostelStatus` field — a day scholar must never see hostel UI) · transport (bus/route/driver assignment, polling-based location updates, not a persistent WebSocket) · facilities directory · club management (student requests → admin approval → president access) · centralized announcements with audience targeting · library search · AI Campus Assistant (retrieval-grounded, never inventing campus facts, and scoped so a student can only ever pull their _own_ authorized data) · campus navigation directory · lost & found · previous-year question papers · centralized notifications.

Each role gets its own dashboard scoped to exactly its responsibilities (see role list above) — Faculty marks attendance and sees their teaching load; Mentor reviews leave/OD for assigned students only; Maintenance sees assigned tickets only; Admin sees the full operational picture (counts of students/hostellers/pending complaints/low-attendance students/pending approvals/active buses).

---

## PART 3 — TECHNICAL ARCHITECTURE

- **Frontend:** React + Vite, React Router, installable PWA (manifest, service worker, offline fallback screen — never cache private API responses).
- **Backend:** Node.js + Express, adapted for **Vercel Serverless Functions** — no `app.listen()`, no long-running process assumptions, connection caching for MongoDB suited to serverless cold starts.
- **Database:** MongoDB (Atlas for production). Collections roughly as enumerated in the original spec (users, students, faculty, admins, mentors, attendance, fees, exams, results, timetables, leaveApplications, odApplications, announcements, complaints, maintenanceRequests, hostelStudents, transportBuses/Students/Routes, clubs/clubMembers/clubRequests, campusEvents, libraryBooks, questionPapers, lostAndFound, campusLocations, notifications, aiKnowledgeBase, auditLogs) — normalized with references/ObjectIds, indexed on frequently queried fields.
- **Auth & security:** Argon2id password hashing, token/session auth with secure HTTP-only cookies, RBAC enforced server-side on every route, rate limiting, input/schema validation on every write, CORS + security headers, audit logging on privileged actions (hostel status changes, fee edits, role changes, club deletion), never returning secrets or password hashes to the client, all secrets in environment variables.
- **File storage:** cloud object storage (e.g. Cloudinary) behind a swappable abstraction, not local filesystem.
- **AI layer:** a service abstraction (provider configurable via env var) that does intent detection → permission check → grounded data retrieval from MongoDB/knowledge base → response generation. The AI explains how to do a high-risk action (e.g. apply for leave); it never performs the action itself.
- **API convention:** consistent envelope — `{ success, message, data }` on success, `{ success: false, message }` on error — human-readable frontend messages, technical detail logged server-side only.
- **No fake functionality.** Every module must be a real, working CRUD/workflow against MongoDB — no "Coming soon" buttons on core features, no localStorage-as-database.

---

## PART 4 — DEMO & DOCUMENTATION

Ship demo accounts for every role (clearly labeled as demo, shared demo password, realistic seeded data covering every module for the student account). Produce `/docs` covering PRD, architecture, end-to-end workflows (Mermaid diagrams welcome for the leave/OD, complaint, and hostel-status workflows specifically — those are the ones with real branching), database schema, API reference, security, deployment (Vercel + Atlas), and a demo script.

---

## PART 5 — BUILD IN PHASES

1. Project scaffold — React/Vite + Express-on-Vercel + MongoDB + Argon2id + auth/RBAC + the design-token system from Part 1 + base PWA shell.
2. Student dashboard — profile, fees, attendance, exams, results, timetable.
3. Leave/OD + notifications.
4. Complaints, maintenance, hostel, transport.
5. Clubs, events, announcements, lost & found.
6. Library, question papers, campus navigation.
7. AI Campus Assistant with grounded retrieval and per-student data scoping.
8. Hardening — security pass, performance pass (pagination everywhere, no full-collection fetches), demo data, docs, production Vercel + Atlas deployment.

Test each phase against real demo data before moving to the next. Verify specifically: a day scholar never sees hostel UI; one student can never fetch another student's fees/attendance/results/applications; frontend button-hiding is never the only enforcement of a permission; there is no `app.listen()` anywhere in the production backend.

---

**Deliver a product that feels like one connected operating system for a campus** — a low attendance subject surfaces a warning, a due fee surfaces a reminder, an approaching exam surfaces on the dashboard, a resolved complaint notifies the student who raised it — not a pile of unrelated CRUD screens stitched together.
