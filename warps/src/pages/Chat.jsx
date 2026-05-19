import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Sparkles, MessageCircle, Lightbulb, BookOpen, HelpCircle, Zap, FileText,
  Copy, ThumbsUp, ThumbsDown, RotateCcw,
} from 'lucide-react';

import Sidebar from '../components/layout/Sidebar';
import ChatInput from '../components/chat/ChatInput';
import ChatBubble from '../components/chat/ChatBubble';
import TypingIndicator from '../components/chat/TypingIndicator';
import UploadZone from '../components/chat/UploadZone';
import WarpsMascot from '../components/ui/WarpsMascot';

import useChatStore from '../store/chatStore';

import {
  getMessages,
  askQuestion,
  summarize,
  generateQuiz,
  renameSession,
} from '../services/api';

import toast from 'react-hot-toast';

// ─────────────────────────────────────────────────────────────
// Suggestion chips config
// ─────────────────────────────────────────────────────────────
const suggestions = [
  { icon: <MessageCircle size={15} />, text: 'What can you help me with?',     color: '#6C63FF', glow: 'rgba(108,99,255,0.25)' },
  { icon: <Lightbulb    size={15} />, text: 'Give me a fun fact',               color: '#F59E0B', glow: 'rgba(245,158,11,0.25)' },
  { icon: <HelpCircle   size={15} />, text: 'Explain something complex simply', color: '#8B5CF6', glow: 'rgba(139,92,246,0.25)' },
  { icon: <BookOpen     size={15} />, text: 'Summarize an uploaded document',   color: '#10B981', glow: 'rgba(16,185,129,0.25)' },
  { icon: <Zap          size={15} />, text: 'Generate a quick quiz',            color: '#0EA5E9', glow: 'rgba(14,165,233,0.25)' },
  { icon: <Sparkles     size={15} />, text: 'What are the main ideas?',         color: '#EC4899', glow: 'rgba(236,72,153,0.25)' },
];

const EMOJI_REACTIONS = [
  { emoji: '❤️', label: 'Love', key: 'love' },
  { emoji: '🔥', label: 'Fire', key: 'fire' },
  { emoji: '😂', label: 'Haha', key: 'haha' },
  { emoji: '😮', label: 'Wow',  key: 'wow'  },
  { emoji: '👏', label: 'Clap', key: 'clap' },
  { emoji: '🎯', label: 'Spot', key: 'spot' },
];

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
function makeTitleFromMessage(text) {
  const cleaned = text.trim().replace(/[^\w\s]/g, '').trim();
  const words   = cleaned.split(/\s+/).slice(0, 5).join(' ');
  return (words.charAt(0).toUpperCase() + words.slice(1)) || 'New Chat';
}

// ─────────────────────────────────────────────────────────────
// GLOBAL CSS
// ─────────────────────────────────────────────────────────────
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap');

  /* ── Orb drifts ── */
  @keyframes orb-drift-1 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(25px,-18px) scale(1.04)} 66%{transform:translate(-18px,22px) scale(0.97)} }
  @keyframes orb-drift-2 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(-22px,14px) scale(1.03)} 66%{transform:translate(18px,-26px) scale(0.98)} }
  @keyframes orb-drift-3 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-12px,-18px) scale(1.05)} }

  @keyframes chat-ripple-out {
    0%   { transform: translate(-50%,-50%) scale(1); opacity: 0.5; }
    100% { transform: translate(-50%,-50%) scale(20); opacity: 0; }
  }
  @keyframes msg-slide-in {
    from { opacity: 0; transform: translateY(20px) scale(0.98); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes topbar-shimmer {
    0%   { background-position: 0% center; }
    100% { background-position: 300% center; }
  }
  @keyframes empty-float {
    0%,100% { transform: translateY(0) rotate(-0.5deg); }
    50%     { transform: translateY(-13px) rotate(0.5deg); }
  }
  @keyframes empty-fade-up {
    from { opacity: 0; transform: translateY(26px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes welcome-shimmer {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
  @keyframes chip-shimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  @keyframes live-ping {
    0%   { transform: scale(1); opacity: 0.8; }
    100% { transform: scale(2.4); opacity: 0; }
  }
  @keyframes emoji-pop {
    from { opacity: 0; transform: scale(0) rotate(-20deg); }
    60%  { transform: scale(1.3) rotate(5deg); }
    to   { opacity: 1; transform: scale(1) rotate(0deg); }
  }
  @keyframes emoji-burst {
    0%   { opacity: 1; transform: translateY(0) scale(1); }
    50%  { opacity: 0.8; transform: translateY(-40px) scale(1.4); }
    100% { opacity: 0; transform: translateY(-80px) scale(0.6); }
  }
  @keyframes mascot-glow-ring {
    0%   { transform: translate(-50%,-50%) scale(1); opacity: 0.4; }
    100% { transform: translate(-50%,-50%) scale(2.3); opacity: 0; }
  }
  @keyframes welcome-ring {
    0%   { transform: translate(-50%,-50%) scale(1); opacity: 0.4; }
    100% { transform: translate(-50%,-50%) scale(2.1); opacity: 0; }
  }
  @keyframes welcome-pulse {
    0%,100% { box-shadow: 0 0 0 0 rgba(108,99,255,0.15), 0 8px 40px rgba(108,99,255,0.12); }
    50%     { box-shadow: 0 0 0 14px rgba(108,99,255,0.03), 0 8px 60px rgba(108,99,255,0.22); }
  }
  @keyframes welcome-float {
    0%,100% { transform: translateY(0) rotate(-1deg); }
    50%     { transform: translateY(-15px) rotate(1deg); }
  }
  @keyframes welcome-fade-up { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
  @keyframes tag-float {
    0%,100% { transform: translateY(0); }
    50%     { transform: translateY(-5px); }
  }
  @keyframes sparkle-spin {
    0%   { transform: rotate(0deg) scale(1); opacity: 0.6; }
    50%  { transform: rotate(180deg) scale(1.3); opacity: 1; }
    100% { transform: rotate(360deg) scale(1); opacity: 0.6; }
  }
  @keyframes particle-twinkle {
    0%,100% { opacity: 0.3; transform: scale(0.8); }
    50%     { opacity: 1; transform: scale(1.2); }
  }
  @keyframes gradient-flow {
    0%   { background-position: 0% 50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  @keyframes border-dance {
    0%,100% { border-color: rgba(108,99,255,0.22); }
    33%     { border-color: rgba(14,165,233,0.3); }
    66%     { border-color: rgba(236,72,153,0.25); }
  }
  @keyframes mascot-bob {
    0%,100% { transform: translateY(0) rotate(-1deg) scale(1); }
    25%     { transform: translateY(-6px) rotate(0.5deg) scale(1.02); }
    75%     { transform: translateY(3px) rotate(-0.5deg) scale(0.99); }
  }
  @keyframes shine-sweep {
    0%   { left: -100%; }
    100% { left: 200%; }
  }

  .chat-scroll::-webkit-scrollbar       { width: 4px; }
  .chat-scroll::-webkit-scrollbar-track  { background: transparent; }
  .chat-scroll::-webkit-scrollbar-thumb  { background: rgba(108,99,255,0.22); border-radius: 99px; }
  .chat-scroll::-webkit-scrollbar-thumb:hover { background: rgba(108,99,255,0.42); }
`;

// ─────────────────────────────────────────────────────────────
// Animated Canvas Background — light edition with iridescent orbs
// ─────────────────────────────────────────────────────────────
function ChatBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    // Light, pastel palette
    const palette = ['108,99,255', '157,235,255', '196,165,253', '99,179,255', '252,165,165', '167,243,208'];

    const resize = () => {
      canvas.width  = canvas.offsetWidth  * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener('resize', resize);

    const W = () => canvas.offsetWidth;
    const H = () => canvas.offsetHeight;

    const orbs = Array.from({ length: 6 }, (_, i) => ({
      x: Math.random() * W(), y: Math.random() * H(),
      r: Math.random() * 220 + 100,
      dx: (Math.random() - 0.5) * 0.2, dy: (Math.random() - 0.5) * 0.2,
      color: palette[i % palette.length],
      alpha: Math.random() * 0.07 + 0.03,
    }));

    const particles = Array.from({ length: 38 }, () => ({
      x: Math.random() * W(), y: Math.random() * H(),
      r: Math.random() * 2 + 0.5,
      dx: (Math.random() - 0.5) * 0.28, dy: (Math.random() - 0.5) * 0.28,
      baseAlpha: Math.random() * 0.35 + 0.1,
      color: palette[Math.floor(Math.random() * palette.length)],
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: 0.008 + Math.random() * 0.014,
    }));

    // Light sparkles (tiny bright dots)
    const sparkles = Array.from({ length: 18 }, () => ({
      x: Math.random() * W(), y: Math.random() * H(),
      r: Math.random() * 1.5 + 0.5,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: 0.02 + Math.random() * 0.04,
      color: palette[Math.floor(Math.random() * palette.length)],
    }));

    let frame = 0;
    const draw = () => {
      const w = W(), h = H();
      ctx.clearRect(0, 0, w, h);

      // Soft radial gradient wash
      const centerGrad = ctx.createRadialGradient(w * 0.5, h * 0.3, 0, w * 0.5, h * 0.3, w * 0.7);
      centerGrad.addColorStop(0, 'rgba(108,99,255,0.04)');
      centerGrad.addColorStop(1, 'rgba(108,99,255,0)');
      ctx.fillStyle = centerGrad;
      ctx.fillRect(0, 0, w, h);

      // Animated orbs
      orbs.forEach(o => {
        const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
        g.addColorStop(0,   `rgba(${o.color},${o.alpha})`);
        g.addColorStop(0.5, `rgba(${o.color},${o.alpha * 0.4})`);
        g.addColorStop(1,   `rgba(${o.color},0)`);
        ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
        ctx.fillStyle = g; ctx.fill();
        o.x += o.dx; o.y += o.dy;
        if (o.x < -o.r) o.x = w + o.r; if (o.x > w + o.r) o.x = -o.r;
        if (o.y < -o.r) o.y = h + o.r; if (o.y > h + o.r) o.y = -o.r;
      });

      // Sparkle dots
      sparkles.forEach(s => {
        s.pulse += s.pulseSpeed;
        const a = (Math.sin(s.pulse) * 0.5 + 0.5) * 0.5;
        const r = s.r * (0.8 + Math.sin(s.pulse) * 0.3);
        // star shape
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.fillStyle = `rgba(${s.color},${a})`;
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
          const angle = (i * Math.PI) / 2;
          ctx.ellipse(Math.cos(angle) * r * 1.5, Math.sin(angle) * r * 1.5, r * 0.3, r * 1.5, angle, 0, Math.PI * 2);
        }
        ctx.fill();
        ctx.restore();
      });

      // Connection mesh
      particles.forEach(p => {
        p.pulse += p.pulseSpeed;
        const a = Math.min(1, Math.max(0, p.baseAlpha + Math.sin(p.pulse) * 0.2));
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color},${a})`; ctx.fill();
        p.x += p.dx; p.y += p.dy;
        if (p.x < -10) p.x = w + 10; if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10; if (p.y > h + 10) p.y = -10;
      });

      if (frame % 2 === 0) {
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 95) {
              ctx.beginPath();
              ctx.moveTo(particles[i].x, particles[i].y);
              ctx.lineTo(particles[j].x, particles[j].y);
              ctx.strokeStyle = `rgba(108,99,255,${(1 - dist / 95) * 0.07})`;
              ctx.lineWidth = 0.5; ctx.stroke();
            }
          }
        }
      }
      frame++;
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);

  return (
    <canvas ref={canvasRef} style={{
      position: 'absolute', inset: 0,
      width: '100%', height: '100%',
      pointerEvents: 'none', zIndex: 0,
    }} />
  );
}

// ─────────────────────────────────────────────────────────────
// Floating Orb Decorations — light palette
// ─────────────────────────────────────────────────────────────
function FloatingOrbs() {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
      {[
        { w: 340, h: 340, top: '-100px', left: '-100px',   bg: 'radial-gradient(circle, rgba(108,99,255,0.1) 0%, transparent 70%)',  anim: 'orb-drift-1 18s ease-in-out infinite' },
        { w: 300, h: 300, bottom: '-80px', right: '-80px', bg: 'radial-gradient(circle, rgba(236,72,153,0.08) 0%, transparent 70%)', anim: 'orb-drift-2 22s ease-in-out infinite' },
        { w: 220, h: 220, top: '35%', right: '4%',         bg: 'radial-gradient(circle, rgba(14,165,233,0.07) 0%, transparent 70%)', anim: 'orb-drift-3 15s ease-in-out infinite' },
        { w: 180, h: 180, top: '15%', left: '8%',          bg: 'radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%)', anim: 'orb-drift-2 20s ease-in-out infinite 3s' },
      ].map((o, i) => (
        <div key={i} style={{
          position: 'absolute', width: o.w, height: o.h,
          top: o.top, left: o.left, bottom: o.bottom, right: o.right,
          background: o.bg,
          animation: o.anim,
          borderRadius: '50%',
        }} />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Suggestion Chip — light glassmorphism with hover magic
// ─────────────────────────────────────────────────────────────
function SuggestionChip({ icon, text, color, glow, delay, onClick }) {
  const [hovered, setHovered] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pressed, setPressed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <button
      onClick={() => { setPressed(true); setTimeout(() => setPressed(false), 300); onClick(); }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered
          ? 'rgba(255,255,255,1)'
          : 'rgba(255,255,255,0.82)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: `1.5px solid ${hovered ? color + '55' : 'rgba(108,99,255,0.13)'}`,
        borderRadius: '16px',
        padding: '0.9rem 1rem',
        display: 'flex', alignItems: 'flex-start', gap: '0.58rem',
        cursor: 'pointer',
        fontFamily: '"DM Sans", sans-serif', fontSize: '0.82rem',
        color: hovered ? '#111827' : '#374151',
        fontWeight: 500,
        textAlign: 'left', lineHeight: 1.5,
        boxShadow: hovered
          ? `0 12px 36px ${glow}, 0 4px 12px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)`
          : '0 2px 12px rgba(108,99,255,0.06), inset 0 1px 0 rgba(255,255,255,0.8)',
        transform: mounted
          ? pressed ? 'scale(0.96)' : hovered ? 'translateY(-6px) scale(1.02)' : 'translateY(0) scale(1)'
          : 'translateY(26px)',
        opacity: mounted ? 1 : 0,
        transition: `opacity 0.5s ease ${delay}ms,
          transform 0.4s cubic-bezier(0.34,1.56,0.64,1),
          border-color 0.25s, box-shadow 0.25s, background 0.2s, color 0.2s`,
        position: 'relative', overflow: 'hidden',
        animation: mounted ? `border-dance ${6 + delay * 0.005}s ease-in-out infinite ${delay}ms` : 'none',
      }}
    >
      {/* Shimmer sweep on hover */}
      {hovered && (
        <div style={{
          position: 'absolute', top: 0, bottom: 0, width: '60%',
          background: `linear-gradient(90deg, transparent, ${color}18, transparent)`,
          animation: 'shine-sweep 0.8s ease forwards',
          pointerEvents: 'none',
        }} />
      )}
      {/* Color dot */}
      <div style={{
        position: 'absolute', top: 8, right: 8,
        width: 5, height: 5, borderRadius: '50%',
        background: color, opacity: hovered ? 0.75 : 0,
        transition: 'opacity 0.2s',
        boxShadow: `0 0 6px ${color}`,
      }} />
      <span style={{ color, flexShrink: 0, marginTop: 2 }}>{icon}</span>
      {text}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// Emoji Reaction Picker
// ─────────────────────────────────────────────────────────────
function EmojiReactionPicker({ messageIndex, reactions, onReact, visible }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    if (visible) setTimeout(() => setMounted(true), 10);
    else setMounted(false);
  }, [visible]);

  if (!visible && !mounted) return null;

  return (
    <div style={{
      position: 'absolute',
      bottom: 'calc(100% + 8px)',
      left: 0,
      display: 'flex',
      gap: '4px',
      background: 'rgba(255,255,255,0.95)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(108,99,255,0.18)',
      borderRadius: '999px',
      padding: '6px 10px',
      boxShadow: '0 20px 60px rgba(108,99,255,0.15), 0 4px 16px rgba(0,0,0,0.08)',
      opacity: mounted && visible ? 1 : 0,
      transform: mounted && visible ? 'translateY(0) scale(1)' : 'translateY(8px) scale(0.9)',
      transition: 'opacity 0.2s ease, transform 0.25s cubic-bezier(0.34,1.56,0.64,1)',
      zIndex: 100,
      pointerEvents: visible ? 'auto' : 'none',
    }}>
      {EMOJI_REACTIONS.map((r, i) => (
        <button
          key={r.key}
          onClick={() => onReact(messageIndex, r.key)}
          title={r.label}
          style={{
            background: reactions?.[r.key] ? 'rgba(108,99,255,0.12)' : 'transparent',
            border: reactions?.[r.key] ? '1px solid rgba(108,99,255,0.3)' : '1px solid transparent',
            borderRadius: '999px', padding: '4px 6px',
            cursor: 'pointer', fontSize: '1.15rem', lineHeight: 1,
            transition: 'all 0.2s cubic-bezier(0.34,1.56,0.64,1)',
            animation: `emoji-pop 0.3s cubic-bezier(0.34,1.56,0.64,1) ${i * 35}ms both`,
            position: 'relative',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.4) translateY(-3px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1) translateY(0)'}
        >
          {r.emoji}
          {reactions?.[r.key] > 0 && (
            <span style={{
              position: 'absolute', top: -6, right: -4,
              background: 'linear-gradient(135deg, #6C63FF, #8B5CF6)',
              borderRadius: '999px', fontSize: '0.5rem',
              color: '#fff', fontWeight: 700,
              padding: '1px 4px', lineHeight: 1.4,
              fontFamily: '"DM Sans", sans-serif',
            }}>
              {reactions[r.key]}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Action Button
// ─────────────────────────────────────────────────────────────
function ActionBtn({ icon, label, isEmoji, onClick, active, title }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick} title={title}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: active
          ? 'rgba(108,99,255,0.15)'
          : hovered ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.6)',
        border: `1px solid ${active ? 'rgba(108,99,255,0.4)' : hovered ? 'rgba(108,99,255,0.25)' : 'rgba(108,99,255,0.12)'}`,
        borderRadius: '8px',
        padding: isEmoji ? '4px 7px' : '4px 8px',
        cursor: 'pointer',
        color: active ? '#6C63FF' : hovered ? '#6C63FF' : '#6B7280',
        fontSize: isEmoji ? '0.85rem' : '0.72rem',
        display: 'flex', alignItems: 'center', gap: '4px',
        transition: 'all 0.2s ease',
        transform: hovered ? 'scale(1.08) translateY(-1px)' : 'scale(1)',
        boxShadow: hovered ? '0 4px 12px rgba(108,99,255,0.15)' : 'none',
      }}
    >
      {icon}{label}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// Enhanced Chat Bubble Wrapper with reactions
// ─────────────────────────────────────────────────────────────
function EnhancedChatBubble({ message, index, onRegenerate }) {
  const [showPicker, setShowPicker]   = useState(false);
  const [reactions, setReactions]     = useState({});
  const [showCopied, setShowCopied]   = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [floatingEmoji, setFloatingEmoji] = useState(null);
  const pickerRef  = useRef(null);
  const wrapperRef = useRef(null);
  const isAssistant = message.role === 'assistant';

  const handleReact = (idx, key) => {
    const emoji = EMOJI_REACTIONS.find(r => r.key === key)?.emoji;
    setReactions(prev => ({ ...prev, [key]: (prev[key] || 0) === 0 ? 1 : 0 }));
    if (emoji) { setFloatingEmoji(emoji); setTimeout(() => setFloatingEmoji(null), 900); }
    setShowPicker(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content || '');
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 1800);
  };

  useEffect(() => {
    const handler = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target) &&
          wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowPicker(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div
      ref={wrapperRef}
      style={{ position: 'relative', marginBottom: '0.35rem' }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => { setShowActions(false); setShowPicker(false); }}
    >
      <ChatBubble message={message} onRegenerate={onRegenerate} />

      {/* Floating emoji burst */}
      {floatingEmoji && (
        <div style={{
          position: 'absolute', top: '50%',
          left: isAssistant ? '48px' : 'auto', right: isAssistant ? 'auto' : '48px',
          fontSize: '2.2rem', pointerEvents: 'none', zIndex: 200,
          animation: 'emoji-burst 0.9s ease-out forwards',
        }}>
          {floatingEmoji}
        </div>
      )}

      {/* Active reactions */}
      {Object.values(reactions).some(v => v > 0) && (
        <div style={{
          display: 'flex', gap: '4px', flexWrap: 'wrap',
          marginLeft: isAssistant ? '48px' : 'auto',
          marginRight: isAssistant ? 'auto' : '48px',
          marginTop: '4px',
        }}>
          {EMOJI_REACTIONS.filter(r => reactions[r.key] > 0).map(r => (
            <button
              key={r.key}
              onClick={() => handleReact(index, r.key)}
              style={{
                background: 'rgba(108,99,255,0.1)',
                border: '1px solid rgba(108,99,255,0.25)',
                borderRadius: '999px', padding: '2px 8px',
                fontSize: '0.78rem', cursor: 'pointer',
                color: '#374151',
                fontFamily: '"DM Sans", sans-serif',
                display: 'flex', alignItems: 'center', gap: '3px',
                transition: 'all 0.2s',
              }}
            >
              {r.emoji} <span style={{ fontSize: '0.68rem' }}>1</span>
            </button>
          ))}
        </div>
      )}

      {/* Action buttons */}
      {isAssistant && (
        <div style={{
          display: 'flex', gap: '6px', alignItems: 'center',
          marginLeft: '48px', marginTop: '6px',
          opacity: showActions ? 1 : 0,
          transform: showActions ? 'translateY(0)' : 'translateY(4px)',
          transition: 'opacity 0.2s ease, transform 0.2s ease',
        }}>
          <div style={{ position: 'relative' }} ref={pickerRef}>
            <ActionBtn
              label={showPicker ? '✕' : '😊'}
              isEmoji
              active={showPicker}
              onClick={() => setShowPicker(p => !p)}
            />
            <EmojiReactionPicker
              messageIndex={index}
              reactions={reactions}
              onReact={handleReact}
              visible={showPicker}
            />
          </div>
          <ActionBtn label={showCopied ? '✓' : null} icon={<Copy size={12} />} onClick={handleCopy} active={showCopied} title="Copy" />
          <ActionBtn icon={<ThumbsUp size={12} />} onClick={() => toast.success('Marked helpful!')} title="Helpful" />
          <ActionBtn icon={<ThumbsDown size={12} />} onClick={() => toast('Noted, thanks!')} title="Not helpful" />
          <ActionBtn icon={<RotateCcw size={12} />} onClick={() => onRegenerate?.()} title="Regenerate" />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// New-Chat Flash
// ─────────────────────────────────────────────────────────────
function NewChatFlash({ visible }) {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'linear-gradient(135deg, rgba(108,99,255,0.08), rgba(157,235,255,0.05))',
      pointerEvents: 'none', zIndex: 20,
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.6s ease',
    }}>
      {visible && (
        <div style={{
          position: 'absolute', left: '50%', top: '50%',
          width: 80, height: 80, borderRadius: '50%',
          background: 'rgba(108,99,255,0.15)',
          transform: 'translate(-50%,-50%)',
          animation: 'chat-ripple-out 0.8s ease-out forwards',
        }} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Premium Top Bar — light glass
// ─────────────────────────────────────────────────────────────
function TopBar({ activeSession, sessionId, uploads, isThinking, onSummarize, onQuiz }) {
  return (
    <div style={{
      padding: '0.78rem 1.7rem',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: 'rgba(255,255,255,0.88)',
      backdropFilter: 'blur(28px)',
      WebkitBackdropFilter: 'blur(28px)',
      borderBottom: '1px solid rgba(108,99,255,0.1)',
      position: 'relative', zIndex: 10,
      boxShadow: '0 4px 24px rgba(108,99,255,0.08)',
    }}>
      {/* Animated gradient accent line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: 'linear-gradient(90deg, #6C63FF, #9DEBFF, #C4B5FD, #EC4899, #6C63FF)',
        backgroundSize: '300% auto',
        animation: 'topbar-shimmer 5s linear infinite',
      }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        {/* Live indicator with ping */}
        <div style={{ position: 'relative', width: 10, height: 10 }}>
          <div style={{
            width: 10, height: 10, borderRadius: '50%',
            background: 'linear-gradient(135deg, #6C63FF, #9DEBFF)',
            boxShadow: '0 0 10px rgba(108,99,255,0.6)',
          }} />
          <div style={{
            position: 'absolute', inset: -3, borderRadius: '50%',
            border: '1.5px solid rgba(108,99,255,0.4)',
            animation: 'live-ping 2s ease-out infinite',
          }} />
        </div>

        <h2 style={{
          fontFamily: '"Syne", sans-serif', fontWeight: 700, fontSize: '0.93rem',
          color: '#111827', margin: 0, letterSpacing: '0.01em',
        }}>
          {activeSession?.title && activeSession.title !== 'New Chat'
            ? activeSession.title
            : `Session #${sessionId}`}
        </h2>

        {uploads.length > 0 && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(108,99,255,0.12), rgba(157,235,255,0.12))',
            border: '1px solid rgba(108,99,255,0.22)',
            borderRadius: '999px', padding: '3px 10px',
            fontSize: '0.68rem', color: '#6C63FF', fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: '0.35rem',
            fontFamily: '"Syne", sans-serif',
            boxShadow: '0 0 12px rgba(108,99,255,0.12)',
          }}>
            <FileText size={10} />
            {uploads.length} PDF{uploads.length > 1 ? 's' : ''}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <TopBarBtn label="✨ Summarize" color="#6C63FF" glow="rgba(108,99,255,0.2)" onClick={onSummarize} disabled={isThinking} />
        <TopBarBtn label="📝 Quiz Me"  color="#EC4899" glow="rgba(236,72,153,0.2)"  onClick={onQuiz}      disabled={isThinking} />
      </div>
    </div>
  );
}

function TopBarBtn({ label, color, glow, onClick, disabled }) {
  const [hov, setHov] = useState(false);
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onClick={() => { setPressed(true); setTimeout(() => setPressed(false), 200); onClick(); }}
      disabled={disabled}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        fontFamily: '"Syne", sans-serif', fontSize: '0.76rem', fontWeight: 700,
        borderRadius: '999px', padding: '0.4rem 1.1rem',
        cursor: disabled ? 'not-allowed' : 'pointer',
        border: `1.5px solid ${hov ? color : color + '40'}`,
        background: hov ? `${color}18` : `${color}0a`,
        color: hov ? color : color + 'cc',
        boxShadow: hov ? `0 0 20px ${glow}, inset 0 1px 0 rgba(255,255,255,0.6)` : 'inset 0 1px 0 rgba(255,255,255,0.5)',
        transform: pressed ? 'scale(0.94)' : hov ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
        opacity: disabled ? 0.4 : 1,
        position: 'relative', overflow: 'hidden',
      }}
    >
      {hov && (
        <div style={{
          position: 'absolute', top: 0, bottom: 0, width: '60%',
          background: `linear-gradient(90deg, transparent, ${color}20, transparent)`,
          animation: 'shine-sweep 0.7s ease forwards',
          pointerEvents: 'none',
        }} />
      )}
      {label}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────
export default function Chat() {
  const {
    activeSession, messages, setMessages, addMessage,
    isThinking, setIsThinking, mascotState, setMascotState,
    uploads, updateActiveSessionTitle,
  } = useChatStore();

  const sessionId = activeSession?.id ?? activeSession?.session_id ?? null;

  const [showUpload,      setShowUpload]      = useState(false);
  const [newChatFlash,    setNewChatFlash]    = useState(false);
  const [prevSessionId,   setPrevSessionId]   = useState(null);
  const [messagesVisible, setMessagesVisible] = useState(false);

  const hasAutoNamed = useRef(false);
  const bottomRef    = useRef(null);

  // ── Session switch flash ─────────────────────────────────
  useEffect(() => {
    if (sessionId !== null && sessionId !== prevSessionId) {
      if (prevSessionId !== null) {
        setNewChatFlash(true);
        setMessagesVisible(false);
        setTimeout(() => setNewChatFlash(false), 700);
        setTimeout(() => setMessagesVisible(true), 300);
      } else {
        setMessagesVisible(true);
      }
      setPrevSessionId(sessionId);
    }
  }, [sessionId]);

  // ── Load messages ────────────────────────────────────────
  useEffect(() => {
    if (sessionId == null) return;
    hasAutoNamed.current = false;
    getMessages(sessionId)
      .then(msgs => {
        setMessages(msgs);
        if (msgs.length > 0 && activeSession?.title && activeSession.title !== 'New Chat') {
          hasAutoNamed.current = true;
        }
      })
      .catch(() => setMessages([]));
  }, [sessionId]);

  // ── Sync uploads from backend ────────────────────────────
  useEffect(() => {
    if (sessionId == null) return;
    fetch(`/upload/files/${sessionId}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.files) && data.files.length > 0) {
          const backendUploads = data.files.map((name) => ({ name, filename: name }));
          const { uploads, setUploads } = useChatStore.getState();
          if (backendUploads.length >= uploads.length) setUploads(backendUploads);
        }
      })
      .catch(() => {});
  }, [sessionId]);

  // ── Auto scroll ──────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  // ── Auto-rename ──────────────────────────────────────────
  const maybeRenameSession = async (question) => {
    if (hasAutoNamed.current) return;
    if (!sessionId) return;
    if (activeSession?.title && activeSession.title !== 'New Chat') return;
    hasAutoNamed.current = true;
    const newTitle = makeTitleFromMessage(question);
    try {
      await renameSession(sessionId, newTitle);
      updateActiveSessionTitle(newTitle);
    } catch { /* non-fatal */ }
  };

  // ── Send ─────────────────────────────────────────────────
  const send = async (question) => {
    if (!question?.trim()) return;
    if (sessionId == null) { toast.error('Please start a new chat first.'); return; }
    addMessage({ role: 'user', content: question });
    setIsThinking(true);
    setMascotState('thinking');
    try {
      const response = await askQuestion(sessionId, question);
      addMessage({
        role: 'assistant',
        content: response.answer || '(No response)',
        sources: response.sources?.length ? response.sources : [],
      });
      if (response.suggested_title) {
        try {
          await renameSession(sessionId, response.suggested_title);
          updateActiveSessionTitle(response.suggested_title);
          hasAutoNamed.current = true;
        } catch { /* non-fatal */ }
      }
      setMascotState('happy');
    } catch (err) {
      toast.error(err?.message || 'Failed to get response');
      setMascotState('idle');
    } finally {
      setIsThinking(false);
      setTimeout(() => setMascotState('idle'), 2000);
    }
  };

  const handleSummarize = async () => {
    if (sessionId == null) { toast.error('No active session.'); return; }
    setIsThinking(true); setMascotState('reading');
    try {
      const r = await summarize(sessionId);
      addMessage({ role: 'assistant', content: r.summary || '(No summary returned)' });
      setMascotState('happy');
    } catch (err) {
      toast.error(err?.message || 'Summarize failed'); setMascotState('idle');
    } finally {
      setIsThinking(false);
      setTimeout(() => setMascotState('idle'), 2000);
    }
  };

  const handleQuiz = async () => {
    if (sessionId == null) { toast.error('No active session.'); return; }
    setIsThinking(true); setMascotState('thinking');
    try {
      const r = await generateQuiz(sessionId);
      addMessage({ role: 'assistant', content: r.quiz || '(No quiz returned)' });
      setMascotState('happy');
    } catch (err) {
      toast.error(err?.message || 'Quiz generation failed'); setMascotState('idle');
    } finally {
      setIsThinking(false);
      setTimeout(() => setMascotState('idle'), 2000);
    }
  };

  const safeMessages = Array.isArray(messages) ? messages : [];
  const isEmpty      = safeMessages.length === 0;

  // ─────────────────────────────────────────────────────────
  // NO SESSION — Welcome Screen
  // ─────────────────────────────────────────────────────────
  if (sessionId == null) {
    return (
      <div style={{
        display: 'flex', height: '100vh',
        background: 'linear-gradient(135deg, #EEF0FF 0%, #E8ECFF 45%, #F0F4FF 100%)',
        overflow: 'hidden',
      }}>
        <style>{globalStyles}</style>
        <Sidebar />
        <main style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: '2.4rem', position: 'relative', overflow: 'hidden',
        }}>
          <ChatBackground />
          <FloatingOrbs />

          {/* Mascot with rings */}
          <div style={{ position: 'relative', zIndex: 2, animation: 'welcome-fade-up 0.7s ease forwards' }}>
            {[0,1,2].map(i => (
              <div key={i} style={{
                position: 'absolute', left: '50%', top: '50%',
                width: 150, height: 150, borderRadius: '50%',
                border: '1.5px solid rgba(108,99,255,0.2)',
                animation: `welcome-ring 2.8s ease-out ${i * 0.9}s infinite`,
                pointerEvents: 'none',
              }} />
            ))}
            <div style={{
              width: 150, height: 150, borderRadius: '50%',
              background: 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.97) 0%, rgba(238,242,255,0.92) 55%, rgba(200,230,255,0.8) 100%)',
              border: '2px solid rgba(108,99,255,0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              animation: 'welcome-pulse 4s ease-in-out infinite, welcome-float 6s ease-in-out infinite',
              position: 'relative', zIndex: 2,
              boxShadow: '0 20px 60px rgba(108,99,255,0.15), inset 0 2px 0 rgba(255,255,255,0.8)',
            }}>
              <WarpsMascot state="idle" size={115} />
            </div>
          </div>

          {/* Heading */}
          <div style={{ textAlign: 'center', zIndex: 2, animation: 'welcome-fade-up 0.7s ease 0.2s both' }}>
            <h2 style={{
              fontFamily: '"Syne", sans-serif', fontSize: '2.4rem', fontWeight: 800,
              color: '#0F0F1A', marginBottom: '0.6rem', letterSpacing: '-0.03em',
            }}>
              Welcome to{' '}
              <span style={{
                background: 'linear-gradient(135deg, #6C63FF 0%, #9DEBFF 40%, #C4B5FD 70%, #EC4899 100%)',
                backgroundSize: '200% auto',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                animation: 'welcome-shimmer 5s linear infinite',
              }}>WARPS</span>
            </h2>
            <p style={{
              color: '#4B5563', fontSize: '0.92rem',
              fontFamily: '"DM Sans", sans-serif', lineHeight: 1.7,
              maxWidth: 340, margin: '0 auto',
            }}>
              Click{' '}
              <strong style={{
                color: '#6C63FF',
                background: 'rgba(108,99,255,0.1)',
                padding: '2px 9px', borderRadius: '6px',
                border: '1px solid rgba(108,99,255,0.22)',
              }}>+ New Chat</strong>
              {' '}in the sidebar to begin.
            </p>
          </div>

          {/* Feature tags */}
          <div style={{
            display: 'flex', gap: '0.55rem', flexWrap: 'wrap', justifyContent: 'center',
            maxWidth: 500, position: 'relative', zIndex: 2,
            animation: 'welcome-fade-up 0.7s ease 0.35s both',
          }}>
            {['📄 PDF Chat','🔍 Smart Search','📝 Quiz Gen','✨ AI Summary','🃏 Flashcards','🗒️ Notes'].map((tag, i) => (
              <div key={tag} style={{
                background: 'rgba(255,255,255,0.8)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(108,99,255,0.14)',
                borderRadius: '999px', padding: '0.34rem 0.9rem',
                fontFamily: '"DM Sans", sans-serif', fontSize: '0.75rem', fontWeight: 600,
                color: '#374151',
                boxShadow: '0 2px 10px rgba(108,99,255,0.07)',
                animation: `tag-float ${3 + i * 0.3}s ease-in-out ${i * 0.2}s infinite`,
              }}>
                {tag}
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────
  // FULL CHAT UI
  // ─────────────────────────────────────────────────────────
  return (
    <div style={{
      display: 'flex', height: '100vh',
      background: 'linear-gradient(135deg, #EEF0FF 0%, #E8ECFF 50%, #F0F4FF 100%)',
      overflow: 'hidden',
    }}>
      <style>{globalStyles}</style>

      <Sidebar />

      <main style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        overflow: 'hidden', position: 'relative',
      }}>
        <ChatBackground />
        <FloatingOrbs />
        <NewChatFlash visible={newChatFlash} />

        {/* ── TOP BAR ────────────────────────────────────── */}
        <TopBar
          activeSession={activeSession}
          sessionId={sessionId}
          uploads={uploads}
          isThinking={isThinking}
          onSummarize={handleSummarize}
          onQuiz={handleQuiz}
        />

        {/* ── MESSAGES ───────────────────────────────────── */}
        <div
          className="chat-scroll"
          style={{
            flex: 1, overflowY: 'auto',
            padding: '1.8rem 2.2rem',
            position: 'relative', zIndex: 1,
            opacity:    messagesVisible ? 1 : 0,
            transform:  messagesVisible ? 'translateY(0)' : 'translateY(16px)',
            transition: 'opacity 0.45s ease, transform 0.45s ease',
          }}
        >
          {isEmpty ? (
            <div style={{
              height: '100%', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: '2.2rem',
            }}>
              {/* Mascot */}
              <div style={{ animation: 'empty-fade-up 0.6s ease forwards' }}>
                <div style={{
                  position: 'relative',
                  width: 130, height: 130, borderRadius: '50%',
                  background: 'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.97) 0%, rgba(238,242,255,0.92) 55%, rgba(200,230,255,0.8) 100%)',
                  border: '2px solid rgba(108,99,255,0.18)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 16px 50px rgba(108,99,255,0.15), 0 4px 16px rgba(108,99,255,0.08), inset 0 2px 0 rgba(255,255,255,0.9)',
                  animation: 'empty-float 5s ease-in-out infinite, welcome-pulse 4s ease-in-out infinite',
                }}>
                  {[0,1].map(i => (
                    <div key={i} style={{
                      position: 'absolute', left: '50%', top: '50%',
                      width: 140, height: 140, borderRadius: '50%',
                      border: '1px solid rgba(108,99,255,0.18)',
                      animation: `mascot-glow-ring 2.5s ease-out ${i * 1.25}s infinite`,
                      pointerEvents: 'none',
                    }} />
                  ))}
                  <WarpsMascot state={mascotState} size={100} />
                </div>
              </div>

              {/* Heading */}
              <div style={{ textAlign: 'center', animation: 'empty-fade-up 0.6s ease 0.1s both' }}>
                <h2 style={{
                  fontFamily: '"Syne", sans-serif', fontSize: '1.8rem', fontWeight: 800,
                  color: '#111827', marginBottom: '0.5rem', letterSpacing: '-0.02em',
                }}>
                  Hey there 👋{' '}
                  <span style={{
                    background: 'linear-gradient(135deg, #6C63FF, #9DEBFF, #C4B5FD)',
                    backgroundSize: '200% auto',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    animation: 'welcome-shimmer 4s linear infinite',
                  }}>
                    What's on your mind?
                  </span>
                </h2>
                <p style={{
                  color: '#4B5563', fontSize: '0.87rem',
                  fontFamily: '"DM Sans", sans-serif', maxWidth: 420, lineHeight: 1.7,
                }}>
                  Ask me anything — or upload a PDF to analyse, summarise, or quiz yourself on it.
                </p>
              </div>

              {/* Suggestion chips */}
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.7rem', maxWidth: 640, width: '100%',
                animation: 'empty-fade-up 0.6s ease 0.15s both',
              }}>
                {suggestions.map((s, i) => (
                  <SuggestionChip
                    key={s.text}
                    icon={s.icon} text={s.text} color={s.color} glow={s.glow}
                    delay={200 + i * 65}
                    onClick={() => send(s.text)}
                  />
                ))}
              </div>

              {/* Attach PDF pill */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.55rem',
                background: 'rgba(255,255,255,0.78)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(108,99,255,0.13)',
                borderRadius: '999px', padding: '0.45rem 1.2rem',
                animation: 'empty-fade-up 0.6s ease 0.6s both',
                boxShadow: '0 4px 16px rgba(108,99,255,0.07)',
              }}>
                <span style={{ fontSize: '0.95rem' }}>📎</span>
                <span style={{ fontSize: '0.77rem', color: '#6B7280', fontFamily: '"DM Sans", sans-serif' }}>
                  You can also{' '}
                  <span
                    onClick={() => setShowUpload(true)}
                    style={{
                      color: '#6C63FF', cursor: 'pointer', fontWeight: 600,
                      borderBottom: '1px dashed rgba(108,99,255,0.45)',
                      transition: 'color 0.2s',
                    }}
                  >
                    attach a PDF
                  </span>
                  {' '}for document-specific answers.
                </span>
              </div>
            </div>
          ) : (
            <>
              {safeMessages.map((m, i) => (
                <div key={i} style={{
                  animation: `msg-slide-in 0.45s cubic-bezier(0.34,1.56,0.64,1) ${Math.min(i * 40, 200)}ms both`,
                }}>
                  <EnhancedChatBubble
                    message={m}
                    index={i}
                    onRegenerate={() => {}}
                  />
                </div>
              ))}
              {isThinking && <TypingIndicator />}
              <div ref={bottomRef} />
            </>
          )}
        </div>

        {/* ── INPUT BAR ──────────────────────────────────── */}
        <div style={{ position: 'relative', zIndex: 10 }}>
          <ChatInput
            onSend={send}
            onUploadClick={() => setShowUpload(true)}
            disabled={isThinking}
          />
        </div>
      </main>

      {showUpload && (
        <UploadZone sessionId={sessionId} onClose={() => setShowUpload(false)} />
      )}
    </div>
  );
}