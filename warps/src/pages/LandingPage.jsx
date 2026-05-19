import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Zap, FileText, Brain, Search, BookOpen, ListChecks,
  Quote, Github, Twitter, Linkedin, Sparkles, Shield, Clock
} from 'lucide-react';

// ─── Constellation Particles ───────────────────────────────────────────────
function ConstellationParticles({ count = 55 }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    const palette = ['108,99,255', '157,235,255', '196,165,253', '244,114,182', '99,179,255'];
    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener('resize', resize);
    const W = () => canvas.offsetWidth, H = () => canvas.offsetHeight;
    const particles = Array.from({ length: count }, () => ({
      x: Math.random() * W(), y: Math.random() * H(),
      r: Math.random() * 2.2 + 0.6,
      dx: (Math.random() - 0.5) * 0.3, dy: (Math.random() - 0.5) * 0.3,
      baseAlpha: Math.random() * 0.5 + 0.15,
      color: palette[Math.floor(Math.random() * palette.length)],
      pulse: Math.random() * Math.PI * 2, pulseSpeed: 0.01 + Math.random() * 0.015,
    }));
    const orbs = Array.from({ length: 6 }, () => ({
      x: Math.random() * W(), y: Math.random() * H(),
      r: Math.random() * 80 + 40, dx: (Math.random() - 0.5) * 0.08, dy: (Math.random() - 0.5) * 0.08,
      color: palette[Math.floor(Math.random() * palette.length)], alpha: Math.random() * 0.06 + 0.02,
    }));
    let frame = 0;
    const draw = () => {
      const w = W(), h = H();
      ctx.clearRect(0, 0, w, h);
      orbs.forEach(o => {
        const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
        g.addColorStop(0, `rgba(${o.color},${o.alpha})`);
        g.addColorStop(1, `rgba(${o.color},0)`);
        ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
        ctx.fillStyle = g; ctx.fill();
        o.x += o.dx; o.y += o.dy;
        if (o.x < -o.r) o.x = w + o.r; if (o.x > w + o.r) o.x = -o.r;
        if (o.y < -o.r) o.y = h + o.r; if (o.y > h + o.r) o.y = -o.r;
      });
      particles.forEach(p => {
        p.pulse += p.pulseSpeed;
        const a = Math.min(1, Math.max(0, p.baseAlpha + Math.sin(p.pulse) * 0.28));
        const g2 = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3.5);
        g2.addColorStop(0, `rgba(${p.color},${a * 0.7})`);
        g2.addColorStop(1, `rgba(${p.color},0)`);
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 3.5, 0, Math.PI * 2);
        ctx.fillStyle = g2; ctx.fill();
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color},${a})`; ctx.fill();
        p.x += p.dx; p.y += p.dy;
        if (p.x < -10) p.x = w + 10; if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10; if (p.y > h + 10) p.y = -10;
      });
      if (frame % 2 === 0) {
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x, dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 110) {
              ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y); ctx.lineTo(particles[j].x, particles[j].y);
              ctx.strokeStyle = `rgba(108,99,255,${(1 - dist / 110) * 0.1})`; ctx.lineWidth = 0.5; ctx.stroke();
            }
          }
        }
      }
      frame++; animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, [count]);
  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }} />;
}

// ─── Orbit System — pure CSS transform, perfectly aligned ──────────────────
// Each card orbits around the exact center of the right panel.
// We use a wrapper div that rotates, then counter-rotate the card so it stays upright.
function OrbitItem({ radius, duration, clockwise = true, startAngle = 0, children }) {
  const [deg, setDeg] = useState(startAngle);
  const rafRef = useRef(null);
  const startRef = useRef(null);

  useEffect(() => {
    const tick = (ts) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed = (ts - startRef.current) / 1000;
      const progress = (elapsed % duration) / duration;
      const angle = startAngle + (clockwise ? 1 : -1) * progress * 360;
      setDeg(angle);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [duration, clockwise, startAngle]);

  const rad = (deg * Math.PI) / 180;
  const x = Math.cos(rad) * radius;
  const y = Math.sin(rad) * radius;

  return (
    <div style={{
      position: 'absolute',
      left: '50%',
      top: '50%',
      transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
      zIndex: 10,
      pointerEvents: 'none',
    }}>
      {children}
    </div>
  );
}

// ─── Mini Orbit Card ────────────────────────────────────────────────────────
function OrbitCard({ icon, label, color }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.95)',
      backdropFilter: 'blur(16px)',
      border: `1.5px solid ${color}35`,
      borderRadius: '0.9rem',
      padding: '0.55rem 0.9rem',
      display: 'flex', alignItems: 'center', gap: '0.45rem',
      boxShadow: `0 6px 20px ${color}22, 0 2px 6px rgba(0,0,0,0.07)`,
      whiteSpace: 'nowrap',
      minWidth: 110,
    }}>
      <span style={{ fontSize: '0.95rem', lineHeight: 1 }}>{icon}</span>
      <span style={{ fontFamily: 'Syne', fontSize: '0.7rem', fontWeight: 700, color: '#1F2937' }}>{label}</span>
    </div>
  );
}

// ─── Animated Counter ───────────────────────────────────────────────────────
function AnimatedCounter({ target, suffix = '' }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        let cur = 0;
        const steps = 60, step = target / steps;
        const t = setInterval(() => {
          cur = Math.min(cur + step, target);
          setCount(cur);
          if (cur >= target) clearInterval(t);
        }, 2000 / steps);
      }
    });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [target]);
  const display = target >= 1000000 ? `${(count / 1000000).toFixed(1)}M`
    : target >= 1000 ? `${Math.round(count / 1000)}K`
    : count.toFixed(count < 10 ? 1 : 0);
  return <span ref={ref}>{display}{suffix}</span>;
}

// ─── Feature Card ───────────────────────────────────────────────────────────
function FeatureCard({ icon, mascotImg, title, desc, accentColor, gradFrom, gradTo, delay }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered
          ? `linear-gradient(135deg, ${gradFrom}15, ${gradTo}10)`
          : 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(20px)',
        border: `1.5px solid ${hovered ? accentColor + '40' : 'rgba(108,99,255,0.12)'}`,
        borderRadius: '1.75rem',
        padding: '1.75rem',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.4s cubic-bezier(0.34,1.56,0.64,1)',
        transform: hovered ? 'translateY(-8px) scale(1.02)' : 'translateY(0) scale(1)',
        boxShadow: hovered
          ? `0 24px 60px ${accentColor}25, 0 8px 24px rgba(0,0,0,0.08)`
          : '0 4px 20px rgba(0,0,0,0.05)',
        cursor: 'default',
      }}
    >
      <div style={{
        position: 'absolute', top: -30, right: -30, width: 120, height: 120,
        background: `radial-gradient(circle, ${accentColor}20 0%, transparent 70%)`,
        borderRadius: '50%',
        transition: 'all 0.4s ease',
        transform: hovered ? 'scale(1.5)' : 'scale(1)',
      }} />
      <div style={{
        position: 'absolute', top: 12, right: 14,
        width: 52, height: 52,
        opacity: hovered ? 1 : 0.55,
        transition: 'all 0.4s ease',
        transform: hovered ? 'scale(1.15) rotate(-5deg)' : 'scale(1)',
        filter: `drop-shadow(0 4px 12px ${accentColor}60)`,
      }}>
        <img src={mascotImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
      </div>
      <div style={{
        width: 52, height: 52, borderRadius: '1.1rem',
        background: `linear-gradient(135deg, ${gradFrom}25, ${gradTo}20)`,
        border: `1.5px solid ${accentColor}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '1.1rem',
        transition: 'all 0.3s ease',
        boxShadow: hovered ? `0 8px 24px ${accentColor}30` : 'none',
      }}>
        {React.cloneElement(icon, { color: accentColor, size: 22 })}
      </div>
      <h3 style={{
        fontFamily: 'Syne', fontWeight: 800, fontSize: '1.05rem',
        color: '#111827', marginBottom: '0.5rem',
      }}>{title}</h3>
      <p style={{ color: '#4B5563', fontSize: '0.85rem', lineHeight: 1.65 }}>{desc}</p>
      <div style={{
        position: 'absolute', bottom: 0, left: 0,
        height: 3, borderRadius: '0 0 1.75rem 1.75rem',
        background: `linear-gradient(90deg, ${gradFrom}, ${gradTo})`,
        width: hovered ? '100%' : '0%',
        transition: 'width 0.4s cubic-bezier(0.34,1.56,0.64,1)',
      }} />
    </div>
  );
}

// ─── Data ───────────────────────────────────────────────────────────────────
const features = [
  {
    icon: <FileText />, mascotImg: '/mascot/reading.png', title: 'AI Document Chat',
    desc: 'Talk to your PDFs naturally. WARPS reads, understands, and answers from any document with pinpoint accuracy.',
    accentColor: '#6C63FF', gradFrom: '#6C63FF', gradTo: '#8A7DFF',
  },
  {
    icon: <Search />, mascotImg: '/mascot/thinking.png', title: 'Semantic Search',
    desc: 'Find exactly what you need with vector-powered search that understands meaning, not just keywords.',
    accentColor: '#0EA5E9', gradFrom: '#0EA5E9', gradTo: '#9DEBFF',
  },
  {
    icon: <Brain />, mascotImg: '/mascot/idle.png', title: 'Session Memory',
    desc: 'WARPS remembers the entire conversation thread. Ask follow-up questions with full context retention.',
    accentColor: '#8B5CF6', gradFrom: '#8B5CF6', gradTo: '#C4B5FD',
  },
  {
    icon: <BookOpen />, mascotImg: '/mascot/headset.png', title: 'OCR Support',
    desc: 'Extract and understand text from scanned documents, image-based PDFs, and handwritten notes.',
    accentColor: '#10B981', gradFrom: '#10B981', gradTo: '#6EE7B7',
  },
  {
    icon: <Zap />, mascotImg: '/mascot/happy.png', title: 'Instant AI Summaries',
    desc: 'Get crisp, structured summaries of any document in seconds. Key insights, highlights, and takeaways.',
    accentColor: '#F59E0B', gradFrom: '#F59E0B', gradTo: '#FCD34D',
  },
  {
    icon: <ListChecks />, mascotImg: '/mascot/typing.png', title: 'Quiz Generation',
    desc: 'Auto-generate MCQ quizzes, flashcards, and comprehension tests from your study materials instantly.',
    accentColor: '#EC4899', gradFrom: '#EC4899', gradTo: '#F9A8D4',
  },
];

const stats = [
  { value: 50000, label: 'PDFs Processed', suffix: '+', icon: '📄' },
  { value: 2000000, label: 'AI Responses', suffix: '+', icon: '🤖' },
  { value: 15000, label: 'Active Users', suffix: '+', icon: '👥' },
  { value: 0.8, label: 'Avg Response (s)', suffix: 's', icon: '⚡' },
];

const testimonials = [
  { name: 'Arjun Mehta', role: 'Research Analyst', avatar: '🧑‍💻', text: 'WARPS completely transformed how I engage with research papers. I can ask questions and receive cited, precise answers in real time.' },
  { name: 'Sneha Krishnan', role: 'Law Student', avatar: '👩‍⚖️', text: 'I upload 50-page legal documents and get exact clause references in seconds. This is genuinely next-generation tooling.' },
  { name: 'David Chen', role: 'Product Manager', avatar: '👨‍💼', text: 'The UI is the most beautiful AI interface I have used. Fast, accurate, and our entire team is hooked on WARPS.' },
];

// Orbit items — evenly distributed starting angles for clean look
const orbitItems = [
  { icon: '📄', label: 'PDF Upload',   color: '#6C63FF', radius: 190, duration: 16,  clockwise: true,  startAngle: 0   },
  { icon: '🔍', label: 'OCR Scan',     color: '#0EA5E9', radius: 190, duration: 16,  clockwise: true,  startAngle: 72  },
  { icon: '✨', label: 'AI Summary',   color: '#8B5CF6', radius: 190, duration: 16,  clockwise: true,  startAngle: 144 },
  { icon: '🧠', label: 'Smart Search', color: '#10B981', radius: 190, duration: 16,  clockwise: true,  startAngle: 216 },
  { icon: '📝', label: 'Quiz Gen',     color: '#EC4899', radius: 190, duration: 16,  clockwise: true,  startAngle: 288 },
];

// ─── Main Landing Page ──────────────────────────────────────────────────────
export default function LandingPage() {
  const [navScrolled, setNavScrolled] = useState(false);
  useEffect(() => {
    const handler = () => setNavScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#F5F7FF', overflowX: 'hidden' }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

        @keyframes float {
          0%,100%{transform:translateY(0px)}
          50%{transform:translateY(-14px)}
        }
        @keyframes pulse-glow {
          0%,100%{box-shadow:0 0 0 0px rgba(108,99,255,0.25), 0 0 40px rgba(108,99,255,0.2), 0 20px 60px rgba(108,99,255,0.2)}
          50%{box-shadow:0 0 0 12px rgba(108,99,255,0.06), 0 0 80px rgba(108,99,255,0.35), 0 20px 60px rgba(157,235,255,0.25)}
        }
        @keyframes wave-ring {
          0%   { transform: translate(-50%,-50%) scale(1);   opacity: 0.5; }
          100% { transform: translate(-50%,-50%) scale(1.6); opacity: 0; }
        }
        @keyframes fadeUp {
          from{opacity:0;transform:translateY(32px)}
          to{opacity:1;transform:translateY(0)}
        }
        @keyframes fadeLeft {
          from{opacity:0;transform:translateX(-40px)}
          to{opacity:1;transform:translateX(0)}
        }
        @keyframes fadeRight {
          from{opacity:0;transform:translateX(40px)}
          to{opacity:1;transform:translateX(0)}
        }
        @keyframes shimmer {
          0%{background-position:-200% center}
          100%{background-position:200% center}
        }
        @keyframes blob {
          0%,100%{border-radius:60% 40% 30% 70%/60% 30% 70% 40%}
          50%{border-radius:30% 60% 70% 40%/50% 60% 30% 60%}
        }
        @keyframes cardFloat {
          0%,100%{transform:translateY(0)}
          50%{transform:translateY(-8px)}
        }
        @keyframes marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        .btn-warp-primary {
          background: linear-gradient(135deg,#6C63FF,#8A7DFF);
          color:white; border:none; border-radius:999px;
          padding:0.9rem 2.4rem; font-family:'Syne',sans-serif;
          font-weight:700; font-size:0.95rem; cursor:pointer;
          box-shadow:0 4px 24px rgba(108,99,255,0.35);
          transition:all 0.35s cubic-bezier(0.34,1.56,0.64,1);
          position:relative; overflow:hidden;
        }
        .btn-warp-primary:hover {
          transform:translateY(-3px) scale(1.04);
          box-shadow:0 12px 40px rgba(108,99,255,0.5);
        }
        .btn-warp-ghost {
          background:transparent; color:#6C63FF;
          border:2px solid #6C63FF; border-radius:999px;
          padding:0.88rem 2.2rem; font-family:'Syne',sans-serif;
          font-weight:700; font-size:0.95rem; cursor:pointer;
          transition:all 0.35s cubic-bezier(0.34,1.56,0.64,1);
        }
        .btn-warp-ghost:hover {
          transform:translateY(-3px) scale(1.04);
          border-color:#8A7DFF;
          box-shadow:0 8px 30px rgba(108,99,255,0.2);
          color:#8A7DFF;
        }
        .nav-link {
          font-family:'DM Sans',sans-serif; font-size:0.88rem;
          color:#374151; text-decoration:none; font-weight:500;
          position:relative; padding-bottom:2px;
          transition:color 0.2s;
        }
        .nav-link::after {
          content:''; position:absolute; bottom:0; left:0;
          width:0; height:1.5px;
          background:linear-gradient(90deg,#6C63FF,#9DEBFF);
          transition:width 0.3s ease;
        }
        .nav-link:hover { color:#6C63FF; }
        .nav-link:hover::after { width:100%; }
        .stat-card:hover { transform:translateY(-6px) scale(1.03); }
        .testimonial-card:hover { transform:translateY(-6px); box-shadow:0 20px 60px rgba(108,99,255,0.18) !important; }
      `}</style>

      {/* ── NAVBAR ──────────────────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.9rem 5rem',
        background: navScrolled ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.7)',
        backdropFilter: 'blur(28px)',
        borderBottom: navScrolled ? '1px solid rgba(108,99,255,0.12)' : '1px solid transparent',
        boxShadow: navScrolled ? '0 4px 24px rgba(108,99,255,0.08)' : 'none',
        transition: 'all 0.4s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            width: 38, height: 38,
            background: 'linear-gradient(135deg, #6C63FF, #9DEBFF)',
            borderRadius: '11px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(108,99,255,0.4)',
          }}>
            <Zap size={20} color="white" />
          </div>
          <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '1.45rem', color: '#111827', letterSpacing: '0.04em' }}>
            WARPS
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}>
          {['Features', 'Showcase', 'Pricing'].map(item => (
            <a key={item} href={`#${item.toLowerCase()}`} className="nav-link">{item}</a>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <Link to="/login"><button className="btn-warp-ghost" style={{ padding: '0.55rem 1.5rem', fontSize: '0.88rem' }}>Login</button></Link>
          <Link to="/signup"><button className="btn-warp-primary" style={{ padding: '0.6rem 1.6rem', fontSize: '0.88rem' }}>Get Started</button></Link>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        padding: '7rem 5rem 4rem',
        position: 'relative',
        overflow: 'hidden',
        background: 'radial-gradient(ellipse 90% 70% at 30% 50%, rgba(108,99,255,0.07) 0%, transparent 60%), radial-gradient(ellipse 60% 80% at 80% 30%, rgba(157,235,255,0.1) 0%, transparent 60%)',
      }}>
        <ConstellationParticles count={55} />

        {/* Ambient blobs */}
        <div style={{
          position: 'absolute', width: 600, height: 600, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(108,99,255,0.08) 0%, transparent 70%)',
          top: '-10%', left: '5%', pointerEvents: 'none', zIndex: 0,
          animation: 'blob 10s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(157,235,255,0.12) 0%, transparent 70%)',
          bottom: '-5%', right: '20%', pointerEvents: 'none', zIndex: 0,
          animation: 'blob 14s ease-in-out 3s infinite',
        }} />

        {/* LEFT: Text */}
        <div style={{
          flex: '0 0 auto',
          width: '48%',
          maxWidth: 520,
          position: 'relative',
          zIndex: 2,
          animation: 'fadeLeft 0.9s ease forwards',
        }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            background: 'linear-gradient(135deg, rgba(108,99,255,0.12), rgba(157,235,255,0.1))',
            border: '1px solid rgba(108,99,255,0.3)',
            borderRadius: '999px', padding: '0.45rem 1.1rem',
            marginBottom: '1.75rem',
          }}>
            <Sparkles size={13} color="#6C63FF" />
            <span style={{ fontFamily: 'Syne', fontSize: '0.75rem', fontWeight: 700, color: '#5B52E8', letterSpacing: '0.04em' }}>
              Powered by Retrieval Augmented Generation
            </span>
          </div>

          {/* Headline — fixed font sizes so text doesn't overflow */}
          <h1 style={{
            fontFamily: 'Syne',
            fontWeight: 800,
            lineHeight: 1.08,
            fontSize: 'clamp(2.4rem, 3.8vw, 3.8rem)',
            color: '#0F0F1A',
            marginBottom: '1.4rem',
            letterSpacing: '-0.02em',
          }}>
            Think Smarter.<br />
            <span style={{
              background: 'linear-gradient(135deg, #6C63FF 0%, #9DEBFF 60%, #C4B5FD 100%)',
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: 'shimmer 4s linear infinite',
            }}>
              Ask Anything.
            </span>
            <br />
            <span style={{ color: '#374151', fontSize: '78%', fontWeight: 700 }}>
              From Your Own Docs.
            </span>
          </h1>

          <p style={{
            fontSize: '1rem',
            color: '#4B5563',
            lineHeight: 1.8,
            marginBottom: '2.25rem',
            maxWidth: 460,
          }}>
            Upload PDFs and instantly unlock an AI that reads, reasons, and answers with source citations —
            built for researchers, students, and power users.
          </p>

          {/* CTA */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
            <Link to="/chat">
              <button className="btn-warp-primary" style={{ padding: '0.95rem 2.6rem', fontSize: '0.98rem' }}>
                Start Chatting
              </button>
            </Link>
            <button className="btn-warp-ghost" style={{ padding: '0.95rem 2.2rem', fontSize: '0.98rem' }}>
              Watch Demo
            </button>
          </div>

          {/* Social proof */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            {[
              { label: '50K+ PDFs processed', icon: '📄' },
              { label: '2M+ AI answers', icon: '🤖' },
              { label: '0.8s response time', icon: '⚡' },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.88rem' }}>{s.icon}</span>
                <span style={{ fontFamily: 'DM Sans', fontSize: '0.8rem', color: '#6B7280', fontWeight: 600 }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Orbit System */}
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          minHeight: 500,
          zIndex: 2,
          animation: 'fadeRight 0.9s ease 0.2s forwards',
          opacity: 0,
        }}>
          {/* Orbit ring (visible dashed circle) */}
          <div style={{
            position: 'absolute',
            left: '50%', top: '50%',
            width: 380, height: 380,
            transform: 'translate(-50%, -50%)',
            border: '1.5px dashed rgba(108,99,255,0.2)',
            borderRadius: '50%',
            pointerEvents: 'none',
            zIndex: 1,
          }} />

          {/* Wave rings around center bubble */}
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              position: 'absolute',
              left: '50%', top: '50%',
              width: 260, height: 260,
              borderRadius: '50%',
              border: '2px solid rgba(108,99,255,0.25)',
              animation: `wave-ring 2.8s ease-out ${i * 0.9}s infinite`,
              pointerEvents: 'none',
              zIndex: 1,
            }} />
          ))}

          {/* Orbiting cards — all on same radius for clean orbit */}
          {orbitItems.map((item, idx) => (
            <OrbitItem
              key={idx}
              radius={190}
              duration={18}
              clockwise={true}
              startAngle={item.startAngle}
            >
              <OrbitCard icon={item.icon} label={item.label} color={item.color} />
            </OrbitItem>
          ))}

          {/* Center mascot bubble — bigger, centered */}
          <div style={{
            position: 'relative',
            zIndex: 5,
            width: 260,
            height: 260,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {/* Bubble bg */}
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              background: 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.97) 0%, rgba(238,242,255,0.9) 55%, rgba(200,241,255,0.7) 100%)',
              border: '2px solid rgba(108,99,255,0.25)',
              animation: 'pulse-glow 3.5s ease-in-out infinite',
              backdropFilter: 'blur(20px)',
            }} />

            {/* Mascot */}
            <img
              src="/mascot/idle.png"
              alt="WARPS Mascot"
              style={{
                width: 195,
                height: 195,
                objectFit: 'contain',
                position: 'relative',
                zIndex: 2,
                animation: 'float 4.5s ease-in-out infinite',
                filter: 'drop-shadow(0 12px 32px rgba(108,99,255,0.4))',
              }}
            />
          </div>
        </div>
      </section>

      {/* ── MARQUEE TRUST BAR — proper scrolling, no spin ────────────────── */}
      <div style={{
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid rgba(108,99,255,0.1)',
        borderBottom: '1px solid rgba(108,99,255,0.1)',
        padding: '1rem 0',
        overflow: 'hidden',
      }}>
        {/* Duplicate content so scroll is seamless */}
        <div style={{
          display: 'flex',
          gap: '3.5rem',
          alignItems: 'center',
          width: 'max-content',
          animation: 'marquee 28s linear infinite',
        }}>
          {[...Array(2)].flatMap(() =>
            ['🔒 Enterprise Ready', '⚡ Sub-second Responses', '📚 Multi-PDF Support', '🔍 Semantic Search', '🧠 RAG Architecture', '📝 Auto Citations', '🎯 95%+ Accuracy', '✨ AI Summaries', '📊 Quiz Generation'].map(t => (
              <span key={t + Math.random()} style={{ fontFamily: 'Syne', fontSize: '0.82rem', fontWeight: 600, color: '#4B5563', flexShrink: 0 }}>{t}</span>
            ))
          )}
        </div>
      </div>

      {/* ── FEATURES ─────────────────────────────────────────────────────── */}
      <section id="features" style={{
        padding: '7rem 5rem',
        background: 'linear-gradient(180deg, #F5F7FF 0%, #EEF2FF 100%)',
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute', top: 60, right: -80, width: 300, height: 300,
          background: 'radial-gradient(circle, rgba(108,99,255,0.08) 0%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none',
        }} />

        <div style={{ textAlign: 'center', marginBottom: '4rem', position: 'relative' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            background: 'rgba(108,99,255,0.08)', border: '1px solid rgba(108,99,255,0.25)',
            borderRadius: '99px', padding: '0.35rem 1rem', marginBottom: '1.25rem',
          }}>
            <Sparkles size={12} color="#6C63FF" />
            <span style={{ fontFamily: 'Syne', fontSize: '0.75rem', fontWeight: 700, color: '#5B52E8', letterSpacing: '0.06em' }}>FEATURES</span>
          </div>
          <h2 style={{
            fontFamily: 'Syne', fontWeight: 800, color: '#0F0F1A',
            fontSize: 'clamp(2rem, 4vw, 3rem)', marginBottom: '0.75rem',
          }}>
            Everything you need to<br />
            <span style={{ background: 'linear-gradient(135deg, #6C63FF, #9DEBFF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              think faster
            </span>
          </h2>
          <p style={{ color: '#4B5563', fontSize: '1rem', maxWidth: 500, margin: '0 auto' }}>
            Powerful AI features crafted for researchers, students, legal professionals, and teams.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem', maxWidth: 1100, margin: '0 auto',
        }}>
          {features.map((f, i) => (
            <FeatureCard key={f.title} {...f} delay={i * 0.08} />
          ))}
        </div>
      </section>

      {/* ── SHOWCASE ─────────────────────────────────────────────────────── */}
      <section id="showcase" style={{
        padding: '7rem 5rem',
        background: '#FFFFFF',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(108,99,255,0.04) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '5rem', maxWidth: 1100, margin: '0 auto', flexWrap: 'wrap' }}>
          {/* Left */}
          <div style={{ flex: 1, minWidth: 300, position: 'relative', minHeight: 420, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{
              position: 'absolute', width: 320, height: 320, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(108,99,255,0.12) 0%, transparent 70%)',
              top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            }} />
            <img
              src="/mascot/thinking.png"
              alt="WARPS thinking"
              style={{
                width: 200, height: 200, objectFit: 'contain',
                filter: 'drop-shadow(0 16px 40px rgba(108,99,255,0.4))',
                animation: 'float 4s ease-in-out infinite',
                position: 'relative', zIndex: 2,
              }}
            />
            {[
              { top: '10%', left: '-5%', bg: 'rgba(108,99,255,0.08)', border: '#6C63FF', text: '📄 Processing PDF...', sub: 'Extracting embeddings', delay: 0 },
              { top: '55%', left: '-10%', bg: 'rgba(16,185,129,0.08)', border: '#10B981', text: '✅ Indexed 142 chunks', sub: '98ms · Ready to query', delay: 0.4 },
              { top: '15%', right: '-5%', bg: 'rgba(239,68,68,0.06)', border: '#EF4444', text: '🔍 Semantic Match', sub: 'Score: 0.97 · p.14', delay: 0.8 },
              { top: '65%', right: '-8%', bg: 'rgba(245,158,11,0.08)', border: '#F59E0B', text: '✨ Summary ready', sub: '3 key insights found', delay: 1.2 },
            ].map((c, i) => (
              <div key={i} style={{
                position: 'absolute', top: c.top, left: c.left, right: c.right,
                background: c.bg, backdropFilter: 'blur(16px)',
                border: `1px solid ${c.border}30`, borderRadius: '1rem',
                padding: '0.65rem 1rem',
                boxShadow: `0 8px 24px ${c.border}15`,
                animation: `cardFloat ${3 + i * 0.5}s ease-in-out ${c.delay}s infinite`,
                zIndex: 3, whiteSpace: 'nowrap',
              }}>
                <div style={{ fontFamily: 'Syne', fontSize: '0.78rem', fontWeight: 700, color: '#111827' }}>{c.text}</div>
                <div style={{ fontFamily: 'DM Sans', fontSize: '0.7rem', color: '#6B7280', marginTop: '1px' }}>{c.sub}</div>
              </div>
            ))}
          </div>

          {/* Right */}
          <div style={{ flex: 1, minWidth: 280 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              background: 'rgba(108,99,255,0.08)', border: '1px solid rgba(108,99,255,0.25)',
              borderRadius: '99px', padding: '0.35rem 1rem', marginBottom: '1.5rem',
            }}>
              <Sparkles size={12} color="#6C63FF" />
              <span style={{ fontFamily: 'Syne', fontSize: '0.75rem', fontWeight: 700, color: '#5B52E8', letterSpacing: '0.06em' }}>HOW IT WORKS</span>
            </div>
            <h2 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 'clamp(1.8rem, 3vw, 2.8rem)', color: '#0F0F1A', marginBottom: '1.5rem', lineHeight: 1.2 }}>
              From upload to<br />
              <span style={{ background: 'linear-gradient(135deg, #6C63FF, #9DEBFF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                insight in seconds
              </span>
            </h2>
            {[
              { step: '01', title: 'Upload your PDFs', desc: 'Drag and drop any PDF — scanned, digital, or image-based. WARPS extracts and indexes everything.', icon: '📤' },
              { step: '02', title: 'AI processes the content', desc: 'Text is chunked, embedded, and stored in a vector database for lightning-fast semantic retrieval.', icon: '⚡' },
              { step: '03', title: 'Ask anything', desc: 'Type your question. WARPS finds the most relevant passages and generates cited, accurate answers.', icon: '💬' },
            ].map((s) => (
              <div key={s.step} style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'flex-start' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '1rem', flexShrink: 0,
                  background: 'linear-gradient(135deg, rgba(108,99,255,0.15), rgba(157,235,255,0.15))',
                  border: '1px solid rgba(108,99,255,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'Syne', fontSize: '0.7rem', fontWeight: 800, color: '#5B52E8',
                }}>
                  {s.step}
                </div>
                <div>
                  <h4 style={{ fontFamily: 'Syne', fontWeight: 700, color: '#111827', marginBottom: '0.3rem', fontSize: '0.95rem' }}>
                    {s.icon} {s.title}
                  </h4>
                  <p style={{ color: '#4B5563', fontSize: '0.85rem', lineHeight: 1.6 }}>{s.desc}</p>
                </div>
              </div>
            ))}
            <Link to="/chat">
              <button className="btn-warp-primary" style={{ marginTop: '0.5rem' }}>Try it free</button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────────────────────── */}
      <section style={{
        padding: '5rem 5rem',
        background: 'linear-gradient(135deg, #5B52E8 0%, #6C63FF 40%, #7A6CFF 70%, #4FACFE 100%)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 70% 80% at 20% 50%, rgba(255,255,255,0.08) 0%, transparent 60%)',
          pointerEvents: 'none',
        }} />
        <div style={{ display: 'flex', justifyContent: 'center', gap: '3rem', flexWrap: 'wrap', position: 'relative' }}>
          {stats.map((s) => (
            <div
              key={s.label}
              className="stat-card"
              style={{
                textAlign: 'center', padding: '2rem 2.5rem',
                background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '1.5rem',
                transition: 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                minWidth: 160,
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>{s.icon}</div>
              <div style={{ fontFamily: 'Syne', fontSize: '2.6rem', fontWeight: 800, color: 'white', lineHeight: 1 }}>
                <AnimatedCounter target={s.value} suffix={s.suffix} />
              </div>
              <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.85rem', marginTop: '0.4rem', fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────────────────── */}
      <section style={{ padding: '7rem 5rem', background: 'linear-gradient(180deg, #EEF2FF 0%, #F5F7FF 100%)' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            background: 'rgba(108,99,255,0.08)', border: '1px solid rgba(108,99,255,0.25)',
            borderRadius: '99px', padding: '0.35rem 1rem', marginBottom: '1.25rem',
          }}>
            <Sparkles size={12} color="#6C63FF" />
            <span style={{ fontFamily: 'Syne', fontSize: '0.75rem', fontWeight: 700, color: '#5B52E8', letterSpacing: '0.06em' }}>TESTIMONIALS</span>
          </div>
          <h2 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 'clamp(2rem, 3.5vw, 3rem)', color: '#0F0F1A' }}>
            Loved by thinkers everywhere
          </h2>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
          gap: '1.5rem', maxWidth: 1050, margin: '0 auto',
        }}>
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="testimonial-card"
              style={{
                background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)',
                border: '1.5px solid rgba(108,99,255,0.15)', borderRadius: '1.75rem',
                padding: '2rem', position: 'relative', overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                transition: 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
              }}
            >
              <div style={{
                position: 'absolute', top: -30, right: -30, width: 100, height: 100,
                background: 'radial-gradient(circle, rgba(108,99,255,0.08) 0%, transparent 70%)',
                borderRadius: '50%',
              }} />
              <Quote size={22} color="#6C63FF" style={{ marginBottom: '1rem', opacity: 0.8 }} />
              <p style={{ color: '#374151', lineHeight: 1.75, fontSize: '0.88rem', marginBottom: '1.5rem', fontStyle: 'italic' }}>
                "{t.text}"
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: 42, height: 42, borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(108,99,255,0.15), rgba(157,235,255,0.15))',
                  border: '2px solid rgba(108,99,255,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.2rem',
                }}>
                  {t.avatar}
                </div>
                <div>
                  <div style={{ fontFamily: 'Syne', fontWeight: 700, color: '#111827', fontSize: '0.9rem' }}>{t.name}</div>
                  <div style={{ color: '#6B7280', fontSize: '0.78rem', fontWeight: 500 }}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA BANNER ───────────────────────────────────────────────────── */}
      <section style={{
        padding: '6rem 5rem', textAlign: 'center',
        background: 'linear-gradient(135deg, #6C63FF 0%, #8A7DFF 50%, #9DEBFF 100%)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 100% at 50% 50%, rgba(255,255,255,0.08) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <img src="/mascot/happy.png" alt="" style={{ width: 100, height: 100, objectFit: 'contain', filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.2))', animation: 'float 3.5s ease-in-out infinite', marginBottom: '1.5rem' }} />
          <h2 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 'clamp(2rem, 4vw, 3.2rem)', color: 'white', marginBottom: '1rem' }}>
            Ready to think faster?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '1rem', marginBottom: '2.5rem' }}>
            Upload your first PDF free. No credit card required.
          </p>
          <Link to="/signup">
            <button style={{
              background: 'white', color: '#6C63FF', border: 'none',
              borderRadius: '999px', padding: '1rem 3rem',
              fontFamily: 'Syne', fontWeight: 800, fontSize: '1rem', cursor: 'pointer',
              boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
              transition: 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px) scale(1.05)'; e.currentTarget.style.boxShadow = '0 16px 48px rgba(0,0,0,0.2)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.15)'; }}
            >
              Get Started for Free
            </button>
          </Link>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer style={{
        padding: '3rem 5rem',
        background: 'rgba(255,255,255,0.98)',
        borderTop: '1px solid rgba(108,99,255,0.1)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: 34, height: 34, background: 'linear-gradient(135deg, #6C63FF, #9DEBFF)',
              borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Zap size={18} color="white" />
            </div>
            <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '1.2rem', color: '#111827' }}>WARPS</span>
          </div>

          <div style={{ display: 'flex', gap: '2rem' }}>
            {['Privacy', 'Terms', 'Contact', 'Docs'].map(l => (
              <a key={l} href="#" className="nav-link" style={{ fontSize: '0.82rem' }}>{l}</a>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <p style={{ color: '#9CA3AF', fontSize: '0.78rem', marginRight: '0.5rem' }}>© 2026 WARPS AI</p>
            {[<Github size={17} />, <Twitter size={17} />, <Linkedin size={17} />].map((icon, i) => (
              <a key={i} href="#" style={{
                width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(108,99,255,0.06)', border: '1px solid rgba(108,99,255,0.15)',
                borderRadius: '50%', color: '#6B7280', textDecoration: 'none',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = '#6C63FF'; e.currentTarget.style.background = 'rgba(108,99,255,0.12)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#6B7280'; e.currentTarget.style.background = 'rgba(108,99,255,0.06)'; }}
              >{icon}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}