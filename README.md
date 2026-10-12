<div align="center">

# 🎓 CampusHub
### Unified AI Campus Platform

A production-ready Progressive Web App that replaces fragmented campus systems — attendance, fees, exams, leave/OD, complaints, hostel, transport, clubs, library, lost & found — with **one** platform for students, faculty, mentors, admins, and staff.

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel&logoColor=white)](https://vercel.com)
[![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

</div>

---

## 📌 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Screenshots](#-screenshots)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Demo Accounts](#-demo-accounts)
- [Deployment](#-deployment)
- [Documentation](#-documentation)
- [Team](#-team)
- [License](#-license)

---

## ✨ Features

| Module | What it does |
|---|---|
| 🔐 **Auth & RBAC** | Argon2id password hashing, JWT sessions, server-side role middleware |
| 🎯 **Role Dashboards** | Student, Faculty, Mentor, Admin, Maintenance, Transport, Driver, Security, Club President |
| 📊 **Attendance** | Live % tracking, below-80% warnings, exam eligibility status |
| 🗓️ **Timetable / Exams / Results** | Schedules, grades, CGPA, result history |
| 💰 **Fees** | Consolidated dues across tuition/hostel/transport/exams, simulated receipts |
| 📝 **Leave & OD Workflow** | Student request → mentor approval → digital gate pass with QR code |
| 🛠️ **Complaints & Maintenance** | Categorized tickets, auto-generated IDs, live status tracking |
| 🏠 **Hostel** | Room allocation, mess menu, warden contacts — gated to hostellers only |
| 🚌 **Transit** | Routes, stops, driver details, bus pass status |
| 📚 **Library, Lost & Found, Notifications, Clubs/Events** | Full campus-life coverage |
| 🤖 **AI Assistant** | Pluggable provider — Gemini / OpenAI / mock |

## 🧱 Tech Stack

<div align="center">

| Layer | Stack |
|---|---|
| **Frontend** | React 19 · Vite · React Router · TanStack Query · Zustand · Axios · Service Worker (PWA) |
| **Backend** | Node.js · Express (Vercel serverless functions) |
| **Database** | MongoDB Atlas (Mongoose) |
| **Auth** | JWT + Argon2id |
| **Storage** | Cloudinary |
| **Deployment** | Vercel |

</div>

## 📸 Screenshots

<div align="center">

### Landing Page
![Landing Page](./docs/screenshots/landing-page.png)

### Student Dashboard
![Student Dashboard](./docs/screenshots/student-dashboard.png)

<table>
<tr>
<td width="50%">

**Mentor Dashboard**
![Mentor Dashboard](./docs/screenshots/mentor-dashboard.png)

</td>
<td width="50%">

**Maintenance Dashboard**
![Maintenance Dashboard](./docs/screenshots/maintenance-dashboard.png)

</td>
</tr>
</table>

### Admin Dashboard
![Admin Dashboard](./docs/screenshots/admin-dashboard.png)

</div>

## 📁 Project Structure
