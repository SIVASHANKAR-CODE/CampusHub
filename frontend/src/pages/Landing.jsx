import { Link } from 'react-router-dom';
import {
  GraduationCap, ClipboardList, Calendar, Bus, Building,
  Users, Bell, MessageSquare, BookOpen, Bot, ArrowRight,
  Zap, Layers, ShieldCheck, Lock, Smartphone, Sparkles, CheckCircle2
} from 'lucide-react';
import useScrollReveal, { useStaggerReveal } from '../utils/useScrollReveal';
import AnimatedCounter from '../components/AnimatedCounter';
import ScrollProgressBar from '../components/ScrollProgressBar';
import './Landing.css';

const statistics = [
  { value: 12000, suffix: '+', label: 'Active Students', sub: 'Enrolled across all departments', icon: Users },
  { value: 850, suffix: '+', label: 'Faculty & Mentors', sub: 'Dedicated teaching staff', icon: GraduationCap },
  { value: 18, suffix: '+', label: 'Unified Modules', sub: 'From fees to real-time transport', icon: Layers },
  { value: 99.9, decimals: 1, suffix: '%', label: 'Platform Uptime', sub: 'High-availability infrastructure', icon: ShieldCheck },
];

const features = [
  { icon: ClipboardList, label: 'Attendance', desc: 'Track subject-wise attendance with instant alerts when approaching the 80% minimum threshold.' },
  { icon: Calendar, label: 'Exams & Results', desc: 'View semester exam schedules, internal marks, grade sheets, and cumulative CGPA in one place.' },
  { icon: MessageSquare, label: 'Complaints', desc: 'Raise hostel, academic, or campus facility tickets with transparent status tracking.' },
  { icon: Bus, label: 'Transport & Fleet', desc: 'Check assigned bus route, pickup timings, and real-time transit status across campus.' },
  { icon: Building, label: 'Hostel & Housing', desc: 'Room allocations, warden directory, gate passes, and room maintenance services.' },
  { icon: Users, label: 'Clubs & Events', desc: 'Discover campus clubs, register for hackathons and symposiums, and connect with peers.' },
  { icon: BookOpen, label: 'Library Services', desc: 'Search catalog books, check real-time shelf availability, and manage borrow renewals.' },
  { icon: Bot, label: 'AI Assistant', desc: 'Ask campus policies, exam rules, or general questions in plain English with instant answers.' },
  { icon: Bell, label: 'Unified Notifications', desc: 'Never miss critical fee deadlines, leave approvals, timetable changes, or announcements.' },
];

const audiences = [
  {
    role: 'Students',
    badge: 'Academic & Daily Life',
    icon: GraduationCap,
    description: 'A single hub for daily attendance, marks, timetable, fee receipts, hostel passes, and 24/7 AI assistance.',
    features: [
      'Subject attendance percentage & warnings',
      'Semester exam schedule & grade sheets',
      'Digital fee payment receipts & dues',
      'Live bus route details & gate passes',
    ],
  },
  {
    role: 'Faculty & Mentors',
    badge: 'Teaching & Mentorship',
    icon: Users,
    description: 'Spend less time on manual administrative tasks and focus on impactful teaching and student mentorship.',
    features: [
      'One-click class attendance recording',
      'Leave & on-duty application reviews',
      'Syllabus progression & timetable sync',
      'Mentee academic performance tracking',
    ],
  },
  {
    role: 'Administration',
    badge: 'Oversight & Compliance',
    icon: Building,
    description: 'Centralized command center for admissions, student registry, fees reconciliation, and security compliance.',
    features: [
      'Real-time student fee status & reports',
      'Campus-wide broadcast announcements',
      'Exam timetable & room assignments',
      'Immutable system audit & access logs',
    ],
  },
  {
    role: 'Campus Operations',
    badge: 'Fleet & Facilities',
    icon: Bus,
    description: 'Coordinated workflows for bus drivers, hostel wardens, facility repair crews, and lost & found staff.',
    features: [
      'Bus driver schedule & route management',
      'Facility repair & complaint ticket resolution',
      'Hostel block & room vacancy tracking',
      'Lost & found item cataloging',
    ],
  },
];

const trustPillars = [
  {
    title: 'Institutional-Grade Security',
    desc: 'Role-based access control (RBAC), end-to-end encrypted session cookies, and automated audit logging protect sensitive student and campus records.',
    icon: Lock,
  },
  {
    title: 'Progressive Web App (PWA)',
    desc: 'Engineered as an installable standalone application for Android, iOS, Windows, and macOS with offline fallback and responsive touch controls.',
    icon: Smartphone,
  },
  {
    title: 'Zero Sync Lag Ecosystem',
    desc: 'Replaces scattered chat channels and paper circulars with an instantaneous, single source of truth across all campus departments.',
    icon: Sparkles,
  },
];

export default function Landing() {
  // Hero section reveal triggers
  const heroBadgeRef = useScrollReveal({ animation: 'reveal-fade-down', delay: 80 });
  const heroTitleRef = useScrollReveal({ animation: 'reveal-fade-up', delay: 160 });
  const heroDescRef = useScrollReveal({ animation: 'reveal-fade-up', delay: 240 });
  const heroCtaRef = useScrollReveal({ animation: 'reveal-fade-up', delay: 320 });

  // Statistics section
  const statsContainerRef = useStaggerReveal({ animation: 'reveal-fade-up', staggerMs: 80 });

  // Features section
  const featuresHeaderRef = useScrollReveal({ animation: 'reveal-fade-up', delay: 0 });
  const featuresGridRef = useStaggerReveal({ animation: 'reveal-fade-up', staggerMs: 60 });

  // Audience roles section
  const audienceHeaderRef = useScrollReveal({ animation: 'reveal-fade-up', delay: 0 });
  const audienceGridRef = useStaggerReveal({ animation: 'reveal-fade-up', staggerMs: 90 });

  // Trust indicators section
  const trustHeaderRef = useScrollReveal({ animation: 'reveal-fade-up', delay: 0 });
  const trustGridRef = useStaggerReveal({ animation: 'reveal-fade-up', staggerMs: 80 });

  // CTA section
  const ctaCardRef = useScrollReveal({ animation: 'reveal-scale-up', delay: 0 });

  // Footer
  const footerRef = useScrollReveal({ animation: 'reveal-fade-in', delay: 0 });

  return (
    <div className="landing-page">
      <ScrollProgressBar />

      {/* ─── Topbar Navigation ─────────────────────────────── */}
      <header className="landing-header">
        <Link to="/" className="landing-brand">
          <GraduationCap size={28} />
          <span className="landing-brand-name">CampusHub</span>
        </Link>
        <div className="landing-header-actions">
          <Link to="/login" className="landing-signin-btn">
            Sign In <ArrowRight size={15} />
          </Link>
        </div>
      </header>

      {/* ─── Hero Section ───────────────────────────────────── */}
      <section className="landing-hero">
        <div ref={heroBadgeRef} className="scroll-reveal">
          <div className="hero-badge">
            <Zap size={13} /> Official Campus Portal
          </div>
        </div>

        <h1 ref={heroTitleRef} className="scroll-reveal hero-title">
          One unified platform for your<br />
          <span className="hero-title-accent">entire campus experience</span>
        </h1>

        <p ref={heroDescRef} className="scroll-reveal hero-description">
          The integrated digital operating system connecting students, faculty, mentors,
          administrators, and campus support teams with real-time academic records,
          attendance, fees, and transport.
        </p>

        <div ref={heroCtaRef} className="scroll-reveal hero-cta-group">
          <Link to="/login" className="hero-primary-btn">
            Sign In to Portal <ArrowRight size={18} />
          </Link>
          <a href="#features" className="hero-secondary-btn">
            Explore Modules
          </a>
        </div>
      </section>

      {/* ─── Statistics Cards Row ───────────────────────────── */}
      <section className="stats-section">
        <div ref={statsContainerRef} className="stats-grid">
          {statistics.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="scroll-reveal-child stat-card">
                <div className="stat-icon-wrap">
                  <Icon size={22} />
                </div>
                <div className="stat-number">
                  <AnimatedCounter
                    value={stat.value}
                    decimals={stat.decimals || 0}
                    suffix={stat.suffix}
                    duration={1400}
                  />
                </div>
                <div className="stat-label">{stat.label}</div>
                <div className="stat-sub">{stat.sub}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── Feature Modules Grid ───────────────────────────── */}
      <section id="features" className="features-section">
        <div ref={featuresHeaderRef} className="scroll-reveal section-header-centered">
          <span className="section-tag">Campus Capabilities</span>
          <h2 className="section-heading">Everything you need in one place</h2>
          <p className="section-subheading">
            Streamlined tools designed for everyday academic and operational workflows.
          </p>
        </div>

        <div ref={featuresGridRef} className="features-grid">
          {features.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="scroll-reveal-child feature-card">
              <div className="feature-icon-wrap">
                <Icon size={22} />
              </div>
              <div>
                <div className="feature-title">{label}</div>
                <div className="feature-desc">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Audience & Role-Specific Cards ─────────────────── */}
      <section className="audience-section">
        <div ref={audienceHeaderRef} className="scroll-reveal section-header-centered">
          <span className="section-tag">Role-Based Experiences</span>
          <h2 className="section-heading">Built for every member of the campus</h2>
          <p className="section-subheading">
            Tailored interfaces with role-specific views so students, faculty, and administrators perform their tasks effortlessly.
          </p>
        </div>

        <div ref={audienceGridRef} className="audience-grid">
          {audiences.map((aud) => {
            const Icon = aud.icon;
            return (
              <div key={aud.role} className="scroll-reveal-child audience-card">
                <div className="audience-header">
                  <div className="audience-icon-wrap">
                    <Icon size={24} />
                  </div>
                  <div>
                    <div className="audience-role">{aud.role}</div>
                    <span className="audience-badge">{aud.badge}</span>
                  </div>
                </div>
                <p className="audience-desc">{aud.description}</p>
                <div className="audience-features-list">
                  {aud.features.map((feat) => (
                    <div key={feat} className="audience-feature-item">
                      <CheckCircle2 size={15} />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── Trust & Architecture Indicators ─────────────────── */}
      <section className="trust-section">
        <div ref={trustHeaderRef} className="scroll-reveal section-header-centered">
          <span className="section-tag">Trust & Architecture</span>
          <h2 className="section-heading">Enterprise campus engineering</h2>
          <p className="section-subheading">
            Secure, reliable, and compliant infrastructure designed to scale with your institution.
          </p>
        </div>

        <div ref={trustGridRef} className="trust-grid">
          {trustPillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div key={pillar.title} className="scroll-reveal-child trust-card">
                <div className="trust-icon">
                  <Icon size={20} />
                </div>
                <div className="trust-title">{pillar.title}</div>
                <div className="trust-desc">{pillar.desc}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── Final Call To Action ───────────────────────────── */}
      <section className="landing-cta-section">
        <div ref={ctaCardRef} className="scroll-reveal landing-cta-card">
          <h2 className="cta-heading">Ready to experience CampusHub?</h2>
          <p className="cta-subtext">
            Sign in with your institutional credentials or test the full portal
            instantly using role-specific demo accounts.
          </p>
          <div className="cta-button-wrap">
            <Link to="/login" className="cta-btn-main">
              Launch CampusHub Portal <ArrowRight size={18} />
            </Link>
          </div>
          <div className="cta-roles-note">
            <span>Instant access available for:</span>
            <span className="cta-role-chip">Students</span>
            <span className="cta-role-chip">Faculty</span>
            <span className="cta-role-chip">Mentors</span>
            <span className="cta-role-chip">Admins</span>
            <span className="cta-role-chip">Drivers</span>
          </div>
        </div>
      </section>

      {/* ─── Footer ─────────────────────────────────────────── */}
      <footer ref={footerRef} className="scroll-reveal landing-footer">
        <div>
          © {new Date().getFullYear()} CampusHub — Unified Campus Platform. All rights reserved.
        </div>
        <div className="footer-status-pill">
          <span className="status-dot" />
          <span>All Campus Systems Operational</span>
        </div>
      </footer>
    </div>
  );
}
