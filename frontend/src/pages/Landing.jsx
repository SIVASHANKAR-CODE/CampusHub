import { Link } from 'react-router-dom';
import {
  GraduationCap, ClipboardList, Calendar, Bus, Building,
  Users, Bell, MessageSquare, BookOpen, Bot, ArrowRight,
  Zap
} from 'lucide-react';

const features = [
  { icon: ClipboardList, label: 'Attendance', desc: 'Track subject-wise attendance with instant warnings below 80%.' },
  { icon: Calendar, label: 'Exams & Results', desc: 'View exam schedules, marks, grades and CGPA in one place.' },
  { icon: MessageSquare, label: 'Complaints', desc: 'Raise tickets and track resolution in real time.' },
  { icon: Bus, label: 'Transport', desc: 'View your assigned bus, route and live driver location.' },
  { icon: Building, label: 'Hostel', desc: 'Room info, warden contact and hostel services.' },
  { icon: Users, label: 'Clubs & Events', desc: 'Discover clubs, join events and stay connected.' },
  { icon: BookOpen, label: 'Library', desc: 'Search books, check availability and shelf location instantly.' },
  { icon: Bot, label: 'AI Assistant', desc: 'Ask campus questions in plain language — get instant answers.' },
  { icon: Bell, label: 'Notifications', desc: 'Never miss a fee reminder, leave update or announcement.' },
];

export default function Landing() {
  return (
    <div style={{ fontFamily: 'var(--font-sans)', color: 'var(--ink)', background: 'var(--surface)', minHeight: '100vh' }}>
      {/* ─── Topbar ──────────────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'var(--surface-raised)', borderBottom: '1px solid var(--line)',
        padding: '0 var(--space-8)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: '64px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <GraduationCap size={28} style={{ color: 'var(--brand)' }} />
          <span style={{ fontWeight: 700, fontSize: 'var(--text-xl)', color: 'var(--brand)' }}>CampusHub</span>
        </div>
        <Link to="/login" style={{
          background: 'var(--brand)', color: '#fff', padding: '8px 20px',
          borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: 'var(--text-sm)',
          display: 'flex', alignItems: 'center', gap: '6px'
        }}>
          Sign In <ArrowRight size={16} />
        </Link>
      </header>

      {/* ─── Hero ────────────────────────────────────────── */}
      <section style={{
        padding: 'clamp(48px, 8vw, 88px) var(--space-6) clamp(40px, 6vw, 72px)',
        textAlign: 'center',
        background: 'linear-gradient(180deg, rgba(31, 78, 121, 0.08) 0%, rgba(255, 255, 255, 0) 100%)',
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          background: 'rgba(31, 78, 121, 0.1)', border: '1px solid rgba(31, 78, 121, 0.2)',
          borderRadius: '9999px', padding: '6px 16px',
          fontSize: 'var(--text-xs)', color: 'var(--brand)', fontWeight: 700, marginBottom: 'var(--space-6)',
          letterSpacing: '0.04em', textTransform: 'uppercase'
        }}>
          <Zap size={13} /> Official Campus Portal
        </div>
        <h1 style={{
          fontSize: 'clamp(2.2rem, 5.5vw, 3.8rem)', fontWeight: 800,
          color: 'var(--ink)', lineHeight: 1.15, marginBottom: 'var(--space-5)',
          letterSpacing: '-0.03em', maxWidth: '840px', margin: '0 auto var(--space-8)'
        }}>
          One unified platform for your<br />
          <span style={{
            background: 'linear-gradient(135deg, #1F4E79 0%, #2563eb 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>entire campus experience</span>
        </h1>

        <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/login" style={{
            background: 'var(--brand)', color: '#fff', padding: '16px 40px',
            borderRadius: 'var(--radius-lg)', fontWeight: 700, fontSize: 'var(--text-lg)',
            display: 'inline-flex', alignItems: 'center', gap: '10px',
            boxShadow: '0 4px 16px rgba(31, 78, 121, 0.35)',
            transition: 'all var(--transition-fast)'
          }}>
            Sign In to Portal <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* ─── Features ────────────────────────────────────── */}
      <section style={{
        padding: 'clamp(48px, 6vw, 80px) var(--space-6)',
        background: 'var(--surface-raised)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)'
      }}>
        <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto var(--space-10)' }}>
          <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 800, color: 'var(--ink)', marginBottom: 'var(--space-2)' }}>
            Everything you need in one place
          </h2>
          <p style={{ color: 'var(--ink-muted)', fontSize: 'var(--text-base)', lineHeight: 1.6 }}>
            Designed for students, faculty members, mentors, administrative staff, and transport drivers.
          </p>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 'var(--space-5)', maxWidth: 'var(--content-max)', margin: '0 auto'
        }}>
          {features.map(({ icon: Icon, label, desc }) => (
            <div key={label} style={{
              background: 'var(--surface)', border: '1px solid var(--line)',
              borderRadius: 'var(--radius-xl)', padding: 'var(--space-6)',
              display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-start',
              boxShadow: 'var(--shadow-card)',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}>
              <div style={{
                background: 'rgba(31, 78, 121, 0.08)', borderRadius: 'var(--radius-md)',
                padding: '12px', flexShrink: 0, color: 'var(--brand)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Icon size={22} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 'var(--text-base)', color: 'var(--ink)', marginBottom: '4px' }}>
                  {label}
                </div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-muted)', lineHeight: 1.6 }}>
                  {desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CTA ─────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(48px, 6vw, 80px) var(--space-6)', textAlign: 'center' }}>
        <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 800, marginBottom: 'var(--space-3)' }}>
          Ready to get started?
        </h2>
        <p style={{ color: 'var(--ink-muted)', marginBottom: 'var(--space-6)', fontSize: 'var(--text-base)' }}>
          Sign in using your institutional email or try with demo credentials.
        </p>
        <Link to="/login" style={{
          background: 'var(--brand)', color: '#fff', padding: '14px 38px',
          borderRadius: 'var(--radius-lg)', fontWeight: 700, fontSize: 'var(--text-base)',
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          boxShadow: '0 4px 14px rgba(31, 78, 121, 0.3)'
        }}>
          Launch CampusHub Portal <ArrowRight size={18} />
        </Link>
      </section>

      {/* ─── Footer ──────────────────────────────────────── */}
      <footer style={{
        borderTop: '1px solid var(--line)', padding: 'var(--space-6) var(--space-8)',
        textAlign: 'center', fontSize: 'var(--text-xs)', color: 'var(--ink-faint)'
      }}>
        © {new Date().getFullYear()} CampusHub — Unified Campus Platform. All rights reserved.
      </footer>
    </div>
  );
}
