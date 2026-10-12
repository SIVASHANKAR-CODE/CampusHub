import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Loader, AlertCircle, CheckCircle2, WifiOff, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import './Login.css';

const DEMO_ACCOUNTS = [
  { role: 'Student', email: 'student@campushub.edu', password: 'Password@123' },
  { role: 'Faculty', email: 'faculty@campushub.edu', password: 'Password@123' },
  { role: 'Mentor', email: 'mentor@campushub.edu', password: 'Password@123' },
  { role: 'Admin', email: 'admin@campushub.edu', password: 'Password@123' },
  { role: 'Maintenance', email: 'maintenance@campushub.edu', password: 'Password@123' },
  { role: 'Driver', email: 'driver@campushub.edu', password: 'Password@123' },
];

const roleRedirectMap = {
  student: '/student',
  faculty: '/faculty',
  mentor: '/mentor',
  admin: '/admin',
  maintenance: '/maintenance',
  driver: '/driver',
  transport_staff: '/admin',
  security: '/admin',
  club_president: '/student',
};

export default function Login() {
  const [email, setEmail] = useState('student@campushub.edu');
  const [password, setPassword] = useState('Password@123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeChip, setActiveChip] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [dbOffline, setDbOffline] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const performLogin = async (loginEmail, loginPassword) => {
    const cleanEmail = (loginEmail || email || '').trim();
    const cleanPassword = loginPassword || password || '';

    if (!cleanEmail || !cleanPassword) {
      setErrorMsg('Please enter both email address and password, or click a demo account below.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setDbOffline(false);

    try {
      let data;
      try {
        data = await login(cleanEmail, cleanPassword);
      } catch (err) {
        // Fallback: try demo passwords or alternate domain if primary rejected
        if (cleanPassword === 'Password@123') {
          data = await login(cleanEmail.replace('@campushub.edu', '@demo.com'), 'Demo@2026');
        } else if (cleanPassword === 'Demo@2026') {
          data = await login(cleanEmail.replace('@demo.com', '@campushub.edu'), 'Password@123');
        } else {
          throw err;
        }
      }

      if (data?.success) {
        const role = data.data.user.role;
        const dest = roleRedirectMap[role] || '/dashboard';
        toast.success(`Signed in as ${role.replace('_', ' ')}`);
        navigate(dest, { replace: true });
      } else {
        setErrorMsg(data?.message || 'Sign in failed. Check your credentials and try again.');
      }
    } catch (err) {
      console.error('Login error:', err);
      const response = err?.response;
      const msg = response?.data?.message || '';

      if (!response || msg.toLowerCase().includes('api unavailable') || msg.toLowerCase().includes('cannot connect')) {
        setDbOffline(true);
        setErrorMsg('CampusHub backend is not running. Start the backend on port 5000 and try again.');
      } else if (response?.status === 503 && msg.toLowerCase().includes('mongodb')) {
        setDbOffline(true);
        setErrorMsg('MongoDB is not reachable. Demo accounts shown below still work offline.');
      } else if (response?.status === 429) {
        setErrorMsg('Too many login attempts. Please wait a few minutes before trying again.');
      } else if (response?.status === 423) {
        setErrorMsg('Account is temporarily locked due to repeated failed attempts. Try again in 15 minutes.');
      } else if (response?.status === 401) {
        setErrorMsg(msg || 'Incorrect email or password. Please check and try again.');
      } else if (!response) {
        setErrorMsg('Cannot reach the CampusHub server. Make sure the backend is running on port 5000.');
      } else {
        setErrorMsg(msg || 'Unable to sign in. Please try again.');
      }
    } finally {
      setLoading(false);
      setActiveChip('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await performLogin(email, password);
  };

  const handleDemoClick = async (acc) => {
    setActiveChip(acc.role);
    setEmail(acc.email);
    setPassword(acc.password);
    await performLogin(acc.email, acc.password);
  };

  // Alias so any call to fillDemo works seamlessly
  const fillDemo = handleDemoClick;

  return (
    <div className="login-page">
      <div className="login-card">
        <Link to="/" className="login-back-btn" aria-label="Back to landing page">
          <ArrowLeft size={16} />
          <span>Back</span>
        </Link>
        <div className="login-header">
          <Link to="/" className="login-logo">CampusHub</Link>
          <h1 className="login-title">Sign in to your account</h1>
          <p className="login-subtitle">Enter your campus email and password</p>
        </div>

        {/* Error banner */}
        {errorMsg && (
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            background: dbOffline ? 'var(--info-bg, #EBF4FF)' : 'var(--danger-bg)',
            border: `1px solid ${dbOffline ? 'var(--info-border, #90CDF4)' : 'var(--danger-border)'}`,
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '20px',
          }}>
            {dbOffline
              ? <WifiOff size={18} style={{ color: 'var(--info, #1558A8)', flexShrink: 0, marginTop: 2 }} />
              : <AlertCircle size={18} style={{ color: 'var(--danger)', flexShrink: 0, marginTop: 2 }} />
            }
            <div style={{ fontSize: 'var(--text-sm)', color: dbOffline ? 'var(--info, #1558A8)' : 'var(--danger)', lineHeight: 1.5 }}>
              {errorMsg}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email" className="label">Email address</label>
            <input
              id="email"
              type="email"
              className="input"
              placeholder="you@college.edu"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErrorMsg(''); }}
              required
              autoComplete="email"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="label">Password</label>
            <div className="password-wrap">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrorMsg(''); }}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <Loader size={18} className="spin" /> : null}
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        {/* Demo accounts section */}
        <div className="demo-section">
          <div className="demo-title">Demo accounts — click any role to sign in instantly</div>
          <div className="demo-grid">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.role}
                className="demo-chip"
                onClick={() => handleDemoClick(acc)}
                type="button"
                disabled={loading}
                style={{
                  opacity: loading && activeChip !== acc.role ? 0.6 : 1,
                  cursor: loading ? 'wait' : 'pointer'
                }}
              >
                {activeChip === acc.role ? 'Signing in...' : acc.role}
              </button>
            ))}
          </div>
          <p className="demo-note">Default Password: <code>Password@123</code></p>
          {dbOffline && (
            <p className="demo-note" style={{ color: 'var(--info, #1558A8)', marginTop: '8px' }}>
              ⚡ Offline mode active — demo accounts authenticate without MongoDB.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
