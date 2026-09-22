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

<!-- 📸 Add a real screenshot/banner of your app here -->
<!-- <img src="./docs/screenshots/banner.png" alt="CampusHub banner" width="800"/> -->

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

<!-- Replace these placeholders with real screenshots/GIFs once you have them -->
<div align="center">

| Student Dashboard | Mentor — Leave Approval | Admin Panel |
|:---:|:---:|:---:|
| _add screenshot_ | _add screenshot_ | _add screenshot_ |

</div>

> Tip: drop images in `docs/screenshots/` and swap the placeholders above with `![alt](./docs/screenshots/your-image.png)`.

## 📁 Project Structure

```
CampusHub-main/
├── frontend/          # React + Vite PWA
│   └── src/
│       ├── pages/      # Role-based pages (student, faculty, admin, etc.)
│       ├── services/    # API client (Axios)
│       └── styles/      # Design tokens, global CSS
├── backend/           # Express app
│   ├── controllers/
│   ├── middleware/    # Auth & RBAC
│   ├── models/        # Mongoose schemas
│   ├── routes/
│   └── services/
├── api/               # Vercel serverless entry point
├── scripts/           # Database seed script
└── docs/              # Full documentation (PRD, architecture, API, deployment, etc.)
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A MongoDB Atlas connection string
- (Optional) Cloudinary account + Gemini/OpenAI API key for the AI assistant

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/<your-username>/CampusHub.git
cd CampusHub

# 2. Set up environment variables
cp .env.example .env
# Fill in MONGODB_URI, JWT_SECRET, and other values in .env

# 3. Install all dependencies (root, backend, frontend)
npm run install:all

# 4. Seed demo data
npm run seed

# 5. Start development (frontend + backend together)
npm run dev
```

## 👤 Demo Accounts

_(after running `npm run seed`)_

| Role | Email | Password |
|---|---|---|
| Student (Hosteller) | student@demo.com | Demo@2026 |
| Student (Day Scholar) | student2@demo.com | Demo@2026 |
| Faculty | faculty@demo.com | Demo@2026 |
| Mentor | mentor@demo.com | Demo@2026 |
| Admin | admin@demo.com | Demo@2026 |
| Maintenance | maintenance@demo.com | Demo@2026 |
| Transport Staff | transport@demo.com | Demo@2026 |
| Driver | driver@demo.com | Demo@2026 |
| Security | security@demo.com | Demo@2026 |
| Club President | clubpresident@demo.com | Demo@2026 |

> ⚠️ Change all demo passwords before deploying anywhere public.

## ☁️ Deployment

Configured for one-click deployment to **Vercel**:
- Frontend builds via Vite (`npm run build`)
- Backend runs as a Vercel serverless function via `api/index.js`
- Full guide → [`docs/07_DEPLOYMENT.md`](./docs/07_DEPLOYMENT.md)

## 📖 Documentation

Full docs live in [`/docs`](./docs):

- [Product Requirements](./docs/01_PRD.md)
- [Architecture](./docs/02_ARCHITECTURE.md)
- [End-to-End Workflows](./docs/03_END_TO_END_WORKFLOW.md)
- [Database Schema](./docs/04_DATABASE_SCHEMA.md)
- [API Documentation](./docs/05_API_DOCUMENTATION.md)
- [Security](./docs/06_SECURITY.md)
- [Deployment Guide](./docs/07_DEPLOYMENT.md)
- [Demo Guide](./docs/08_DEMO_GUIDE.md)

## 👥 Team

<div align="center">

<table>
<tr>
<td align="center" width="160">
<a href="https://github.com/SIVASHANKAR-CODE"><img src="https://github.com/SIVASHANKAR-CODE.png" width="90" style="border-radius:50%" alt="Sivashankar S"/></a><br/>
<b>Sivashankar S</b><br/>
<sub>👑 Team Lead · ⚙️ Backend Developer</sub><br/>
<a href="https://github.com/SIVASHANKAR-CODE">@SIVASHANKAR-CODE</a>
</td>
<td align="center" width="160">
<a href="https://github.com/prathikshaseetharaman-bit"><img src="https://github.com/prathikshaseetharaman-bit.png" width="90" style="border-radius:50%" alt="Prathiksha S"/></a><br/>
<b>Prathiksha S</b><br/>
<sub>🎨 Frontend Developer</sub><br/>
<a href="https://github.com/prathikshaseetharaman-bit">@prathikshaseetharaman-bit</a>
</td>
<td align="center" width="160">
<a href="https://github.com/yogavarshni-Max"><img src="https://github.com/yogavarshni-Max.png" width="90" style="border-radius:50%" alt="Yogavarshni R"/></a><br/>
<b>Yogavarshni R</b><br/>
<sub>🧪 PWA Tester</sub><br/>
<a href="https://github.com/yogavarshni-Max">@yogavarshni-Max</a>
</td>
</tr>
<tr>
<td align="center" width="160">
<a href="https://github.com/yazhini743"><img src="https://github.com/yazhini743.png" width="90" style="border-radius:50%" alt="Yazhini"/></a><br/>
<b>Yazhini</b><br/>
<sub>🧪 PWA Tester</sub><br/>
<a href="https://github.com/yazhini743">@yazhini743</a>
</td>
<td align="center" width="160">
<a href="https://github.com/sujisubasri70-collab"><img src="https://github.com/sujisubasri70-collab.png" width="90" style="border-radius:50%" alt="Subasri"/></a><br/>
<b>Subasri</b><br/>
<sub>🔍 Researcher</sub><br/>
<a href="https://github.com/sujisubasri70-collab">@sujisubasri70-collab</a>
</td>
<td align="center" width="160">
<a href="https://github.com/rrithigasrij-star"><img src="https://github.com/rrithigasrij-star.png" width="90" style="border-radius:50%" alt="Rithigasri R"/></a><br/>
<b>Rithigasri R</b><br/>
<sub>🔍 Researcher</sub><br/>
<a href="https://github.com/rrithigasrij-star">@rrithigasrij-star</a>
</td>
</tr>
</table>

</div>

## 📄 License

Add a license of your choice (MIT is a common default for personal/portfolio projects).

---

<div align="center">
Made with ❤️ by <a href="https://github.com/SIVASHANKAR-CODE">SIVASHANKAR-CODE</a>
</div>
