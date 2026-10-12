# Security Architecture & Policies — CampusHub

CampusHub is engineered following zero-trust principles, enforcing strict server-side validation and institutional data governance.

---

## 1. Cryptographic Authentication (Argon2id)

CampusHub employs **Argon2id**—the winner of the Password Hashing Competition—as its sole credential hashing algorithm, resisting both GPU-accelerated brute force and side-channel timing attacks.

- **Algorithm**: `argon2id`
- **Memory Cost**: 65,536 KiB (64 MiB)
- **Time Cost (Iterations)**: 3 passes
- **Parallelism**: 4 threads
- **Salt Generation**: 16 bytes of cryptographically secure pseudo-random data per user.

Plain-text passwords never touch logs, storage, or external services. Password fields are omitted from Mongoose queries by default (`select: false`) and explicitly excluded from API output serialization.

---

## 2. Session Management & Token Security

- **JWT Tokens**: Signed using HMAC SHA-256 (`HS256`) with ephemeral expiration (24h).
- **Transport Security**:
  - Tokens are transmitted via `Authorization: Bearer <token>` headers or secure cookies.
  - Cookies are marked with `httpOnly: true` (preventing XSS exfiltration), `secure: true` in production (enforcing HTTPS), and `sameSite: 'lax'` (mitigating CSRF attacks).
- **Graceful Session Invalidation**: Calling `/api/auth/logout` clears active cookies and resets client authentication state immediately.

---

## 3. Server-Side Role-Based Access Control (RBAC)

Authorization is never delegated to client-side presentation layers. Even if a malicious user alters client state or calls raw endpoints via curl/Postman, the backend middleware blocks unauthorized attempts:

```javascript
// Verification middleware enforces exact role membership
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Insufficient privileges for this action.'
      });
    }
    next();
  };
};
```

### Data Scoping Rules:
1. **Student Scoping**: A student can strictly query their own fee invoices, attendance history, timetable, and leave requests. IDs are retrieved from `req.user.studentId`, not trusted from request parameters.
2. **Mentor Scoping**: Mentors can only view leave applications from students explicitly assigned to their `mentorId`.
3. **Hostel Scoping**: Day scholars (`hostelStatus === 'day_scholar'`) receive `403 Forbidden` on all `/api/hostel/*` requests.

---

## 4. Network & Application Hardening

### 4.1 Security Headers (Helmet)
- `X-Content-Type-Options: nosniff` prevents MIME-sniffing exploits.
- `X-Frame-Options: DENY` guards against clickjacking.
- `Referrer-Policy: strict-origin-when-cross-origin` safeguards sensitive URLs.

### 4.2 Rate Limiting
- Configured via `express-rate-limit` on `/api` routes (standard 100 requests per 15-minute window per IP) and strict limits on `/api/auth/login` (5 failed attempts per 15 minutes) to block brute-force credential stuffing.

### 4.3 Cross-Origin Resource Sharing (CORS)
- Strict origin whitelisting: only designated frontend domains (`FRONTEND_URL` and `*.vercel.app`) with credentials enabled are permitted.

---

## 5. Audit Logging

Privileged administrative and security-critical actions automatically write immutable entries to the `auditLogs` collection:
- Modifications to student `hostelStatus` (e.g. converting a day scholar to hosteller).
- Manual fee adjustments or waivers.
- Role alterations and account suspensions.
- Mentor overrides on student leave requests.
Each audit record logs: `performedBy`, `action`, `resource`, `resourceId`, `details`, and `ipAddress`.
