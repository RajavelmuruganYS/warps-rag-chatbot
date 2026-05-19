import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, RotateCcw, ChevronLeft, ChevronRight, Sparkles, FileText, HelpCircle, BookOpen, File, Zap } from 'lucide-react';
import { summarize, generateQuiz, generateFlashcards, generateNotes } from '../../services/api';
import useChatStore from '../../store/chatStore';
import toast from 'react-hot-toast';

// ── Premium Styles ─────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap');

  @keyframes dock-float-in {
    0%   { opacity: 0; transform: translateY(32px) scale(0.88); filter: blur(8px); }
    60%  { filter: blur(0px); }
    100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0px); }
  }
  @keyframes panel-sweep-in {
    0%   { opacity: 0; transform: translateX(60px) scale(0.96); }
    100% { opacity: 1; transform: translateX(0) scale(1); }
  }
  @keyframes panel-sweep-out {
    0%   { opacity: 1; transform: translateX(0) scale(1); }
    100% { opacity: 0; transform: translateX(60px) scale(0.96); }
  }
  @keyframes pdf-list-in {
    0%   { opacity: 0; transform: translateY(12px) scale(0.97); }
    100% { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes spin-loader { to { transform: rotate(360deg); } }
  @keyframes shimmer-sweep {
    0%   { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  @keyframes card-rise {
    0%   { opacity: 0; transform: translateY(20px) scale(0.93); }
    100% { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes tag-pop {
    0%   { transform: scale(0.5) rotate(-8deg); opacity: 0; }
    65%  { transform: scale(1.08) rotate(1deg); }
    100% { transform: scale(1) rotate(0deg); opacity: 1; }
  }
  @keyframes glow-pulse {
    0%,100% { opacity: 0.5; transform: scale(1); }
    50%      { opacity: 1;   transform: scale(1.08); }
  }
  @keyframes orb-drift {
    0%   { transform: translate(0,0) scale(1); }
    33%  { transform: translate(8px,-6px) scale(1.04); }
    66%  { transform: translate(-5px,4px) scale(0.97); }
    100% { transform: translate(0,0) scale(1); }
  }
  @keyframes float-badge {
    0%,100% { transform: translateY(0px); }
    50%      { transform: translateY(-3px); }
  }
  @keyframes progress-fill {
    from { width: 0%; }
    to   { width: 100%; }
  }
  @keyframes correct-flash {
    0%   { box-shadow: 0 0 0 0 rgba(16,185,129,0.6); }
    50%  { box-shadow: 0 0 0 8px rgba(16,185,129,0); }
    100% { box-shadow: 0 0 0 0 rgba(16,185,129,0); }
  }
  @keyframes wrong-shake {
    0%,100% { transform: translateX(0); }
    20%     { transform: translateX(-5px); }
    40%     { transform: translateX(5px); }
    60%     { transform: translateX(-3px); }
    80%     { transform: translateX(3px); }
  }
  @keyframes card-flip-hint {
    0%,100% { transform: rotateY(0deg); }
    50%     { transform: rotateY(8deg); }
  }

  .feat-card {
    cursor: pointer;
    border-radius: 22px;
    position: relative;
    overflow: hidden;
    transition: transform 0.38s cubic-bezier(0.34,1.56,0.64,1),
                box-shadow 0.3s ease,
                border-color 0.25s ease;
  }
  .feat-card::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 22px;
    background: linear-gradient(135deg, rgba(255,255,255,0.18) 0%, transparent 60%);
    pointer-events: none;
    z-index: 1;
  }
  .feat-card:hover  { transform: translateY(-8px) scale(1.03); }
  .feat-card:active { transform: translateY(-2px) scale(0.99); }

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
  .flashcard-face:hover { box-shadow: 0 16px 48px rgba(0,0,0,0.12); }
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
    backdrop-filter: blur(8px);
    width: 100%;
  }
  .quiz-opt:hover:not(:disabled) {
    background: rgba(108,99,255,0.07);
    border-color: rgba(108,99,255,0.28);
    transform: translateX(5px);
    box-shadow: 4px 0 16px rgba(108,99,255,0.1);
  }
  .quiz-opt.correct {
    background: rgba(16,185,129,0.1);
    border-color: #10B981;
    color: #065F46;
    animation: correct-flash 0.6s ease forwards;
  }
  .quiz-opt.wrong {
    background: rgba(239,68,68,0.08);
    border-color: #EF4444;
    color: #7F1D1D;
    animation: wrong-shake 0.4s ease forwards;
  }

  .pdf-row {
    display: flex; align-items: center; gap: 0.85rem;
    padding: 0.9rem 1.1rem; border-radius: 16px;
    border: 1.5px solid rgba(108,99,255,0.1);
    background: rgba(255,255,255,0.6);
    cursor: pointer; backdrop-filter: blur(12px);
    transition: all 0.28s cubic-bezier(0.34,1.56,0.64,1);
    font-family: 'DM Sans', sans-serif;
    position: relative; overflow: hidden;
  }
  .pdf-row::after {
    content: '';
    position: absolute; left: 0; top: 0; bottom: 0;
    width: 3px; border-radius: 0 3px 3px 0;
    background: linear-gradient(180deg, #6C63FF, #9DEBFF);
    transform: scaleY(0); transition: transform 0.25s ease;
    transform-origin: bottom;
  }
  .pdf-row:hover {
    border-color: rgba(108,99,255,0.3);
    background: rgba(108,99,255,0.05);
    transform: translateX(5px);
    box-shadow: 0 6px 24px rgba(108,99,255,0.12);
  }
  .pdf-row:hover::after { transform: scaleY(1); }

  .sidebar-scroll::-webkit-scrollbar { width: 3px; }
  .sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
  .sidebar-scroll::-webkit-scrollbar-thumb { background: rgba(108,99,255,0.2); border-radius: 99px; }
`;

// ── Feature Config ─────────────────────────────────────────────────────────
const FEATURES = [
  {
    id: 'summarize', label: 'Summary', emoji: '✨',
    gradient: 'linear-gradient(135deg, #6C63FF 0%, #A78BFA 50%, #9DEBFF 100%)',
    gradientDark: 'linear-gradient(135deg, #4338CA 0%, #7C3AED 100%)',
    glow: 'rgba(108,99,255,0.45)', glow2: 'rgba(108,99,255,0.1)',
    bg: 'linear-gradient(135deg, rgba(108,99,255,0.1) 0%, rgba(157,235,255,0.07) 100%)',
    desc: 'AI-crafted document overview', tag: 'Smart', tagColor: '#6C63FF',
    orb1: 'rgba(108,99,255,0.15)', orb2: 'rgba(157,235,255,0.12)',
  },
  {
    id: 'quiz', label: 'Quiz Me', emoji: '📝',
    gradient: 'linear-gradient(135deg, #EC4899 0%, #F472B6 50%, #F59E0B 100%)',
    gradientDark: 'linear-gradient(135deg, #BE185D 0%, #B45309 100%)',
    glow: 'rgba(236,72,153,0.45)', glow2: 'rgba(236,72,153,0.1)',
    bg: 'linear-gradient(135deg, rgba(236,72,153,0.08) 0%, rgba(245,158,11,0.06) 100%)',
    desc: 'Interactive knowledge testing', tag: 'Interactive', tagColor: '#EC4899',
    orb1: 'rgba(236,72,153,0.15)', orb2: 'rgba(245,158,11,0.12)',
  },
  {
    id: 'flashcards', label: 'Flashcards', emoji: '🃏',
    gradient: 'linear-gradient(135deg, #10B981 0%, #34D399 50%, #3B82F6 100%)',
    gradientDark: 'linear-gradient(135deg, #065F46 0%, #1E40AF 100%)',
    glow: 'rgba(16,185,129,0.45)', glow2: 'rgba(16,185,129,0.1)',
    bg: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(59,130,246,0.06) 100%)',
    desc: 'Flip through key concepts', tag: 'Memory', tagColor: '#10B981',
    orb1: 'rgba(16,185,129,0.15)', orb2: 'rgba(59,130,246,0.12)',
  },
  {
    id: 'notes', label: 'Notes', emoji: '🗒️',
    gradient: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 50%, #EF4444 100%)',
    gradientDark: 'linear-gradient(135deg, #92400E 0%, #991B1B 100%)',
    glow: 'rgba(245,158,11,0.45)', glow2: 'rgba(245,158,11,0.1)',
    bg: 'linear-gradient(135deg, rgba(245,158,11,0.09) 0%, rgba(239,68,68,0.06) 100%)',
    desc: 'Structured notes, instantly', tag: 'Organized', tagColor: '#F59E0B',
    orb1: 'rgba(245,158,11,0.15)', orb2: 'rgba(239,68,68,0.12)',
  },
];

// ── Loader ─────────────────────────────────────────────────────────────────
function Loader({ color = '#6C63FF', size = 38 }) {
  return (
    <div style={{
      width: size, height: size,
      border: `3px solid ${color}18`,
      borderTop: `3px solid ${color}`,
      borderRight: `3px solid ${color}55`,
      borderRadius: '50%',
      animation: 'spin-loader 0.75s linear infinite',
      margin: '0 auto',
    }} />
  );
}

// ── Ambient Orb Background ─────────────────────────────────────────────────
function AmbientOrbs({ orb1, orb2 }) {
  return (
    <>
      <div style={{
        position: 'absolute', width: 120, height: 120, borderRadius: '50%',
        background: `radial-gradient(circle, ${orb1} 0%, transparent 70%)`,
        top: -20, right: -20, pointerEvents: 'none',
        animation: 'orb-drift 6s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', width: 80, height: 80, borderRadius: '50%',
        background: `radial-gradient(circle, ${orb2} 0%, transparent 70%)`,
        bottom: 10, left: -10, pointerEvents: 'none',
        animation: 'orb-drift 8s ease-in-out infinite reverse',
      }} />
    </>
  );
}

// ── Summary Panel ─────────────────────────────────────────────────────────
function SummaryPanel({ data }) {
  const text = data?.summary || '';
  const paragraphs = text.split('\n').filter(Boolean);
  return (
    <div style={{ fontFamily: 'DM Sans', fontSize: '0.86rem', color: '#1F2937', lineHeight: 1.8 }}>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
        background: 'linear-gradient(135deg,rgba(108,99,255,0.14),rgba(157,235,255,0.1))',
        border: '1px solid rgba(108,99,255,0.22)', borderRadius: 999,
        padding: '5px 14px', fontSize: '0.72rem', fontWeight: 700, color: '#6C63FF',
        fontFamily: 'Syne', marginBottom: '1.2rem',
        animation: 'tag-pop 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards',
        boxShadow: '0 2px 12px rgba(108,99,255,0.15)',
      }}>✨ AI Summary</div>
      {paragraphs.map((p, i) => (
        <p key={i} style={{
          marginBottom: '0.85rem',
          animation: `card-rise 0.4s ease ${i * 0.07}s both`,
          paddingLeft: p.startsWith('**') || p.startsWith('#') ? 0 : '0.1rem',
        }}>
          {p.startsWith('**') || p.startsWith('#') || p.match(/^[A-Z][^a-z]{2,}/)
            ? <strong style={{
                color: '#111827', display: 'block', marginBottom: '0.25rem',
                fontSize: '0.9rem', fontFamily: 'Syne', fontWeight: 700,
                borderLeft: '3px solid #6C63FF', paddingLeft: '0.75rem',
              }}>{p.replace(/[#*]/g,'').trim()}</strong>
            : p.replace(/[*#]/g,'').trim()}
        </p>
      ))}
    </div>
  );
}

// ── Notes Panel ───────────────────────────────────────────────────────────
function NotesPanel({ data }) {
  const text = data?.notes || '';
  const lines = text.split('\n').filter(Boolean);
  return (
    <div style={{ fontFamily: 'DM Sans', fontSize: '0.86rem', color: '#1F2937' }}>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
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
            marginBottom: isHeader ? '0.75rem' : '0.4rem',
            display: 'flex', gap: '0.6rem', alignItems: 'flex-start',
          }}>
            {isBullet && (
              <span style={{
                color: '#F59E0B', fontSize: '0.6rem', flexShrink: 0, marginTop: '0.45rem',
                background: 'rgba(245,158,11,0.15)', borderRadius: '50%',
                width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>◆</span>
            )}
            <span style={{
              fontWeight: isHeader ? 700 : 400,
              color: isHeader ? '#111827' : '#374151',
              fontSize: isHeader ? '0.9rem' : '0.84rem',
              lineHeight: 1.65,
              fontFamily: isHeader ? 'Syne' : 'DM Sans',
              borderBottom: isHeader ? '1px solid rgba(245,158,11,0.2)' : 'none',
              paddingBottom: isHeader ? '0.2rem' : 0,
            }}>{clean}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Quiz Panel ────────────────────────────────────────────────────────────
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
    <div style={{ fontFamily: 'DM Sans', fontSize: '0.85rem', color: '#374151', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>{raw}</div>
  );

  const q = questions[idx];
  const sel = selected[idx];
  const pct = ((idx + 1) / questions.length) * 100;

  return (
    <div>
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '0.7rem', color: '#9CA3AF', letterSpacing: '0.08em' }}>
            QUESTION {idx + 1} OF {questions.length}
          </span>
          <span style={{
            fontFamily: 'Syne', fontWeight: 800, fontSize: '0.75rem', color: '#EC4899',
            background: 'rgba(236,72,153,0.1)', borderRadius: 999, padding: '2px 8px',
          }}>{Math.round(pct)}%</span>
        </div>
        <div style={{ height: 5, background: 'rgba(108,99,255,0.1)', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 99, width: `${pct}%`,
            background: 'linear-gradient(90deg, #EC4899, #F59E0B)',
            transition: 'width 0.5s cubic-bezier(0.34,1.56,0.64,1)',
            boxShadow: '0 0 8px rgba(236,72,153,0.4)',
          }} />
        </div>
      </div>

      <div key={idx} style={{
        fontFamily: 'Syne', fontWeight: 700, fontSize: '0.92rem', color: '#111827',
        marginBottom: '1.1rem', lineHeight: 1.55,
        animation: 'card-rise 0.35s ease forwards',
        background: 'linear-gradient(135deg, rgba(236,72,153,0.06), rgba(245,158,11,0.04))',
        borderRadius: 16, padding: '0.85rem 1rem',
        border: '1px solid rgba(236,72,153,0.1)',
      }}>{q.q}</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
        {q.options.map((o, oi) => {
          let cls = 'quiz-opt';
          if (sel) {
            if (o.key === q.answer) cls += ' correct';
            else if (o.key === sel && sel !== q.answer) cls += ' wrong';
          }
          return (
            <button key={o.key} className={cls} disabled={!!sel}
              onClick={() => setSelected(prev => ({ ...prev, [idx]: o.key }))}
              style={{
                opacity: sel && o.key !== q.answer && o.key !== sel ? 0.38 : 1,
                animation: `card-rise 0.35s ease ${oi * 0.07}s both`,
              }}>
              <span style={{
                fontWeight: 800, marginRight: '0.6rem', color: '#6C63FF',
                background: 'rgba(108,99,255,0.1)', borderRadius: 6,
                padding: '1px 6px', fontSize: '0.75rem',
              }}>{o.key}</span>
              {o.text}
            </button>
          );
        })}
      </div>

      {sel && (
        <div style={{
          padding: '0.7rem 1rem', borderRadius: 14, marginBottom: '0.85rem',
          background: sel === q.answer ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.08)',
          border: `1.5px solid ${sel === q.answer ? '#10B981' : '#EF4444'}`,
          fontFamily: 'DM Sans', fontSize: '0.82rem',
          color: sel === q.answer ? '#065F46' : '#7F1D1D',
          animation: 'tag-pop 0.3s ease forwards',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
        }}>
          <span style={{ fontSize: '1.1rem' }}>{sel === q.answer ? '🎉' : '❌'}</span>
          {sel === q.answer ? 'Correct! Well done.' : `Correct answer: ${q.answer}`}
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.6rem' }}>
        {[
          { label: 'Prev', dir: -1, disabled: idx === 0 },
          { label: 'Next', dir: 1,  disabled: idx === questions.length - 1 },
        ].map(({ label, dir, disabled }) => (
          <button key={label} onClick={() => setIdx(i => i + dir)} disabled={disabled} style={{
            flex: 1, padding: '0.6rem', borderRadius: 14,
            border: `1.5px solid rgba(236,72,153,${disabled ? '0.1' : '0.25'})`,
            background: dir === 1
              ? 'linear-gradient(135deg, rgba(236,72,153,0.1), rgba(245,158,11,0.08))'
              : 'rgba(236,72,153,0.05)',
            cursor: disabled ? 'not-allowed' : 'pointer',
            color: '#EC4899', fontFamily: 'Syne', fontWeight: 700, fontSize: '0.78rem',
            opacity: disabled ? 0.35 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
            transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
          }}>
            {dir === -1 && <ChevronLeft size={14} />}{label}{dir === 1 && <ChevronRight size={14} />}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Flashcard Panel ───────────────────────────────────────────────────────
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
    setFlipped(false);
    setHintShown(false);
    setTimeout(() => setIdx(i => Math.min(Math.max(0, i + delta), cards.length - 1)), 130);
  };

  if (!cards.length) return (
    <div style={{ fontFamily: 'DM Sans', fontSize: '0.85rem', color: '#374151', textAlign: 'center', paddingTop: '2rem' }}>
      No flashcards generated.
    </div>
  );

  const card = cards[idx];
  const front = card?.front || card?.question || card?.term || 'Front';
  const back  = card?.back  || card?.answer  || card?.definition || 'Back';

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '0.85rem' }}>
        <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '0.7rem', color: '#9CA3AF', letterSpacing: '0.1em' }}>
          CARD {idx + 1} / {cards.length}
        </span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '5px', marginBottom: '1.2rem', flexWrap: 'wrap' }}>
        {cards.map((_, i) => (
          <div key={i} onClick={() => { setFlipped(false); setIdx(i); }} style={{
            width: i === idx ? 24 : 7, height: 7, borderRadius: 99,
            background: i === idx
              ? 'linear-gradient(90deg,#10B981,#3B82F6)'
              : i < idx ? 'rgba(16,185,129,0.4)' : 'rgba(16,185,129,0.15)',
            cursor: 'pointer',
            transition: 'all 0.38s cubic-bezier(0.34,1.56,0.64,1)',
            boxShadow: i === idx ? '0 0 8px rgba(16,185,129,0.5)' : 'none',
          }} />
        ))}
      </div>

      <div className="flashcard-scene" style={{ marginBottom: '0.7rem' }}>
        <div
          className={`flashcard-inner${flipped ? ' flipped' : ''}`}
          onClick={() => setFlipped(f => !f)}
          style={{ animation: hintShown && !flipped ? 'card-flip-hint 0.8s ease 0.2s' : 'none' }}
        >
          <div className="flashcard-face" style={{
            background: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(59,130,246,0.08))',
            border: '2px solid rgba(16,185,129,0.2)',
            boxShadow: '0 8px 32px rgba(16,185,129,0.1), inset 0 1px 0 rgba(255,255,255,0.6)',
          }}>
            <div style={{
              position: 'absolute', inset: 0, borderRadius: 20,
              background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.25) 50%, transparent 60%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer-sweep 3s ease-in-out infinite',
              pointerEvents: 'none',
            }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{
                fontSize: '0.62rem', fontFamily: 'Syne', fontWeight: 800,
                letterSpacing: '0.14em', color: '#10B981',
                marginBottom: '0.75rem', textAlign: 'center',
                background: 'rgba(16,185,129,0.12)', borderRadius: 999,
                padding: '3px 12px', display: 'inline-block',
              }}>TERM</div>
              <div style={{
                fontFamily: 'Syne', fontWeight: 700, fontSize: '1rem',
                color: '#111827', textAlign: 'center', lineHeight: 1.5,
              }}>{front}</div>
            </div>
          </div>

          <div className="flashcard-face flashcard-back" style={{
            background: 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(16,185,129,0.08))',
            border: '2px solid rgba(59,130,246,0.2)',
            boxShadow: '0 8px 32px rgba(59,130,246,0.1), inset 0 1px 0 rgba(255,255,255,0.6)',
          }}>
            <div style={{
              position: 'absolute', inset: 0, borderRadius: 20,
              background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.2) 50%, transparent 60%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer-sweep 3s ease-in-out infinite 1.5s',
              pointerEvents: 'none',
            }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{
                fontSize: '0.62rem', fontFamily: 'Syne', fontWeight: 800,
                letterSpacing: '0.14em', color: '#3B82F6',
                marginBottom: '0.75rem', textAlign: 'center',
                background: 'rgba(59,130,246,0.12)', borderRadius: 999,
                padding: '3px 12px', display: 'inline-block',
              }}>DEFINITION</div>
              <div style={{
                fontFamily: 'DM Sans', fontSize: '0.88rem',
                color: '#1F2937', textAlign: 'center', lineHeight: 1.65,
              }}>{back}</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{
        textAlign: 'center', fontSize: '0.71rem', color: '#9CA3AF',
        fontFamily: 'DM Sans', marginBottom: '1.1rem',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
        opacity: hintShown && !flipped ? 0.8 : 0,
        transition: 'opacity 0.4s ease',
      }}>
        <RotateCcw size={11} style={{ animation: 'spin-loader 3s linear infinite' }} />
        Tap card to reveal answer
      </div>

      <div style={{ display: 'flex', gap: '0.6rem' }}>
        {[
          { label: 'Prev', dir: -1, disabled: idx === 0, color: '#10B981', borderC: 'rgba(16,185,129,0.25)' },
          { label: 'Next', dir: 1,  disabled: idx === cards.length-1, color: '#3B82F6', borderC: 'rgba(59,130,246,0.25)' },
        ].map(({ label, dir, disabled, color, borderC }) => (
          <button key={label} onClick={() => go(dir)} disabled={disabled} style={{
            flex: 1, padding: '0.6rem', borderRadius: 14,
            border: `1.5px solid ${borderC}`,
            background: dir === 1
              ? 'linear-gradient(135deg,rgba(16,185,129,0.08),rgba(59,130,246,0.08))'
              : 'rgba(16,185,129,0.05)',
            cursor: disabled ? 'not-allowed' : 'pointer',
            color, fontFamily: 'Syne', fontWeight: 700, fontSize: '0.78rem',
            opacity: disabled ? 0.35 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
            transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
          }}>
            {dir === -1 && <ChevronLeft size={14} />}{label}{dir === 1 && <ChevronRight size={14} />}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── PDF Picker — rendered INSIDE the side panel ────────────────────────────
function PDFPickerInPanel({ feature, pdfs, onSelect }) {
  if (!pdfs || pdfs.length === 0) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '3rem 1.5rem', textAlign: 'center',
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: 20, marginBottom: '1.25rem',
          background: 'linear-gradient(135deg, rgba(239,68,68,0.12), rgba(245,158,11,0.08))',
          border: '1.5px solid rgba(239,68,68,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2rem',
          boxShadow: '0 8px 24px rgba(239,68,68,0.1)',
          animation: 'card-rise 0.4s ease forwards',
        }}>📄</div>
        <div style={{
          fontFamily: 'Syne', fontWeight: 800, fontSize: '1rem',
          color: '#111827', marginBottom: '0.6rem',
          animation: 'card-rise 0.4s ease 0.08s both',
        }}>No PDFs in this session</div>
        <div style={{
          fontFamily: 'DM Sans', fontSize: '0.8rem', color: '#6B7280',
          lineHeight: 1.65, maxWidth: 260,
          animation: 'card-rise 0.4s ease 0.16s both',
        }}>
          Upload a PDF using the 📎 button in the chat input, then come back here.
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '0.25rem 0' }}>
      <div style={{
        fontFamily: 'Syne', fontWeight: 700, fontSize: '0.7rem',
        letterSpacing: '0.1em', color: '#9CA3AF', textTransform: 'uppercase',
        marginBottom: '0.85rem', paddingLeft: '0.1rem',
      }}>Choose a document</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
        {pdfs.map((pdf, i) => (
          <div key={pdf.filename} className="pdf-row"
            onClick={() => onSelect(pdf)}
            style={{ animation: `card-rise 0.35s ease ${i * 0.07}s both` }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: 12, flexShrink: 0,
              background: `linear-gradient(135deg, ${feature.tagColor}22, ${feature.tagColor}0a)`,
              border: `1.5px solid ${feature.tagColor}28`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: feature.tagColor,
              boxShadow: `0 4px 14px ${feature.tagColor}18`,
            }}>
              <File size={17} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: 'Syne', fontWeight: 700, fontSize: '0.84rem',
                color: '#111827',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>{pdf.display_name}</div>
              <div style={{ fontFamily: 'DM Sans', fontSize: '0.71rem', color: '#9CA3AF', marginTop: '0.15rem' }}>
                PDF document
              </div>
            </div>
            <div style={{
              width: 28, height: 28, borderRadius: 8, flexShrink: 0,
              background: `linear-gradient(135deg, ${feature.tagColor}15, ${feature.tagColor}08)`,
              border: `1px solid ${feature.tagColor}25`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: feature.tagColor, fontSize: '0.8rem', fontWeight: 700,
            }}>→</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Side Panel ────────────────────────────────────────────────────────────
// KEY FIX: fetches PDFs from the backend on mount so page-reload always works.
function SidePanel({ feature, sessionId, uploads: storeuploads, onClose }) {
  const [step, setStep] = useState('pick');
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [data, setData] = useState(null);
  const [closing, setClosing] = useState(false);
  // pdfs is the merged list of backend + store files
  const [pdfs, setPdfs] = useState([]);
  const [pdfsLoading, setPdfsLoading] = useState(true);
  const { setUploads } = useChatStore();

  // ── Fetch PDFs from backend on every open ──────────────────────────────
  useEffect(() => {
    if (!sessionId) {
      setPdfsLoading(false);
      return;
    }
    setPdfsLoading(true);
    fetch(`/upload/files/${sessionId}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
      .then(data => {
        const backendFiles = Array.isArray(data?.files) ? data.files : [];
        // Normalise to { filename, display_name }
        const normalised = backendFiles.map(name => ({ filename: name, display_name: name }));

        if (normalised.length > 0) {
          // Sync back into the store so the rest of the app is up to date
          setUploads(normalised);
          setPdfs(normalised);
        } else {
          // Fall back to whatever is in the store
          const storeList = (storeuploads || []).map(f => ({
            filename: f.filename || f.name || String(f),
            display_name: f.filename || f.name || String(f),
          }));
          setPdfs(storeList);
        }
      })
      .catch(() => {
        // Network error – fall back to store
        const storeList = (storeuploads || []).map(f => ({
          filename: f.filename || f.name || String(f),
          display_name: f.filename || f.name || String(f),
        }));
        setPdfs(storeList);
      })
      .finally(() => {
        setPdfsLoading(false);
      });
  }, [sessionId]); // eslint-disable-line

  // Auto-select when there's exactly 1 PDF and we've finished loading
  useEffect(() => {
    if (!pdfsLoading && pdfs.length === 1) {
      handlePdfSelect(pdfs[0]);
    }
  }, [pdfsLoading, pdfs]); // eslint-disable-line

  const handlePdfSelect = (pdf) => {
    setSelectedPdf(pdf);
    setStep('loading');

    const fn = pdf.filename || null;
    const apiMap = {
      summarize:   () => summarize(sessionId, fn),
      quiz:        () => generateQuiz(sessionId, fn),
      flashcards:  () => generateFlashcards(sessionId, fn),
      notes:       () => generateNotes(sessionId, fn),
    };

    apiMap[feature.id]?.()
      .then(d => { setData(d); setStep('result'); })
      .catch(err => { toast.error(err?.message || `${feature.label} failed`); handleClose(); });
  };

  const handleClose = () => {
    setClosing(true);
    setTimeout(onClose, 300);
  };

  const handleBack = () => {
    setStep('pick');
    setSelectedPdf(null);
    setData(null);
  };

  const renderContent = () => {
    if (step === 'pick') {
      if (pdfsLoading) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', paddingTop: '3rem' }}>
          <Loader color={feature.tagColor} size={36} />
          <div style={{ fontFamily: 'DM Sans', fontSize: '0.8rem', color: '#9CA3AF' }}>
            Loading your documents…
          </div>
        </div>
      );
      return <PDFPickerInPanel feature={feature} pdfs={pdfs} onSelect={handlePdfSelect} />;
    }
    if (step === 'loading') return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', paddingTop: '4rem' }}>
        <div style={{ position: 'relative' }}>
          <Loader color={feature.tagColor} size={44} />
          <div style={{
            position: 'absolute', inset: -8, borderRadius: '50%',
            border: `2px solid ${feature.tagColor}18`,
            animation: 'glow-pulse 1.5s ease-in-out infinite',
          }} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '0.92rem', color: '#111827', marginBottom: '0.35rem' }}>
            Generating {feature.label}…
          </div>
          <div style={{ fontFamily: 'DM Sans', fontSize: '0.78rem', color: '#9CA3AF' }}>
            AI is analysing your document
          </div>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {[0,1,2].map(i => (
            <div key={i} style={{
              width: 7, height: 7, borderRadius: '50%',
              background: feature.tagColor,
              animation: `glow-pulse 1.2s ease-in-out ${i * 0.25}s infinite`,
            }} />
          ))}
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
        background: 'rgba(10,10,20,0.35)',
        backdropFilter: 'blur(6px)',
        opacity: closing ? 0 : 1,
        transition: 'opacity 0.3s ease',
      }} />

      <div className={closing ? 'panel-closing' : 'panel-overlay'} style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 400, maxWidth: '94vw', zIndex: 201,
        background: 'rgba(255,255,255,0.96)',
        backdropFilter: 'blur(40px)',
        borderLeft: `1px solid ${feature.tagColor}20`,
        boxShadow: `-12px 0 60px ${feature.glow}, -2px 0 20px rgba(0,0,0,0.06)`,
        display: 'flex', flexDirection: 'column',
        borderRadius: '28px 0 0 28px', overflow: 'hidden',
      }}>
        <div style={{ height: 4, background: feature.gradient, flexShrink: 0,
          boxShadow: `0 2px 12px ${feature.glow}` }} />

        <div style={{
          padding: '1.3rem 1.4rem 1rem', flexShrink: 0,
          background: feature.bg,
          borderBottom: `1px solid ${feature.tagColor}15`,
          position: 'relative', overflow: 'hidden',
        }}>
          <AmbientOrbs orb1={feature.orb1} orb2={feature.orb2} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              {step === 'result' && (
                <button onClick={handleBack} style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: `${feature.tagColor}15`,
                  border: `1px solid ${feature.tagColor}25`,
                  cursor: 'pointer', color: feature.tagColor,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s', flexShrink: 0,
                }}>
                  <ChevronLeft size={15} />
                </button>
              )}
              <div style={{
                width: 44, height: 44, borderRadius: 14,
                background: feature.gradient,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 6px 20px ${feature.glow}`,
                fontSize: '1.3rem', flexShrink: 0,
              }}>{feature.emoji}</div>
              <div>
                <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '1.05rem', color: '#111827' }}>
                  {feature.label}
                </div>
                <div style={{
                  fontFamily: 'DM Sans', fontSize: '0.73rem', color: '#6B7280',
                  maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {step === 'result' ? (selectedPdf?.display_name || feature.desc) : feature.desc}
                </div>
              </div>
            </div>
            <button onClick={handleClose} style={{
              width: 34, height: 34, borderRadius: '50%',
              background: 'rgba(0,0,0,0.05)', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#9CA3AF', transition: 'all 0.2s', flexShrink: 0,
            }}
              onMouseEnter={e => { e.currentTarget.style.background='rgba(239,68,68,0.1)'; e.currentTarget.style.color='#EF4444'; }}
              onMouseLeave={e => { e.currentTarget.style.background='rgba(0,0,0,0.05)'; e.currentTarget.style.color='#9CA3AF'; }}
            ><X size={15} /></button>
          </div>

          {step !== 'pick' && (
            <div style={{
              display: 'flex', gap: '4px', marginTop: '0.85rem',
              position: 'relative', zIndex: 1,
            }}>
              {['pick', 'loading', 'result'].map((s, si) => {
                const steps = ['pick', 'loading', 'result'];
                const curIdx = steps.indexOf(step);
                const isActive = si <= curIdx;
                return (
                  <div key={s} style={{
                    flex: 1, height: 3, borderRadius: 99,
                    background: isActive ? feature.gradient : 'rgba(0,0,0,0.08)',
                    transition: 'background 0.4s ease',
                    boxShadow: isActive ? `0 0 6px ${feature.glow}` : 'none',
                  }} />
                );
              })}
            </div>
          )}
        </div>

        <div className="sidebar-scroll" style={{ flex: 1, overflowY: 'auto', padding: '1.4rem' }}>
          {renderContent()}
        </div>
      </div>
    </>
  );
}

// ── Dock Card ─────────────────────────────────────────────────────────────
function DockCard({ feature, index, onClick, active }) {
  const [hovered, setHovered] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pressed, setPressed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80 + index * 100);
    return () => clearTimeout(t);
  }, [index]);

  return (
    <div
      className="feat-card"
      onClick={() => { setPressed(true); setTimeout(() => setPressed(false), 200); onClick(feature); }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered || active ? feature.bg : 'rgba(255,255,255,0.82)',
        boxShadow: active
          ? `0 12px 40px ${feature.glow}, 0 4px 12px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)`
          : hovered
          ? `0 16px 48px ${feature.glow}, 0 4px 16px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.9)`
          : '0 2px 14px rgba(108,99,255,0.07), inset 0 1px 0 rgba(255,255,255,0.9)',
        border: `1.5px solid ${active ? feature.tagColor + '50' : hovered ? feature.tagColor + '30' : 'rgba(108,99,255,0.09)'}`,
        padding: '1.2rem 1.1rem 1rem',
        opacity: mounted ? 1 : 0,
        transform: mounted
          ? pressed ? 'translateY(-2px) scale(0.98)'
          : hovered ? 'translateY(-8px) scale(1.03)'
          : active  ? 'translateY(-4px) scale(1.01)'
          : 'translateY(0) scale(1)'
          : 'translateY(30px) scale(0.88)',
        transition: `
          opacity 0.5s ease ${index * 0.1}s,
          transform 0.38s cubic-bezier(0.34,1.56,0.64,1),
          box-shadow 0.3s ease,
          background 0.25s ease,
          border-color 0.25s ease
        `,
        backdropFilter: 'blur(20px)',
      }}
    >
      {(hovered || active) && <AmbientOrbs orb1={feature.orb1} orb2={feature.orb2} />}

      {active && (
        <div style={{
          position: 'absolute', inset: -1, borderRadius: 22,
          border: `2px solid ${feature.tagColor}35`,
          animation: 'glow-pulse 2.5s ease-in-out infinite',
          pointerEvents: 'none', zIndex: 2,
        }} />
      )}

      <div style={{
        width: 48, height: 48, borderRadius: 16,
        background: hovered || active ? feature.gradient : `linear-gradient(135deg, ${feature.tagColor}22, ${feature.tagColor}10)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '0.85rem',
        boxShadow: hovered || active ? `0 8px 24px ${feature.glow}` : `0 4px 12px ${feature.tagColor}20`,
        fontSize: '1.3rem',
        transition: 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
        transform: hovered ? 'scale(1.15) rotate(-6deg)' : pressed ? 'scale(0.92)' : 'scale(1) rotate(0)',
        position: 'relative', zIndex: 2,
      }}>{feature.emoji}</div>

      <div style={{
        fontFamily: 'Syne', fontWeight: 800, fontSize: '0.94rem',
        color: '#111827', marginBottom: '0.3rem',
        position: 'relative', zIndex: 2,
      }}>{feature.label}</div>

      <div style={{
        fontFamily: 'DM Sans', fontSize: '0.75rem',
        color: '#6B7280', lineHeight: 1.5, marginBottom: '0.8rem',
        position: 'relative', zIndex: 2,
      }}>{feature.desc}</div>

      <div style={{
        display: 'inline-flex', alignItems: 'center',
        background: `${feature.tagColor}14`,
        border: `1px solid ${feature.tagColor}28`,
        borderRadius: 999, padding: '3px 10px',
        fontSize: '0.66rem', fontWeight: 700,
        color: feature.tagColor, fontFamily: 'Syne',
        letterSpacing: '0.05em',
        position: 'relative', zIndex: 2,
        animation: active ? 'float-badge 2s ease-in-out infinite' : 'none',
      }}>{feature.tag}</div>

      <div style={{
        position: 'absolute', bottom: 12, right: 14, zIndex: 2,
        fontSize: '0.68rem', color: feature.tagColor,
        opacity: hovered || active ? 1 : 0,
        transition: 'opacity 0.2s, transform 0.2s',
        transform: hovered ? 'translateX(2px)' : 'translateX(0)',
        fontFamily: 'DM Sans', fontWeight: 700,
        display: 'flex', alignItems: 'center', gap: '0.2rem',
      }}>Open →</div>

      <div style={{
        position: 'absolute', bottom: 0, left: 16, right: 16, height: 2, borderRadius: 99,
        background: feature.gradient,
        opacity: hovered || active ? 0.7 : 0,
        transition: 'opacity 0.3s ease',
      }} />
    </div>
  );
}

// ── Main Export ────────────────────────────────────────────────────────────
export default function FeaturesDock({ sessionId }) {
  const { uploads } = useChatStore();
  const [activeFeature, setActiveFeature] = useState(null);
  const [sectionVisible, setSectionVisible] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setSectionVisible(true); },
      { threshold: 0.1 }
    );
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  const handleCardClick = (feature) => {
    if (!sessionId) { toast.error('Start a session first.'); return; }
    setActiveFeature(feature);
  };

  return (
    <>
      <style>{STYLES}</style>

      <div ref={sectionRef} style={{
        padding: '1.5rem 2rem 1.2rem',
        opacity: sectionVisible ? 1 : 0,
        transform: sectionVisible ? 'translateY(0)' : 'translateY(35px)',
        transition: 'opacity 0.65s ease, transform 0.65s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', marginBottom: '1.1rem' }}>
          <div style={{ height: 1, flex: 1, background: 'linear-gradient(90deg, transparent, rgba(108,99,255,0.18))' }} />
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            fontFamily: 'Syne', fontSize: '0.66rem', fontWeight: 800,
            letterSpacing: '0.14em', color: '#9CA3AF', textTransform: 'uppercase',
          }}>
            <Zap size={10} style={{ color: '#6C63FF' }} />
            AI Tools
          </div>
          <div style={{ height: 1, flex: 1, background: 'linear-gradient(90deg, rgba(108,99,255,0.18), transparent)' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.8rem' }}>
          {FEATURES.map((f, i) => (
            <DockCard
              key={f.id} feature={f} index={i}
              active={activeFeature?.id === f.id}
              onClick={handleCardClick}
            />
          ))}
        </div>
      </div>

      {activeFeature && (
        <SidePanel
          feature={activeFeature}
          sessionId={sessionId}
          uploads={uploads}
          onClose={() => setActiveFeature(null)}
        />
      )}
    </>
  );
}