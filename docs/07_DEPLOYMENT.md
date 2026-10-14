# Deployment Guide — CampusHub (Vercel & MongoDB Atlas)

This guide provides instructions for deploying CampusHub to production using **Vercel** for hosting the frontend and serverless API, paired with **MongoDB Atlas** for managed database persistence.

---

## 1. Prerequisites

- A [Vercel](https://vercel.com) account.
- A [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account.
- Node.js 18+ and npm installed locally.

---

## 2. MongoDB Atlas Configuration

1. **Create Cluster**:
   - Log into MongoDB Atlas and create an `M0 Free` or `M10 Shared` cluster in your nearest region.
2. **Configure Database User**:
   - Navigate to **Security → Database Access**.
   - Create a user (e.g., `campushub-admin`) with a secure password and `Read and write to any database` privileges.
3. **Configure Network Access**:
   - Navigate to **Security → Network Access**.
   - Select **Add IP Address** and choose `0.0.0.0/0` (Allow Access from Anywhere) to permit serverless lambda IPs to connect.
4. **Copy Connection URI**:
   - Navigate to **Database → Connect → Drivers (Node.js)**.
   - Copy the URI string:
     ```text
     mongodb+srv://campushub-admin:<PASSWORD>@cluster0.mongodb.net/campushub?retryWrites=true&w=majority
     ```

---

## 3. Environment Variables Configuration

Configure the following environment variables in both local `.env` and Vercel Project Settings:

| Variable | Description | Example / Recommended Value |
|---|---|---|
| `MONGODB_URI` | Atlas MongoDB connection string | `mongodb+srv://...` |
| `JWT_SECRET` | Secret key for JWT signing | Strong 64-character random string |
| `COOKIE_SECRET` | Secret key for signed cookies | Strong 32-character random string |
| `NODE_ENV` | Runtime environment | `production` |
| `FRONTEND_URL` | Canonical frontend domain | `https://campushub.vercel.app` |
| `VITE_API_URL` | Same-origin API base URL | `/api` |
| `PORT` | Optional standalone backend port | `5000` |

---

## 4. Seeding Initial Demo Data

Before launching the application, populate the database with curriculum records, timetable slots, bus routes, faculty, and demo accounts:

```bash
# Set your production URI in your local shell
export MONGODB_URI="mongodb+srv://campushub-admin:<password>@cluster0.mongodb.net/campushub?retryWrites=true&w=majority"

# Run seed script
npm run seed
```

This seeds 10 realistic personas, attendance histories, fee receipts, examination schedules, and campus facilities.

---

## 5. Deploying to Vercel

CampusHub includes a root `vercel.json` configured for a single Vercel project. The React build is served from `frontend/dist`, while `api/index.js` imports the existing Express app for `/api/*` serverless requests:

```json
{
  "version": 2,
   "installCommand": "npm install",
   "buildCommand": "npm run build",
  "outputDirectory": "frontend/dist",
  "rewrites": [
    { "source": "/((?!api/).*)", "destination": "/index.html" }
  ]
}
```

Production uses one domain: `https://your-domain.vercel.app/` for the frontend and `https://your-domain.vercel.app/api/...` for the API. No backend server process or port is required on Vercel.

### Local development

Run the root command:

```bash
npm run dev
```

This starts one Vite process on `http://localhost:5175`. During development, the existing Express app is mounted inside Vite for `/api/*` and `/uploads/*`, so the browser uses the same-origin URLs without starting a second server on port `5000`. The separate `npm run dev:backend` command remains available only when standalone backend testing is specifically needed.

### Option A: Using Vercel CLI
```bash
npm i -g vercel
vercel login
vercel --prod
```

### Option B: Deploying via GitHub Integration
1. Push repository to GitHub/GitLab.
2. In Vercel, select **Add New Project** → **Import Git Repository**.
3. In **Environment Variables**, supply `MONGODB_URI`, `JWT_SECRET`, and `COOKIE_SECRET`.
4. Click **Deploy**.

---

## 6. Post-Deployment Verification

1. **API Health Check**: Visit `https://your-domain.vercel.app/api/health`. It should return `200 OK` with JSON status.
2. **PWA Manifest & Service Worker**:
   - Open Chrome DevTools → **Application** tab.
   - Confirm **Manifest** loads without errors and **Service Workers** displays `sw.js` as active and running.
3. **Demo Sign In**: Log in using `student@demo.com` and verify the dashboard renders attendance, timetable, and fee components with zero console errors.
