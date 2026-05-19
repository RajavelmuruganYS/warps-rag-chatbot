import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Plus, Search, MessageSquare, Settings, User, BookOpen,
  ChevronLeft, ChevronRight, Trash2, Edit2, Check, X, Zap,
  Sparkles, HelpCircle, FileText, RotateCcw, File,
} from 'lucide-react';

import useChatStore from '../../store/chatStore';
import { getSessions, createSession, deleteSession, renameSession, summarize, generateQuiz, generateFlashcards, generateNotes } from '../../services/api';
import toast from 'react-hot-toast';

// ── Feature config ─────────────────────────────────────────────────────────
const FEATURES = [
  {
    id: 'summarize', label: 'Summary', emoji: '✨',
    gradient: 'linear-gradient(135deg, #6C63FF 0%, #A78BFA 50%, #9DEBFF 100%)',
    glow: 'rgba(108,99,255,0.45)', glow2: 'rgba(108,99,255,0.1)',
    bg: 'linear-gradient(135deg, rgba(108,99,255,0.11) 0%, rgba(157,235,255,0.07) 100%)',
    desc: 'AI document overview', tag: 'Smart', tagColor: '#6C63FF',
    orb1: 'rgba(108,99,255,0.12)', orb2: 'rgba(157,235,255,0.1)',
  },
  {
    id: 'quiz', label: 'Quiz Me', emoji: '📝',
    gradient: 'linear-gradient(135deg, #EC4899 0%, #F472B6 50%, #F59E0B 100%)',
    glow: 'rgba(236,72,153,0.45)', glow2: 'rgba(236,72,153,0.1)',
    bg: 'linear-gradient(135deg, rgba(236,72,153,0.09) 0%, rgba(245,158,11,0.06) 100%)',
    desc: 'Knowledge testing', tag: 'Interactive', tagColor: '#EC4899',
    orb1: 'rgba(236,72,153,0.12)', orb2: 'rgba(245,158,11,0.1)',
  },
  {
    id: 'flashcards', label: 'Flashcards', emoji: '🃏',
    gradient: 'linear-gradient(135deg, #10B981 0%, #34D399 50%, #3B82F6 100%)',
    glow: 'rgba(16,185,129,0.45)', glow2: 'rgba(16,185,129,0.1)',
    bg: 'linear-gradient(135deg, rgba(16,185,129,0.09) 0%, rgba(59,130,246,0.06) 100%)',
    desc: 'Flip key concepts', tag: 'Memory', tagColor: '#10B981',
    orb1: 'rgba(16,185,129,0.12)', orb2: 'rgba(59,130,246,0.1)',
  },
  {
    id: 'notes', label: 'Notes', emoji: '🗒️',
    gradient: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 50%, #EF4444 100%)',
    glow: 'rgba(245,158,11,0.45)', glow2: 'rgba(245,158,11,0.1)',
    bg: 'linear-gradient(135deg, rgba(245,158,11,0.09) 0%, rgba(239,68,68,0.06) 100%)',
    desc: 'Structured notes', tag: 'Organized', tagColor: '#F59E0B',
    orb1: 'rgba(245,158,11,0.12)', orb2: 'rgba(239,68,68,0.1)',
  },
];

// ── Shared Styles ──────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap');

  @keyframes panel-sweep-in {
    0%   { opacity: 0; transform: translateX(60px) scale(0.95); }
    100% { opacity: 1; transform: translateX(0) scale(1); }
  }
  @keyframes panel-sweep-out {
    0%   { opacity: 1; transform: translateX(0) scale(1); }
    100% { opacity: 0; transform: translateX(60px) scale(0.96); }
  }
  @keyframes spin-loader { to { transform: rotate(360deg); } }
  @keyframes card-rise {
    0%   { opacity: 0; transform: translateY(18px) scale(0.94); }
    100% { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes tag-pop {
    0%   { transform: scale(0.5) rotate(-8deg); opacity: 0; }
    65%  { transform: scale(1.08) rotate(1deg); }
    100% { transform: scale(1) rotate(0deg); opacity: 1; }
  }
  @keyframes glow-pulse {
    0%,100% { opacity: 0.5; transform: scale(1); }
    50%      { opacity: 1;   transform: scale(1.06); }
  }
  @keyframes orb-drift {
    0%   { transform: translate(0,0) scale(1); }
    33%  { transform: translate(6px,-5px) scale(1.03); }
    66%  { transform: translate(-4px,3px) scale(0.98); }
    100% { transform: translate(0,0) scale(1); }
  }
  @keyframes new-chat-slide {
    from { opacity: 0; transform: translateX(-24px) scale(0.9); }
    to   { opacity: 1; transform: translateX(0) scale(1); }
  }
  @keyframes new-btn-breathe {
    0%,100% { box-shadow: 0 4px 20px rgba(108,99,255,0.38), 0 0 0 0 rgba(108,99,255,0.15); }
    50%      { box-shadow: 0 6px 32px rgba(108,99,255,0.55), 0 0 0 6px rgba(108,99,255,0.06); }
  }
  @keyframes sidebar-ripple {
    to { transform: translate(-50%,-50%) scale(28); opacity: 0; }
  }
  @keyframes shimmer-sweep {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
  @keyframes float-badge {
    0%,100% { transform: translateY(0); }
    50%      { transform: translateY(-2px); }
  }
  @keyframes correct-flash {
    0%   { box-shadow: 0 0 0 0 rgba(16,185,129,0.55); }
    50%  { box-shadow: 0 0 0 7px rgba(16,185,129,0); }
    100% { box-shadow: 0 0 0 0 rgba(16,185,129,0); }
  }
  @keyframes wrong-shake {
    0%,100% { transform: translateX(0); }
    20%     { transform: translateX(-4px); }
    40%     { transform: translateX(4px); }
    60%     { transform: translateX(-3px); }
    80%     { transform: translateX(3px); }
  }
  @keyframes card-flip-hint {
    0%,100% { transform: rotateY(0deg); }
    50%     { transform: rotateY(7deg); }
  }

  .flashcard-scene   { perspective: 1200px; }
  .flashcard-inner {
    position: relative; width: 100%; height: 180px;
    transform-style: preserve-3d;
    transition: transform 0.65s cubic-bezier(0.4,0,0.2,1);
    cursor: pointer;
  }
  .flashcard-inner.flipped { transform: rotateY(180deg); }
  .flashcard-face {
    position: absolute; inset: 0;
    backface-visibility: hidden; -webkit-backface-visibility: hidden;
    border-radius: 20px;
    display: flex; align-items: center; justify-content: center;
    padding: 1.5rem; text-align: center;
    transition: box-shadow 0.3s ease;
  }
  .flashcard-back { transform: rotateY(180deg); }

  .panel-overlay { animation: panel-sweep-in 0.42s cubic-bezier(0.34,1.56,0.64,1) forwards; }
  .panel-closing  { animation: panel-sweep-out 0.3s cubic-bezier(0.4,0,1,1) forwards; }

  .quiz-opt {
    transition: all 0.25s cubic-bezier(0.34,1.56,0.64,1);
    cursor: pointer; border-radius: 14px;
    padding: 0.7rem 1rem;
    border: 1.5px solid rgba(108,99,255,0.12);
    background: rgba(255,255,255,0.65);
    font-family: 'DM Sans', sans-serif;
    font-size: 0.83rem; color: #374151; text-align: left;
    backdrop-filter: blur(8px); width: 100%;
  }
  .quiz-opt:hover:not(:disabled) {
    background: rgba(108,99,255,0.07); border-color: rgba(108,99,255,0.28);
    transform: translateX(5px); box-shadow: 4px 0 16px rgba(108,99,255,0.1);
  }
  .quiz-opt.correct {
    background: rgba(16,185,129,0.1); border-color: #10B981; color: #065F46;
    animation: correct-flash 0.6s ease forwards;
  }
  .quiz-opt.wrong {
    background: rgba(239,68,68,0.08); border-color: #EF4444; color: #7F1D1D;
    animation: wrong-shake 0.4s ease forwards;
  }

  .pdf-row-sb {
    display: flex; align-items: center; gap: 0.75rem;
    padding: 0.8rem 1rem; border-radius: 14px;
    border: 1.5px solid rgba(108,99,255,0.1);
    background: rgba(255,255,255,0.55);
    cursor: pointer; backdrop-filter: blur(12px);
    transition: all 0.28s cubic-bezier(0.34,1.56,0.64,1);
    font-family: 'DM Sans', sans-serif;
    position: relative; overflow: hidden;
  }
  .pdf-row-sb::after {
    content: ''; position: absolute; left: 0; top: 0; bottom: 0;
    width: 3px; border-radius: 0 3px 3px 0;
    background: linear-gradient(180deg, #6C63FF, #9DEBFF);
    transform: scaleY(0); transition: transform 0.25s ease;
    transform-origin: bottom;
  }
  .pdf-row-sb:hover {
    border-color: rgba(108,99,255,0.28);
    background: rgba(108,99,255,0.05);
    transform: translateX(4px);
    box-shadow: 0 5px 20px rgba(108,99,255,0.1);
  }
  .pdf-row-sb:hover::after { transform: scaleY(1); }

  .tool-pill-sb {
    transition: all 0.25s cubic-bezier(0.34,1.56,0.64,1);
    cursor: pointer; position: relative; overflow: hidden;
  }
  .tool-pill-sb:hover  { transform: translateX(4px); }
  .tool-pill-sb:active { transform: translateX(2px) scale(0.98); }

  .sb-scroll::-webkit-scrollbar { width: 3px; }
  .sb-scroll::-webkit-scrollbar-track { background: transparent; }
  .sb-scroll::-webkit-scrollbar-thumb { background: rgba(108,99,255,0.18); border-radius: 99px; }
  .sb-scroll::-webkit-scrollbar-thumb:hover { background: rgba(108,99,255,0.38); }
`;

// ── Loader ─────────────────────────────────────────────────────────────────
function Loader({ color = '#6C63FF', size = 36 }) {
  return (
    <div style={{
      width: size, height: size,
      border: `3px solid ${color}15`,
      borderTop: `3px solid ${color}`,
      borderRight: `3px solid ${color}55`,
      borderRadius: '50%',
      animation: 'spin-loader 0.75s linear infinite',
      margin: '0 auto',
    }} />
  );
}

// ── Ambient orbs ───────────────────────────────────────────────────────────
function AmbientOrbs({ orb1, orb2 }) {
  return (
    <>
      <div style={{
        position: 'absolute', width: 100, height: 100, borderRadius: '50%',
        background: `radial-gradient(circle, ${orb1} 0%, transparent 70%)`,
        top: -15, right: -15, pointerEvents: 'none',
        animation: 'orb-drift 6s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', width: 70, height: 70, borderRadius: '50%',
        background: `radial-gradient(circle, ${orb2} 0%, transparent 70%)`,
        bottom: 8, left: -8, pointerEvents: 'none',
        animation: 'orb-drift 8s ease-in-out infinite reverse',
      }} />
    </>
  );
}

// ── Summary Panel ──────────────────────────────────────────────────────────
function SummaryPanel({ data }) {
  const text = data?.summary || '';
  const paragraphs = text.split('\n').filter(Boolean);
  return (
    <div style={{ fontFamily: 'DM Sans', fontSize: '0.85rem', color: '#1F2937', lineHeight: 1.8 }}>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
        background: 'linear-gradient(135deg,rgba(108,99,255,0.14),rgba(157,235,255,0.1))',
        border: '1px solid rgba(108,99,255,0.22)', borderRadius: 999,
        padding: '5px 14px', fontSize: '0.72rem', fontWeight: 700, color: '#6C63FF',
        fontFamily: 'Syne', marginBottom: '1.2rem',
        animation: 'tag-pop 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards',
        boxShadow: '0 2px 12px rgba(108,99,255,0.15)',
      }}>✨ AI Summary</div>
      {paragraphs.map((p, i) => (
        <p key={i} style={{ marginBottom: '0.8rem', animation: `card-rise 0.4s ease ${i * 0.07}s both` }}>
          {p.startsWith('**') || p.startsWith('#') || p.match(/^[A-Z][^a-z]{2,}/)
            ? <strong style={{
                color: '#111827', display: 'block', marginBottom: '0.2rem',
                fontFamily: 'Syne', fontWeight: 700, fontSize: '0.9rem',
                borderLeft: '3px solid #6C63FF', paddingLeft: '0.75rem',
              }}>{p.replace(/[#*]/g,'').trim()}</strong>
            : p.replace(/[*#]/g,'').trim()}
        </p>
      ))}
    </div>
  );
}

// ── Notes Panel ────────────────────────────────────────────────────────────
function NotesPanel({ data }) {
  const text = data?.notes || '';
  const lines = text.split('\n').filter(Boolean);
  return (
    <div style={{ fontFamily: 'DM Sans', fontSize: '0.85rem', color: '#1F2937' }}>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
        background: 'linear-gradient(135deg,rgba(245,158,11,0.14),rgba(239,68,68,0.08))',
        border: '1px solid rgba(245,158,11,0.28)', borderRadius: 999,
        padding: '5px 14px', fontSize: '0.72rem', fontWeight: 700, color: '#F59E0B',
        fontFamily: 'Syne', marginBottom: '1.2rem',
        animation: 'tag-pop 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards',
        boxShadow: '0 2px 12px rgba(245,158,11,0.18)',
      }}>🗒️ Smart Notes</div>
      {lines.map((line, i) => {
        const isBullet = /^[-•*]/.test(line);
        const isHeader = line.startsWith('#') || (line.match(/^[A-Z]/) && line.length < 60 && !line.includes(' the '));
        const clean = line.replace(/^[-•*#]+\s*/,'').trim();
        return (
          <div key={i} style={{
            animation: `card-rise 0.4s ease ${i * 0.055}s both`,
            marginBottom: isHeader ? '0.7rem' : '0.38rem',
            display: 'flex', gap: '0.55rem', alignItems: 'flex-start',
          }}>
            {isBullet && (
              <span style={{
                color: '#F59E0B', fontSize: '0.6rem', flexShrink: 0, marginTop: '0.42rem',
                background: 'rgba(245,158,11,0.14)', borderRadius: '50%',
                width: 17, height: 17, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>◆</span>
            )}
            <span style={{
              fontWeight: isHeader ? 700 : 400,
              color: isHeader ? '#111827' : '#374151',
              fontSize: isHeader ? '0.88rem' : '0.83rem',
              lineHeight: 1.65,
              fontFamily: isHeader ? 'Syne' : 'DM Sans',
            }}>{clean}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Quiz Panel ─────────────────────────────────────────────────────────────
function parseQuizText(raw) {
  const questions = [];
  const blocks = raw.split(/\n(?=\d+[\.\)])/);
  blocks.forEach(block => {
    const lines = block.trim().split('\n').filter(Boolean);
    if (!lines.length) return;
    const qLine = lines[0].replace(/^\d+[\.\)]\s*/, '').trim();
    const options = []; let answer = '';
    lines.slice(1).forEach(l => {
      const optMatch = l.match(/^([A-D])[\.\)]\s*(.+)/i);
      if (optMatch) options.push({ key: optMatch[1].toUpperCase(), text: optMatch[2].trim() });
      const ansMatch = l.match(/answer[:\s]+([A-D])/i);
      if (ansMatch) answer = ansMatch[1].toUpperCase();
    });
    if (qLine && options.length >= 2) questions.push({ q: qLine, options, answer });
  });
  return questions;
}

function QuizPanel({ data }) {
  const raw = data?.quiz || '';
  const questions = parseQuizText(raw);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState({});
  if (!questions.length) return (
    <div style={{ fontFamily: 'DM Sans', fontSize: '0.84rem', color: '#374151', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>{raw}</div>
  );
  const q = questions[idx]; const sel = selected[idx];
  const pct = ((idx + 1) / questions.length) * 100;
  return (
    <div>
      <div style={{ marginBottom: '1.2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
          <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '0.68rem', color: '#9CA3AF', letterSpacing: '0.08em' }}>
            Q {idx + 1} / {questions.length}
          </span>
          <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '0.72rem', color: '#EC4899', background: 'rgba(236,72,153,0.1)', borderRadius: 999, padding: '2px 8px' }}>
            {Math.round(pct)}%
          </span>
        </div>
        <div style={{ height: 4, background: 'rgba(108,99,255,0.1)', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: 99, width: `${pct}%`, background: 'linear-gradient(90deg, #EC4899, #F59E0B)', transition: 'width 0.5s cubic-bezier(0.34,1.56,0.64,1)', boxShadow: '0 0 8px rgba(236,72,153,0.35)' }} />
        </div>
      </div>
      <div key={idx} style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '0.9rem', color: '#111827', marginBottom: '1rem', lineHeight: 1.55, animation: 'card-rise 0.35s ease forwards', background: 'linear-gradient(135deg, rgba(236,72,153,0.05), rgba(245,158,11,0.03))', borderRadius: 14, padding: '0.8rem 0.95rem', border: '1px solid rgba(236,72,153,0.1)' }}>{q.q}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.48rem', marginBottom: '1rem' }}>
        {q.options.map((o, oi) => {
          let cls = 'quiz-opt';
          if (sel) { if (o.key === q.answer) cls += ' correct'; else if (o.key === sel && sel !== q.answer) cls += ' wrong'; }
          return (
            <button key={o.key} className={cls} disabled={!!sel} onClick={() => setSelected(prev => ({ ...prev, [idx]: o.key }))} style={{ opacity: sel && o.key !== q.answer && o.key !== sel ? 0.35 : 1, animation: `card-rise 0.35s ease ${oi * 0.07}s both` }}>
              <span style={{ fontWeight: 800, marginRight: '0.55rem', color: '#6C63FF', background: 'rgba(108,99,255,0.1)', borderRadius: 6, padding: '1px 6px', fontSize: '0.73rem' }}>{o.key}</span>
              {o.text}
            </button>
          );
        })}
      </div>
      {sel && (
        <div style={{ padding: '0.65rem 0.95rem', borderRadius: 13, marginBottom: '0.8rem', background: sel === q.answer ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.08)', border: `1.5px solid ${sel === q.answer ? '#10B981' : '#EF4444'}`, fontFamily: 'DM Sans', fontSize: '0.8rem', color: sel === q.answer ? '#065F46' : '#7F1D1D', animation: 'tag-pop 0.3s ease forwards', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <span style={{ fontSize: '1rem' }}>{sel === q.answer ? '🎉' : '❌'}</span>
          {sel === q.answer ? 'Correct!' : `Answer: ${q.answer}`}
        </div>
      )}
      <div style={{ display: 'flex', gap: '0.55rem' }}>
        {[{ label: 'Prev', dir: -1, disabled: idx === 0 }, { label: 'Next', dir: 1, disabled: idx === questions.length - 1 }].map(({ label, dir, disabled }) => (
          <button key={label} onClick={() => setIdx(i => i + dir)} disabled={disabled} style={{ flex: 1, padding: '0.55rem', borderRadius: 13, border: '1.5px solid rgba(236,72,153,0.2)', background: dir === 1 ? 'linear-gradient(135deg,rgba(236,72,153,0.08),rgba(245,158,11,0.06))' : 'rgba(236,72,153,0.04)', cursor: disabled ? 'not-allowed' : 'pointer', color: '#EC4899', fontFamily: 'Syne', fontWeight: 700, fontSize: '0.76rem', opacity: disabled ? 0.35 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', transition: 'all 0.22s' }}>
            {dir === -1 && <ChevronLeft size={13} />}{label}{dir === 1 && <ChevronRight size={13} />}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Flashcard Panel ────────────────────────────────────────────────────────
function FlashcardsPanel({ data }) {
  const cards = Array.isArray(data?.flashcards) ? data.flashcards : [];
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [hintShown, setHintShown] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setHintShown(true), 1200);
    return () => clearTimeout(t);
  }, [idx]);

  const go = (delta) => {
    setFlipped(false); setHintShown(false);
    setTimeout(() => setIdx(i => Math.min(Math.max(0, i + delta), cards.length - 1)), 130);
  };

  if (!cards.length) return <div style={{ fontFamily: 'DM Sans', fontSize: '0.84rem', color: '#374151', textAlign: 'center', paddingTop: '2rem' }}>No flashcards generated.</div>;

  const card = cards[idx];
  const front = card?.front || card?.question || card?.term || 'Front';
  const back  = card?.back  || card?.answer  || card?.definition || 'Back';

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '0.8rem' }}>
        <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '0.68rem', color: '#9CA3AF', letterSpacing: '0.1em' }}>
          CARD {idx + 1} / {cards.length}
        </span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginBottom: '1.1rem', flexWrap: 'wrap' }}>
        {cards.map((_, i) => (
          <div key={i} onClick={() => { setFlipped(false); setIdx(i); }} style={{
            width: i === idx ? 22 : 6, height: 6, borderRadius: 99,
            background: i === idx ? 'linear-gradient(90deg,#10B981,#3B82F6)' : i < idx ? 'rgba(16,185,129,0.38)' : 'rgba(16,185,129,0.14)',
            cursor: 'pointer', transition: 'all 0.38s cubic-bezier(0.34,1.56,0.64,1)',
            boxShadow: i === idx ? '0 0 8px rgba(16,185,129,0.45)' : 'none',
          }} />
        ))}
      </div>

      <div className="flashcard-scene" style={{ marginBottom: '0.65rem' }}>
        <div className={`flashcard-inner${flipped ? ' flipped' : ''}`}
          onClick={() => setFlipped(f => !f)}
          style={{ animation: hintShown && !flipped ? 'card-flip-hint 0.8s ease 0.2s' : 'none' }}
        >
          <div className="flashcard-face" style={{
            background: 'linear-gradient(135deg, rgba(16,185,129,0.11), rgba(59,130,246,0.07))',
            border: '2px solid rgba(16,185,129,0.18)',
            boxShadow: '0 8px 32px rgba(16,185,129,0.1), inset 0 1px 0 rgba(255,255,255,0.65)',
          }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: 20, background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.22) 50%, transparent 60%)', backgroundSize: '200% 100%', animation: 'shimmer-sweep 3.5s ease-in-out infinite', pointerEvents: 'none' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: '0.6rem', fontFamily: 'Syne', fontWeight: 800, letterSpacing: '0.14em', color: '#10B981', marginBottom: '0.7rem', textAlign: 'center', background: 'rgba(16,185,129,0.12)', borderRadius: 999, padding: '3px 12px', display: 'inline-block' }}>TERM</div>
              <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '1rem', color: '#111827', textAlign: 'center', lineHeight: 1.5 }}>{front}</div>
            </div>
          </div>
          <div className="flashcard-face flashcard-back" style={{
            background: 'linear-gradient(135deg, rgba(59,130,246,0.11), rgba(16,185,129,0.07))',
            border: '2px solid rgba(59,130,246,0.18)',
            boxShadow: '0 8px 32px rgba(59,130,246,0.1), inset 0 1px 0 rgba(255,255,255,0.65)',
          }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: 20, background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.18) 50%, transparent 60%)', backgroundSize: '200% 100%', animation: 'shimmer-sweep 3.5s ease-in-out infinite 1.75s', pointerEvents: 'none' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: '0.6rem', fontFamily: 'Syne', fontWeight: 800, letterSpacing: '0.14em', color: '#3B82F6', marginBottom: '0.7rem', textAlign: 'center', background: 'rgba(59,130,246,0.12)', borderRadius: 999, padding: '3px 12px', display: 'inline-block' }}>DEFINITION</div>
              <div style={{ fontFamily: 'DM Sans', fontSize: '0.86rem', color: '#1F2937', textAlign: 'center', lineHeight: 1.65 }}>{back}</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', fontSize: '0.7rem', color: '#9CA3AF', fontFamily: 'DM Sans', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', opacity: hintShown && !flipped ? 0.75 : 0, transition: 'opacity 0.4s ease' }}>
        <RotateCcw size={10} style={{ animation: 'spin-loader 4s linear infinite' }} /> Tap to flip
      </div>

      <div style={{ display: 'flex', gap: '0.55rem' }}>
        {[{ label: 'Prev', dir: -1, disabled: idx === 0, color: '#10B981', bc: 'rgba(16,185,129,0.22)' }, { label: 'Next', dir: 1, disabled: idx === cards.length - 1, color: '#3B82F6', bc: 'rgba(59,130,246,0.22)' }].map(({ label, dir, disabled, color, bc }) => (
          <button key={label} onClick={() => go(dir)} disabled={disabled} style={{ flex: 1, padding: '0.55rem', borderRadius: 13, border: `1.5px solid ${bc}`, background: dir === 1 ? 'linear-gradient(135deg,rgba(16,185,129,0.07),rgba(59,130,246,0.07))' : 'rgba(16,185,129,0.04)', cursor: disabled ? 'not-allowed' : 'pointer', color, fontFamily: 'Syne', fontWeight: 700, fontSize: '0.75rem', opacity: disabled ? 0.35 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', transition: 'all 0.22s' }}>
            {dir === -1 && <ChevronLeft size={13} />}{label}{dir === 1 && <ChevronRight size={13} />}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── PDF Picker inside Panel ────────────────────────────────────────────────
function PDFPickerInPanel({ feature, uploads, onSelect }) {
  const pdfs = (uploads || []).map(f => ({
    filename: f.name || f.filename || String(f),
    display_name: f.name || f.filename || String(f),
  }));

  if (pdfs.length === 0) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2.5rem 1.5rem', textAlign: 'center' }}>
      <div style={{ width: 68, height: 68, borderRadius: 18, marginBottom: '1.1rem', background: 'linear-gradient(135deg,rgba(239,68,68,0.1),rgba(245,158,11,0.07))', border: '1.5px solid rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.9rem', animation: 'card-rise 0.4s ease forwards' }}>📄</div>
      <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '0.98rem', color: '#111827', marginBottom: '0.55rem', animation: 'card-rise 0.4s ease 0.08s both' }}>No PDFs uploaded yet</div>
      <div style={{ fontFamily: 'DM Sans', fontSize: '0.79rem', color: '#6B7280', lineHeight: 1.65, maxWidth: 240, animation: 'card-rise 0.4s ease 0.16s both' }}>
        Use the 📎 button in the chat input to upload a PDF first.
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '0.68rem', letterSpacing: '0.1em', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: '0.8rem' }}>Choose a document</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {pdfs.map((pdf, i) => (
          <div key={pdf.filename} className="pdf-row-sb" onClick={() => onSelect(pdf)} style={{ animation: `card-rise 0.35s ease ${i * 0.07}s both` }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, flexShrink: 0, background: `linear-gradient(135deg, ${feature.tagColor}20, ${feature.tagColor}0a)`, border: `1.5px solid ${feature.tagColor}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: feature.tagColor, boxShadow: `0 4px 12px ${feature.tagColor}15` }}>
              <File size={16} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '0.82rem', color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pdf.display_name}</div>
              <div style={{ fontFamily: 'DM Sans', fontSize: '0.69rem', color: '#9CA3AF', marginTop: '0.1rem' }}>PDF document</div>
            </div>
            <div style={{ width: 26, height: 26, borderRadius: 7, flexShrink: 0, background: `${feature.tagColor}12`, border: `1px solid ${feature.tagColor}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: feature.tagColor, fontSize: '0.75rem', fontWeight: 700 }}>→</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Side Panel (for Sidebar tools) ────────────────────────────────────────
function SidePanel({ feature, sessionId, uploads, onClose }) {
  const [step, setStep] = useState('pick');
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [data, setData] = useState(null);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const pdfs = (uploads || []).map(f => ({ filename: f.name || f.filename || String(f), display_name: f.name || f.filename || String(f) }));
    if (pdfs.length === 1) handlePdfSelect(pdfs[0]);
  }, []);

  const handlePdfSelect = (pdf) => {
    setSelectedPdf(pdf); setStep('loading');
    const fn = pdf.filename || null;
    const apiMap = {
      summarize: () => summarize(sessionId, fn),
      quiz: () => generateQuiz(sessionId, fn),
      flashcards: () => generateFlashcards(sessionId, fn),
      notes: () => generateNotes(sessionId, fn),
    };
    apiMap[feature.id]?.()
      .then(d => { setData(d); setStep('result'); })
      .catch(err => { toast.error(err?.message || `${feature.label} failed`); handleClose(); });
  };

  const handleClose = () => { setClosing(true); setTimeout(onClose, 300); };
  const handleBack  = () => { setStep('pick'); setSelectedPdf(null); setData(null); };

  const renderContent = () => {
    if (step === 'pick') return <PDFPickerInPanel feature={feature} uploads={uploads} onSelect={handlePdfSelect} />;
    if (step === 'loading') return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.2rem', paddingTop: '3.5rem' }}>
        <div style={{ position: 'relative' }}>
          <Loader color={feature.tagColor} size={42} />
          <div style={{ position: 'absolute', inset: -8, borderRadius: '50%', border: `2px solid ${feature.tagColor}18`, animation: 'glow-pulse 1.5s ease-in-out infinite' }} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '0.9rem', color: '#111827', marginBottom: '0.3rem' }}>Generating {feature.label}…</div>
          <div style={{ fontFamily: 'DM Sans', fontSize: '0.76rem', color: '#9CA3AF' }}>AI is reading your document</div>
        </div>
        <div style={{ display: 'flex', gap: '5px' }}>
          {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: feature.tagColor, animation: `glow-pulse 1.2s ease-in-out ${i * 0.25}s infinite` }} />)}
        </div>
      </div>
    );
    if (step === 'result' && data) {
      switch (feature.id) {
        case 'summarize':  return <SummaryPanel data={data} />;
        case 'quiz':       return <QuizPanel data={data} />;
        case 'flashcards': return <FlashcardsPanel data={data} />;
        case 'notes':      return <NotesPanel data={data} />;
        default:           return null;
      }
    }
    return null;
  };

  return (
    <>
      <div onClick={handleClose} style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(10,10,20,0.35)', backdropFilter: 'blur(6px)',
        opacity: closing ? 0 : 1, transition: 'opacity 0.3s ease',
      }} />
      <div className={closing ? 'panel-closing' : 'panel-overlay'} style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 400, maxWidth: '94vw', zIndex: 201,
        background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(40px)',
        borderLeft: `1px solid ${feature.tagColor}20`,
        boxShadow: `-12px 0 60px ${feature.glow}, -2px 0 20px rgba(0,0,0,0.06)`,
        display: 'flex', flexDirection: 'column',
        borderRadius: '28px 0 0 28px', overflow: 'hidden',
      }}>
        <div style={{ height: 4, background: feature.gradient, flexShrink: 0, boxShadow: `0 2px 12px ${feature.glow}` }} />
        <div style={{
          padding: '1.25rem 1.35rem 1rem', flexShrink: 0,
          background: feature.bg, borderBottom: `1px solid ${feature.tagColor}14`,
          position: 'relative', overflow: 'hidden',
        }}>
          <AmbientOrbs orb1={feature.orb1} orb2={feature.orb2} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              {step === 'result' && (
                <button onClick={handleBack} style={{ width: 30, height: 30, borderRadius: '50%', background: `${feature.tagColor}14`, border: `1px solid ${feature.tagColor}22`, cursor: 'pointer', color: feature.tagColor, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', flexShrink: 0 }}>
                  <ChevronLeft size={14} />
                </button>
              )}
              <div style={{ width: 42, height: 42, borderRadius: 13, background: feature.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 5px 18px ${feature.glow}`, fontSize: '1.2rem', flexShrink: 0 }}>{feature.emoji}</div>
              <div>
                <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '1rem', color: '#111827' }}>{feature.label}</div>
                <div style={{ fontFamily: 'DM Sans', fontSize: '0.71rem', color: '#6B7280', maxWidth: 190, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {step === 'result' ? (selectedPdf?.display_name || feature.desc) : feature.desc}
                </div>
              </div>
            </div>
            <button onClick={handleClose} style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(0,0,0,0.05)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', transition: 'all 0.2s', flexShrink: 0 }}
              onMouseEnter={e => { e.currentTarget.style.background='rgba(239,68,68,0.1)'; e.currentTarget.style.color='#EF4444'; }}
              onMouseLeave={e => { e.currentTarget.style.background='rgba(0,0,0,0.05)'; e.currentTarget.style.color='#9CA3AF'; }}
            ><X size={14} /></button>
          </div>
          {step !== 'pick' && (
            <div style={{ display: 'flex', gap: '3px', marginTop: '0.8rem', position: 'relative', zIndex: 1 }}>
              {['pick','loading','result'].map((s, si) => {
                const steps = ['pick','loading','result'];
                return <div key={s} style={{ flex: 1, height: 2.5, borderRadius: 99, background: si <= steps.indexOf(step) ? feature.gradient : 'rgba(0,0,0,0.07)', transition: 'background 0.4s ease', boxShadow: si <= steps.indexOf(step) ? `0 0 5px ${feature.glow}` : 'none' }} />;
              })}
            </div>
          )}
        </div>
        <div className="sb-scroll" style={{ flex: 1, overflowY: 'auto', padding: '1.35rem' }}>
          {renderContent()}
        </div>
      </div>
    </>
  );
}

// ── Ripple Button ──────────────────────────────────────────────────────────
function RippleButton({ onClick, children, style }) {
  const [ripples, setRipples] = useState([]);
  const btnRef = useRef(null);
  const handleClick = (e) => {
    const rect = btnRef.current.getBoundingClientRect();
    const id = Date.now();
    setRipples(prev => [...prev, { x: e.clientX - rect.left, y: e.clientY - rect.top, id }]);
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 700);
    onClick?.(e);
  };
  return (
    <button ref={btnRef} onClick={handleClick} style={{ position: 'relative', overflow: 'hidden', ...style }}>
      {ripples.map(r => (
        <span key={r.id} style={{ position: 'absolute', left: r.x, top: r.y, width: 8, height: 8, borderRadius: '50%', background: 'rgba(255,255,255,0.4)', transform: 'translate(-50%,-50%) scale(0)', animation: 'sidebar-ripple 0.65s ease-out forwards', pointerEvents: 'none' }} />
      ))}
      {children}
    </button>
  );
}

// ── Chat Item ──────────────────────────────────────────────────────────────
function ChatItem({ session, isActive, onClick, onDelete, onRename }) {
  const [hovered, setHovered] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editVal, setEditVal] = useState(session.title || 'New Chat');
  const [deleting, setDeleting] = useState(false);
  const inputRef = useRef(null);
  const title = session.title || 'New Chat';
  const id = session.id ?? session.session_id;
  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);
  const commitRename = async () => { const val = editVal.trim(); if (val && val !== title) await onRename(id, val); setEditing(false); };
  const handleDelete = async () => { setDeleting(true); await onDelete(id); };
  return (
    <div
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      onClick={() => !editing && onClick(session)}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.6rem',
        padding: '0.58rem 0.75rem', borderRadius: '0.9rem',
        cursor: 'pointer', position: 'relative',
        background: isActive ? 'linear-gradient(135deg,rgba(108,99,255,0.14),rgba(157,235,255,0.07))' : hovered ? 'rgba(108,99,255,0.06)' : 'transparent',
        border: isActive ? '1px solid rgba(108,99,255,0.22)' : '1px solid transparent',
        transform: deleting ? 'translateX(-100%) scale(0.8)' : 'translateX(0)',
        opacity: deleting ? 0 : 1,
        transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        marginBottom: '2px', overflow: 'hidden',
        boxShadow: isActive ? '0 2px 10px rgba(108,99,255,0.1)' : 'none',
      }}
    >
      {isActive && <div style={{ position: 'absolute', left: 0, top: '22%', bottom: '22%', width: 3, borderRadius: '0 3px 3px 0', background: 'linear-gradient(180deg,#6C63FF,#9DEBFF)', boxShadow: '0 0 8px rgba(108,99,255,0.55)' }} />}
      <div style={{ width: 27, height: 27, borderRadius: '0.52rem', flexShrink: 0, background: isActive ? 'linear-gradient(135deg,rgba(108,99,255,0.18),rgba(157,235,255,0.12))' : 'rgba(108,99,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: isActive ? '1px solid rgba(108,99,255,0.22)' : '1px solid transparent', transition: 'all 0.2s ease' }}>
        <MessageSquare size={11} color={isActive ? '#6C63FF' : '#9CA3AF'} />
      </div>
      {editing ? (
        <input ref={inputRef} value={editVal} onChange={e => setEditVal(e.target.value)} onKeyDown={e => { if (e.key==='Enter') commitRename(); if (e.key==='Escape') setEditing(false); }} onClick={e => e.stopPropagation()} style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontFamily: 'DM Sans', fontSize: '0.79rem', color: '#111827', fontWeight: 500 }} />
      ) : (
        <span style={{ flex: 1, fontFamily: 'DM Sans', fontSize: '0.79rem', color: isActive ? '#111827' : '#4B5563', fontWeight: isActive ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', transition: 'color 0.2s' }}>{title}</span>
      )}
      {editing ? (
        <div style={{ display: 'flex', gap: '0.22rem', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
          <button onClick={commitRename} style={iconBtnStyle('#10B981')}><Check size={10} /></button>
          <button onClick={() => setEditing(false)} style={iconBtnStyle('#EF4444')}><X size={10} /></button>
        </div>
      ) : (hovered || isActive) ? (
        <div style={{ display: 'flex', gap: '0.22rem', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
          <button onClick={() => { setEditVal(title); setEditing(true); }} style={iconBtnStyle('#6C63FF')}><Edit2 size={10} /></button>
          <button onClick={handleDelete} style={iconBtnStyle('#EF4444')}><Trash2 size={10} /></button>
        </div>
      ) : null}
    </div>
  );
}

const iconBtnStyle = (color) => ({
  background: 'rgba(255,255,255,0.75)', border: `1px solid ${color}22`,
  borderRadius: '0.42rem', width: 21, height: 21,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', color, transition: 'all 0.18s ease',
});

// ── Nav Item ───────────────────────────────────────────────────────────────
function NavItem({ icon, label, to, onClick }) {
  const location = useLocation();
  const isActive = to && location.pathname === to;
  const [hovered, setHovered] = useState(false);
  const inner = (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: '0.62rem', padding: '0.58rem 0.75rem', borderRadius: '0.9rem', cursor: 'pointer', background: isActive ? 'linear-gradient(135deg,rgba(108,99,255,0.14),rgba(157,235,255,0.07))' : hovered ? 'rgba(108,99,255,0.07)' : 'transparent', border: isActive ? '1px solid rgba(108,99,255,0.22)' : '1px solid transparent', transition: 'all 0.22s cubic-bezier(0.34,1.56,0.64,1)', transform: hovered && !isActive ? 'translateX(3px)' : 'translateX(0)', position: 'relative', boxShadow: isActive ? '0 2px 10px rgba(108,99,255,0.1)' : 'none' }}>
      {isActive && <div style={{ position: 'absolute', left: 0, top: '22%', bottom: '22%', width: 3, borderRadius: '0 3px 3px 0', background: 'linear-gradient(180deg,#6C63FF,#9DEBFF)', boxShadow: '0 0 8px rgba(108,99,255,0.55)' }} />}
      <div style={{ width: 29, height: 29, borderRadius: '0.62rem', flexShrink: 0, background: isActive ? 'linear-gradient(135deg,rgba(108,99,255,0.18),rgba(157,235,255,0.1))' : hovered ? 'linear-gradient(135deg,rgba(108,99,255,0.12),rgba(157,235,255,0.08))' : 'rgba(108,99,255,0.05)', border: isActive ? '1px solid rgba(108,99,255,0.28)' : hovered ? '1px solid rgba(108,99,255,0.16)' : '1px solid transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease', boxShadow: isActive ? '0 2px 10px rgba(108,99,255,0.18)' : 'none' }}>
        {React.cloneElement(icon, { size: 13, color: isActive || hovered ? '#6C63FF' : '#6B7280' })}
      </div>
      <span style={{ fontFamily: 'DM Sans', fontSize: '0.8rem', color: isActive || hovered ? '#111827' : '#6B7280', fontWeight: isActive ? 700 : hovered ? 600 : 400, transition: 'all 0.2s' }}>{label}</span>
    </div>
  );
  if (to) return <Link to={to} style={{ textDecoration: 'none' }}>{inner}</Link>;
  return inner;
}

// ── Tool Pill ──────────────────────────────────────────────────────────────
function ToolPill({ feature, index, isActive, onClick, collapsed }) {
  const [hovered, setHovered] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 130 + index * 58); return () => clearTimeout(t); }, [index]);

  if (collapsed) return (
    <div onClick={onClick} title={feature.label} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} style={{ width: 36, height: 36, borderRadius: '0.75rem', margin: '0 auto 3px', background: isActive ? feature.bg : hovered ? feature.bg : 'rgba(108,99,255,0.04)', border: `1px solid ${isActive || hovered ? feature.tagColor + '38' : 'transparent'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '0.95rem', boxShadow: isActive ? `0 2px 12px ${feature.glow}` : 'none', transition: 'all 0.22s cubic-bezier(0.34,1.56,0.64,1)', transform: hovered ? 'scale(1.1)' : 'scale(1)' }}>{feature.emoji}</div>
  );

  return (
    <div className="tool-pill-sb" onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.58rem', padding: '0.5rem 0.72rem', borderRadius: '0.88rem', cursor: 'pointer', background: isActive ? feature.bg : hovered ? feature.bg : 'transparent', border: `1px solid ${isActive ? feature.tagColor + '32' : hovered ? feature.tagColor + '22' : 'transparent'}`, boxShadow: isActive ? `0 2px 14px ${feature.glow}` : 'none', opacity: mounted ? 1 : 0, transform: mounted ? 'translateX(0)' : 'translateX(-14px)', transition: `opacity 0.38s ease ${index * 0.058}s, transform 0.38s cubic-bezier(0.34,1.56,0.64,1) ${index * 0.058}s, background 0.2s, border-color 0.2s, box-shadow 0.2s`, marginBottom: '1px', position: 'relative', overflow: 'hidden' }}>
      {isActive && <div style={{ position: 'absolute', left: 0, top: '14%', bottom: '14%', width: 2.5, borderRadius: '0 2px 2px 0', background: feature.gradient, boxShadow: `0 0 6px ${feature.glow}` }} />}
      <div style={{ width: 27, height: 27, borderRadius: '0.52rem', flexShrink: 0, background: isActive || hovered ? feature.gradient : `${feature.tagColor}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', boxShadow: isActive || hovered ? `0 2px 8px ${feature.glow}` : 'none', transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)', transform: hovered ? 'scale(1.12) rotate(-5deg)' : 'scale(1) rotate(0)' }}>{feature.emoji}</div>
      <span style={{ fontFamily: 'DM Sans', fontSize: '0.79rem', color: isActive ? '#111827' : hovered ? '#111827' : '#4B5563', fontWeight: isActive ? 600 : hovered ? 500 : 400, transition: 'color 0.2s', flex: 1 }}>{feature.label}</span>
      <div style={{ fontSize: '0.59rem', fontWeight: 700, fontFamily: 'Syne', letterSpacing: '0.04em', color: feature.tagColor, background: `${feature.tagColor}12`, border: `1px solid ${feature.tagColor}25`, borderRadius: 999, padding: '1px 7px', opacity: hovered || isActive ? 1 : 0, transition: 'opacity 0.2s', whiteSpace: 'nowrap', animation: isActive ? 'float-badge 2s ease-in-out infinite' : 'none' }}>{feature.tag}</div>
    </div>
  );
}

// ── Main Sidebar ───────────────────────────────────────────────────────────
export default function Sidebar() {
  const { sessions, setSessions, activeSession, setActiveSession, setMessages, uploads } = useChatStore();
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [creatingChat, setCreatingChat] = useState(false);
  const [newChatId, setNewChatId] = useState(null);
  const [activeFeature, setActiveFeature] = useState(null);
  const [toolsVisible, setToolsVisible] = useState(false);
  const toolsRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const sessionId = activeSession?.id ?? activeSession?.session_id ?? null;

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setToolsVisible(true); }, { threshold: 0.1 });
    if (toolsRef.current) obs.observe(toolsRef.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => { getSessions().then(setSessions).catch(() => setSessions([])); }, []);

  const handleNewChat = async () => {
    if (creatingChat) return;
    setCreatingChat(true);
    try {
      const session = await createSession();
      const id = session.id ?? session.session_id;
      setNewChatId(id);
      setSessions(prev => [session, ...prev]);
      setActiveSession(session);
      setMessages([]);
      setTimeout(() => setNewChatId(null), 800);
      navigate('/chat');
    } catch { toast.error('Could not create chat'); }
    finally { setCreatingChat(false); }
  };

  const handleDelete = async (id) => {
    try {
      await deleteSession(id);
      setSessions(prev => prev.filter(s => (s.id ?? s.session_id) !== id));
      if ((activeSession?.id ?? activeSession?.session_id) === id) { setActiveSession(null); setMessages([]); }
      toast.success('Chat deleted');
    } catch { toast.error('Delete failed'); }
  };

  const handleRename = async (id, newTitle) => {
    try {
      await renameSession(id, newTitle);
      setSessions(prev => prev.map(s => (s.id ?? s.session_id) === id ? { ...s, title: newTitle } : s));
      if ((activeSession?.id ?? activeSession?.session_id) === id) useChatStore.getState().updateActiveSessionTitle(newTitle);
    } catch { toast.error('Rename failed'); }
  };

  const handleSessionClick = (session) => { setActiveSession(session); setMessages([]); navigate('/chat'); };
  const handleToolClick = (feature) => { if (!sessionId) { toast.error('Start a session first.'); return; } setActiveFeature(feature); };

  const activeId = activeSession?.id ?? activeSession?.session_id;
  const filtered = (sessions || []).filter(s => (s.title || 'New Chat').toLowerCase().includes(search.toLowerCase()));
  const sidebarW = collapsed ? 64 : 252;

  return (
    <>
      <style>{STYLES}</style>

      <aside style={{
        width: sidebarW, minWidth: sidebarW, height: '100vh',
        display: 'flex', flexDirection: 'column',
        background: 'rgba(255,255,255,0.94)', backdropFilter: 'blur(28px)',
        borderRight: '1px solid rgba(108,99,255,0.09)',
        boxShadow: '3px 0 28px rgba(108,99,255,0.06), 1px 0 0 rgba(108,99,255,0.04)',
        transition: 'width 0.38s cubic-bezier(0.34,1.56,0.64,1), min-width 0.38s cubic-bezier(0.34,1.56,0.64,1)',
        position: 'relative', zIndex: 100, overflow: 'hidden',
      }}>
        {/* Subtle top gradient line */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #6C63FF, #9DEBFF, #C4B5FD, #6C63FF)', backgroundSize: '200% auto', animation: 'shimmer-sweep 5s linear infinite', zIndex: 10, opacity: 0.6 }} />

        {/* Logo */}
        <div style={{ padding: collapsed ? '1.2rem 0' : '1.2rem 1rem', display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between', borderBottom: '1px solid rgba(108,99,255,0.07)', gap: '0.5rem', flexShrink: 0, marginTop: 2 }}>
          {!collapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
              <div style={{ width: 33, height: 33, background: 'linear-gradient(135deg,#6C63FF,#9DEBFF)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(108,99,255,0.42)', flexShrink: 0 }}>
                <Zap size={15} color="white" />
              </div>
              <Link to="/chat" style={{ textDecoration: 'none' }}>
                <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '1.22rem', background: 'linear-gradient(135deg,#111827 0%,#6C63FF 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '0.03em', whiteSpace: 'nowrap' }}>WARPS</span>
              </Link>
            </div>
          )}
          {collapsed && (
            <Link to="/chat" style={{ textDecoration: 'none' }}>
              <div style={{ width: 33, height: 33, background: 'linear-gradient(135deg,#6C63FF,#9DEBFF)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(108,99,255,0.42)' }}>
                <Zap size={15} color="white" />
              </div>
            </Link>
          )}
          <button onClick={() => setCollapsed(!collapsed)} style={{ background: 'rgba(108,99,255,0.06)', border: '1px solid rgba(108,99,255,0.13)', borderRadius: '0.52rem', width: 25, height: 25, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#9CA3AF', flexShrink: 0, transition: 'all 0.2s ease' }}
            onMouseEnter={e => { e.currentTarget.style.background='rgba(108,99,255,0.13)'; e.currentTarget.style.color='#6C63FF'; }}
            onMouseLeave={e => { e.currentTarget.style.background='rgba(108,99,255,0.06)'; e.currentTarget.style.color='#9CA3AF'; }}
          >
            {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
          </button>
        </div>

        {/* New Chat */}
        <div style={{ padding: collapsed ? '0.85rem 0.75rem' : '0.85rem 0.85rem 0.65rem', flexShrink: 0 }}>
          <RippleButton onClick={handleNewChat} style={{ width: '100%', background: creatingChat ? 'linear-gradient(135deg,#8A7DFF,#9DEBFF)' : 'linear-gradient(135deg,#6C63FF,#8A7DFF)', border: 'none', borderRadius: '0.95rem', padding: collapsed ? '0.65rem 0' : '0.65rem 1rem', display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start', gap: '0.6rem', cursor: creatingChat ? 'wait' : 'pointer', animation: 'new-btn-breathe 3.5s ease-in-out infinite', transition: 'all 0.32s cubic-bezier(0.34,1.56,0.64,1)', transform: creatingChat ? 'scale(0.96)' : 'scale(1)' }}
            onMouseEnter={e => { e.currentTarget.style.transform='scale(1.02) translateY(-1px)'; e.currentTarget.style.boxShadow='0 10px 32px rgba(108,99,255,0.52)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform='scale(1)'; e.currentTarget.style.boxShadow=''; }}
          >
            <Plus size={15} color="white" style={{ transition: 'transform 0.4s', transform: creatingChat ? 'rotate(45deg)' : 'rotate(0deg)', flexShrink: 0 }} />
            {!collapsed && <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '0.84rem', color: 'white', letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>{creatingChat ? 'Creating…' : 'New Chat'}</span>}
          </RippleButton>
        </div>

        {/* Search */}
        {!collapsed && (
          <div style={{ padding: '0 0.85rem 0.75rem', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.48rem', background: searchFocused ? 'rgba(255,255,255,0.96)' : 'rgba(108,99,255,0.04)', border: `1px solid ${searchFocused ? 'rgba(108,99,255,0.38)' : 'rgba(108,99,255,0.1)'}`, borderRadius: '0.78rem', padding: '0.48rem 0.75rem', transition: 'all 0.25s ease', boxShadow: searchFocused ? '0 0 0 3px rgba(108,99,255,0.07)' : 'none' }}>
              <Search size={12} color={searchFocused ? '#6C63FF' : '#9CA3AF'} style={{ transition: 'color 0.2s', flexShrink: 0 }} />
              <input value={search} onChange={e => setSearch(e.target.value)} onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)} placeholder="Search chats…" style={{ background: 'none', border: 'none', outline: 'none', fontFamily: 'DM Sans', fontSize: '0.79rem', color: '#374151', width: '100%' }} />
              {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 0, display: 'flex' }}><X size={11} /></button>}
            </div>
          </div>
        )}

        {/* Sessions */}
        <div className="sb-scroll" style={{ flex: 1, overflowY: 'auto', padding: collapsed ? '0 0.5rem' : '0 0.85rem' }}>
          {!collapsed && (
            <div style={{ fontSize: '0.63rem', fontWeight: 700, letterSpacing: '0.1em', color: '#C4C4C4', fontFamily: 'Syne', padding: '0 0.25rem 0.48rem', textTransform: 'uppercase' }}>Recent Chats</div>
          )}
          {filtered.length === 0 && !collapsed && (
            <div style={{ textAlign: 'center', padding: '1.75rem 0.5rem', fontFamily: 'DM Sans', fontSize: '0.77rem', color: '#D1D5DB' }}>
              {search ? 'No chats found.' : 'No chats yet. Start one!'}
            </div>
          )}
          {filtered.map(session => {
            const id = session.id ?? session.session_id;
            const isNew = id === newChatId;
            if (collapsed) {
              const isAct = id === activeId;
              return (
                <div key={id} onClick={() => handleSessionClick(session)} title={session.title || 'New Chat'} style={{ width: 36, height: 36, borderRadius: '0.75rem', margin: '0 auto 3px', background: isAct ? 'linear-gradient(135deg,rgba(108,99,255,0.18),rgba(157,235,255,0.12))' : 'rgba(108,99,255,0.04)', border: isAct ? '1px solid rgba(108,99,255,0.28)' : '1px solid transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s ease' }}
                  onMouseEnter={e => { if (!isAct) e.currentTarget.style.background='rgba(108,99,255,0.09)'; }}
                  onMouseLeave={e => { if (!isAct) e.currentTarget.style.background='rgba(108,99,255,0.04)'; }}
                ><MessageSquare size={12} color={isAct ? '#6C63FF' : '#9CA3AF'} /></div>
              );
            }
            return (
              <div key={id} style={{ animation: isNew ? 'new-chat-slide 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards' : 'none' }}>
                <ChatItem session={session} isActive={id === activeId} onClick={handleSessionClick} onDelete={handleDelete} onRename={handleRename} />
              </div>
            );
          })}
        </div>

        {/* Divider */}
        <div style={{ margin: '0 0.85rem', height: 1, background: 'linear-gradient(90deg,transparent,rgba(108,99,255,0.13),transparent)', flexShrink: 0 }} />

        {/* AI Tools */}
        <div ref={toolsRef} style={{ padding: collapsed ? '0.6rem 0.5rem' : '0.6rem 0.85rem', flexShrink: 0, opacity: toolsVisible ? 1 : 0, transform: toolsVisible ? 'translateY(0)' : 'translateY(12px)', transition: 'opacity 0.5s ease, transform 0.5s ease' }}>
          {!collapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.42rem' }}>
              <div style={{ height: 1, flex: 1, background: 'linear-gradient(90deg,transparent,rgba(108,99,255,0.16))' }} />
              <span style={{ fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.12em', color: '#C4C4C4', fontFamily: 'Syne', textTransform: 'uppercase', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Zap size={8} style={{ color: '#6C63FF' }} /> AI Tools
              </span>
              <div style={{ height: 1, flex: 1, background: 'linear-gradient(90deg,rgba(108,99,255,0.16),transparent)' }} />
            </div>
          )}
          {FEATURES.map((feature, i) => (
            <ToolPill key={feature.id} feature={feature} index={i} isActive={activeFeature?.id === feature.id} onClick={() => handleToolClick(feature)} collapsed={collapsed} />
          ))}
        </div>

        {/* Divider */}
        <div style={{ margin: '0 0.85rem', height: 1, background: 'linear-gradient(90deg,transparent,rgba(108,99,255,0.13),transparent)', flexShrink: 0 }} />

        {/* Bottom nav */}
        <div style={{ padding: collapsed ? '0.72rem 0.5rem' : '0.72rem 0.85rem', display: 'flex', flexDirection: 'column', gap: '1px', flexShrink: 0 }}>
          {collapsed ? (
            [{ icon: <Settings />, label: 'Settings', to: '/settings' }, { icon: <User />, label: 'Profile', to: '/profile' }, { icon: <BookOpen />, label: 'Library', to: '/library' }].map(({ icon, label, to }) => {
              const isAct = location.pathname === to;
              return (
                <Link key={label} to={to} title={label} style={{ textDecoration: 'none' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '0.75rem', margin: '0 auto 3px', background: isAct ? 'linear-gradient(135deg,rgba(108,99,255,0.14),rgba(157,235,255,0.09))' : 'rgba(108,99,255,0.04)', border: isAct ? '1px solid rgba(108,99,255,0.22)' : '1px solid transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: isAct ? '#6C63FF' : '#6B7280', transition: 'all 0.2s ease' }}
                    onMouseEnter={e => { if (!isAct) { e.currentTarget.style.background='rgba(108,99,255,0.09)'; e.currentTarget.style.color='#6C63FF'; }}}
                    onMouseLeave={e => { if (!isAct) { e.currentTarget.style.background='rgba(108,99,255,0.04)'; e.currentTarget.style.color='#6B7280'; }}}
                  >{React.cloneElement(icon, { size: 13 })}</div>
                </Link>
              );
            })
          ) : (
            <>
              <NavItem icon={<Settings />} label="Settings" to="/settings" />
              <NavItem icon={<User />} label="Profile" to="/profile" />
              <NavItem icon={<BookOpen />} label="Library" to="/library" />
            </>
          )}
        </div>
      </aside>

      {/* Side panel — PDF picker is inside it */}
      {activeFeature && (
        <SidePanel feature={activeFeature} sessionId={sessionId} uploads={uploads} onClose={() => setActiveFeature(null)} />
      )}
    </>
  );
}