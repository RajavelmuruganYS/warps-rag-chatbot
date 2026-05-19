import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Upload, FileText, MessageSquare, BookOpen, Zap, Star,
  Clock, Filter, Grid, List, ChevronDown, Plus, Folder, FolderPlus,
  Tag, MoreHorizontal, Trash2, ExternalLink, Download, Sparkles,
  Brain, FlipHorizontal, ClipboardList, StickyNote, TrendingUp,
  Calendar, Hash, X, Check, AlertCircle, Archive,
} from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import useChatStore from '../store/chatStore';
import toast from 'react-hot-toast';

// ─────────────────────────────────────────────────────────────
// Constants & mock data helpers
// ─────────────────────────────────────────────────────────────
const ITEM_TYPES = {
  chat:      { icon: <MessageSquare size={14} />, label: 'Chat',       color: '#6C63FF', bg: 'rgba(108,99,255,0.1)'  },
  document:  { icon: <FileText      size={14} />, label: 'Document',   color: '#0EA5E9', bg: 'rgba(14,165,233,0.1)'  },
  summary:   { icon: <Sparkles      size={14} />, label: 'Summary',    color: '#10B981', bg: 'rgba(16,185,129,0.1)'  },
  flashcard: { icon: <FlipHorizontal size={14}/>, label: 'Flashcards', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)'  },
  quiz:      { icon: <ClipboardList size={14} />, label: 'Quiz',       color: '#EC4899', bg: 'rgba(236,72,153,0.1)'  },
  note:      { icon: <StickyNote    size={14} />, label: 'Note',       color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)'  },
};

const TABS = [
  { id: 'all',        label: 'All',        icon: <Grid size={14} />         },
  { id: 'chat',       label: 'Chats',      icon: <MessageSquare size={14} /> },
  { id: 'document',   label: 'Documents',  icon: <FileText size={14} />      },
  { id: 'summary',    label: 'Summaries',  icon: <Sparkles size={14} />      },
  { id: 'flashcard',  label: 'Flashcards', icon: <FlipHorizontal size={14} />},
  { id: 'quiz',       label: 'Quizzes',    icon: <ClipboardList size={14} /> },
  { id: 'note',       label: 'Notes',      icon: <StickyNote size={14} />    },
  { id: 'starred',    label: 'Starred',    icon: <Star size={14} />          },
];

const SORT_OPTIONS = [
  { value: 'newest',   label: 'Newest first'   },
  { value: 'oldest',   label: 'Oldest first'   },
  { value: 'name',     label: 'Name A–Z'       },
  { value: 'type',     label: 'By type'        },
];

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7)  return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ─────────────────────────────────────────────────────────────
// Animated background (matches Chat.jsx exactly)
// ─────────────────────────────────────────────────────────────
function LibraryBackground() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    const palette = ['108,99,255', '157,235,255', '196,165,253', '99,179,255'];
    const resize = () => {
      canvas.width  = canvas.offsetWidth  * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener('resize', resize);
    const W = () => canvas.offsetWidth;
    const H = () => canvas.offsetHeight;
    const orbs = Array.from({ length: 4 }, () => ({
      x: Math.random() * W(), y: Math.random() * H(),
      r: Math.random() * 180 + 80,
      dx: (Math.random() - 0.5) * 0.15, dy: (Math.random() - 0.5) * 0.15,
      color: palette[Math.floor(Math.random() * palette.length)],
      alpha: Math.random() * 0.045 + 0.015,
    }));
    const draw = () => {
      ctx.clearRect(0, 0, W(), H());
      orbs.forEach(o => {
        const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
        g.addColorStop(0, `rgba(${o.color},${o.alpha})`);
        g.addColorStop(1, `rgba(${o.color},0)`);
        ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
        ctx.fillStyle = g; ctx.fill();
        o.x += o.dx; o.y += o.dy;
        if (o.x < -o.r) o.x = W() + o.r; if (o.x > W() + o.r) o.x = -o.r;
        if (o.y < -o.r) o.y = H() + o.r; if (o.y > H() + o.r) o.y = -o.r;
      });
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
// Upload Drop Zone (inline, not modal)
// ─────────────────────────────────────────────────────────────
function UploadBanner({ onFile }) {
  const [drag, setDrag] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const handleFile = async (file) => {
    if (!file || file.type !== 'application/pdf') { toast.error('Only PDF files are supported'); return; }
    setUploading(true);
    await new Promise(r => setTimeout(r, 1200)); // simulate
    setUploading(false);
    toast.success(`"${file.name}" uploaded!`);
    onFile && onFile(file);
  };

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={e => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]); }}
      onClick={() => fileRef.current?.click()}
      style={{
        border: `2px dashed ${drag ? '#6C63FF' : 'rgba(108,99,255,0.28)'}`,
        borderRadius: '1.25rem',
        padding: '1.6rem 2rem',
        cursor: 'pointer',
        background: drag ? 'rgba(108,99,255,0.06)' : 'rgba(255,255,255,0.55)',
        backdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', gap: '1.2rem',
        transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
        transform: drag ? 'scale(1.01)' : 'scale(1)',
        boxShadow: drag ? '0 8px 32px rgba(108,99,255,0.15)' : '0 2px 12px rgba(108,99,255,0.06)',
      }}
    >
      <input ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
      <div style={{
        width: 52, height: 52, borderRadius: '1rem', flexShrink: 0,
        background: 'linear-gradient(135deg, rgba(108,99,255,0.15), rgba(157,235,255,0.12))',
        border: '1.5px solid rgba(108,99,255,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'transform 0.3s',
        transform: drag ? 'translateY(-4px)' : 'translateY(0)',
      }}>
        <Upload size={22} color="#6C63FF" />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '0.92rem', color: '#111827' }}>
          {uploading ? 'Uploading…' : 'Drop a PDF here or click to upload'}
        </div>
        <div style={{ fontFamily: 'DM Sans', fontSize: '0.78rem', color: '#9CA3AF', marginTop: '0.2rem' }}>
          Supports scanned PDFs, research papers, slides, books
        </div>
        {uploading && (
          <div style={{ marginTop: '0.5rem', height: 4, background: 'rgba(108,99,255,0.12)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: '60%', borderRadius: 99,
              background: 'linear-gradient(90deg, #6C63FF, #9DEBFF)',
              animation: 'lib-progress 1.2s ease-in-out infinite',
            }} />
          </div>
        )}
      </div>
      <div style={{
        padding: '0.45rem 1rem', borderRadius: '0.75rem',
        background: 'linear-gradient(135deg, #6C63FF, #8A7DFF)',
        color: 'white', fontFamily: 'Syne', fontWeight: 700, fontSize: '0.78rem',
        boxShadow: '0 4px 14px rgba(108,99,255,0.35)',
        display: 'flex', alignItems: 'center', gap: '0.35rem',
      }}>
        <Plus size={13} /> Upload PDF
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Folder chip
// ─────────────────────────────────────────────────────────────
function FolderChip({ folder, selected, onClick, count }) {
  return (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: '0.45rem',
      padding: '0.4rem 0.85rem',
      borderRadius: '0.75rem',
      border: `1.5px solid ${selected ? folder.color + '55' : 'rgba(108,99,255,0.13)'}`,
      background: selected ? folder.color + '12' : 'rgba(255,255,255,0.65)',
      cursor: 'pointer',
      fontFamily: 'DM Sans', fontWeight: selected ? 700 : 500,
      fontSize: '0.8rem',
      color: selected ? folder.color : '#4B5563',
      transition: 'all 0.2s cubic-bezier(0.34,1.56,0.64,1)',
      transform: selected ? 'translateY(-1px)' : 'translateY(0)',
      boxShadow: selected ? `0 4px 14px ${folder.color}22` : 'none',
    }}>
      <span style={{ fontSize: '0.85rem' }}>{folder.emoji}</span>
      {folder.name}
      <span style={{
        fontSize: '0.68rem', fontWeight: 700,
        background: selected ? folder.color + '20' : 'rgba(108,99,255,0.08)',
        color: selected ? folder.color : '#9CA3AF',
        borderRadius: 99, padding: '1px 6px',
      }}>{count}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Library Item Card (grid view)
// ─────────────────────────────────────────────────────────────
function ItemCard({ item, onStar, onDelete, onOpen, onQuickAction, delay }) {
  const [hovered, setHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const type = ITEM_TYPES[item.type] || ITEM_TYPES.chat;
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'rgba(255,255,255,0.98)' : 'rgba(255,255,255,0.82)',
        backdropFilter: 'blur(20px)',
        borderRadius: '1.2rem',
        border: `1.5px solid ${hovered ? type.color + '30' : 'rgba(108,99,255,0.1)'}`,
        padding: '1.15rem',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        transform: hovered ? 'translateY(-3px) scale(1.01)' : 'translateY(0) scale(1)',
        boxShadow: hovered
          ? `0 12px 32px ${type.color}18, 0 2px 8px rgba(0,0,0,0.06)`
          : '0 2px 10px rgba(108,99,255,0.05)',
        position: 'relative',
        animation: `lib-card-in 0.45s cubic-bezier(0.34,1.56,0.64,1) ${delay}ms both`,
        display: 'flex', flexDirection: 'column', gap: '0.75rem',
      }}
      onClick={() => onOpen(item)}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.7rem' }}>
        <div style={{
          width: 40, height: 40, borderRadius: '0.9rem', flexShrink: 0,
          background: type.bg,
          border: `1px solid ${type.color}25`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: type.color,
        }}>
          {React.cloneElement(ITEM_TYPES[item.type]?.icon || <FileText size={18} />, { size: 18 })}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: 'Syne', fontWeight: 700, fontSize: '0.88rem',
            color: '#111827', lineHeight: 1.35,
            overflow: 'hidden', textOverflow: 'ellipsis',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          }}>{item.title}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.25rem' }}>
            <span style={{
              fontFamily: 'DM Sans', fontSize: '0.68rem', fontWeight: 700,
              color: type.color, background: type.bg,
              border: `1px solid ${type.color}25`,
              borderRadius: 999, padding: '1px 7px',
            }}>{type.label}</span>
            {item.aiGenerated && (
              <span style={{
                fontFamily: 'DM Sans', fontSize: '0.68rem', fontWeight: 700,
                color: '#6C63FF', background: 'rgba(108,99,255,0.08)',
                border: '1px solid rgba(108,99,255,0.2)',
                borderRadius: 999, padding: '1px 7px',
                display: 'flex', alignItems: 'center', gap: '3px',
              }}>
                <Sparkles size={9} /> AI
              </span>
            )}
          </div>
        </div>
        {/* Star + menu */}
        <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
          <button onClick={() => onStar(item.id)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '0.2rem', borderRadius: '0.4rem',
            color: item.starred ? '#F59E0B' : '#D1D5DB',
            transition: 'all 0.2s',
            opacity: hovered || item.starred ? 1 : 0,
          }}>
            <Star size={14} fill={item.starred ? '#F59E0B' : 'none'} />
          </button>
          <div ref={menuRef} style={{ position: 'relative' }}>
            <button onClick={() => setMenuOpen(v => !v)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '0.2rem', borderRadius: '0.4rem', color: '#9CA3AF',
              opacity: hovered || menuOpen ? 1 : 0,
              transition: 'opacity 0.2s',
            }}>
              <MoreHorizontal size={14} />
            </button>
            {menuOpen && (
              <div style={{
                position: 'absolute', top: '110%', right: 0,
                background: 'white', borderRadius: '0.9rem',
                border: '1px solid rgba(108,99,255,0.15)',
                boxShadow: '0 12px 32px rgba(108,99,255,0.18)',
                padding: '0.4rem', zIndex: 50, minWidth: 150,
                animation: 'lib-card-in 0.2s ease',
              }}>
                {[
                  { icon: <ExternalLink size={13} />, label: 'Open', action: () => { onOpen(item); setMenuOpen(false); } },
                  { icon: <Download size={13} />,     label: 'Export', action: () => { toast.success('Exported!'); setMenuOpen(false); } },
                  { icon: <Archive size={13} />,      label: 'Archive', action: () => { toast.success('Archived'); setMenuOpen(false); } },
                  { icon: <Trash2 size={13} />,       label: 'Delete', action: () => { onDelete(item.id); setMenuOpen(false); }, danger: true },
                ].map(({ icon, label, action, danger }) => (
                  <button key={label} onClick={action} style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.5rem 0.7rem', borderRadius: '0.6rem', border: 'none',
                    background: 'none', cursor: 'pointer', textAlign: 'left',
                    fontFamily: 'DM Sans', fontSize: '0.8rem',
                    color: danger ? '#EF4444' : '#374151',
                    transition: 'background 0.15s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = danger ? 'rgba(239,68,68,0.06)' : 'rgba(108,99,255,0.05)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    {icon} {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preview */}
      {item.preview && (
        <p style={{
          fontFamily: 'DM Sans', fontSize: '0.78rem', color: '#6B7280',
          lineHeight: 1.55, margin: 0,
          overflow: 'hidden', textOverflow: 'ellipsis',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        }}>{item.preview}</p>
      )}

      {/* Real insight chips for chat sessions */}
      {item.type === 'chat' && (item.msgCount != null || item.docCount != null) && (
        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
          {item.msgCount != null && (
            <span style={{
              display: 'flex', alignItems: 'center', gap: '0.3rem',
              fontFamily: 'DM Sans', fontSize: '0.69rem', fontWeight: 600,
              color: '#6C63FF', background: 'rgba(108,99,255,0.07)',
              borderRadius: 999, padding: '2px 8px',
              border: '1px solid rgba(108,99,255,0.15)',
            }}>
              <MessageSquare size={10} /> {item.msgCount} msg{item.msgCount !== 1 ? 's' : ''}
            </span>
          )}
          {item.docCount != null && item.docCount > 0 && (
            <span style={{
              display: 'flex', alignItems: 'center', gap: '0.3rem',
              fontFamily: 'DM Sans', fontSize: '0.69rem', fontWeight: 600,
              color: '#0EA5E9', background: 'rgba(14,165,233,0.07)',
              borderRadius: 999, padding: '2px 8px',
              border: '1px solid rgba(14,165,233,0.15)',
            }}>
              <FileText size={10} /> {item.docCount} PDF{item.docCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      )}

      {/* Tags */}
      {item.tags?.length > 0 && (
        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
          {item.tags.slice(0, 3).map(tag => (
            <span key={tag} style={{
              fontFamily: 'DM Sans', fontSize: '0.68rem', fontWeight: 600,
              color: '#6C63FF', background: 'rgba(108,99,255,0.07)',
              borderRadius: 999, padding: '2px 8px',
              border: '1px solid rgba(108,99,255,0.15)',
            }}>#{tag}</span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#9CA3AF' }}>
          <Clock size={11} />
          <span style={{ fontFamily: 'DM Sans', fontSize: '0.72rem' }}>{timeAgo(item.updatedAt)}</span>
        </div>
        {/* Hover quick actions */}
        <div style={{
          display: 'flex', gap: '0.3rem',
          opacity: hovered ? 1 : 0,
          transform: hovered ? 'translateY(0)' : 'translateY(4px)',
          transition: 'all 0.2s cubic-bezier(0.34,1.56,0.64,1)',
        }} onClick={e => e.stopPropagation()}>
          {item.type === 'document' && (
            <>
              <QuickBtn label="Quiz" color="#EC4899" onClick={() => onQuickAction(item, 'quiz')} />
              <QuickBtn label="Summary" color="#10B981" onClick={() => onQuickAction(item, 'summary')} />
            </>
          )}
          {item.type === 'chat' && (
            <QuickBtn label="Ask AI" color="#6C63FF" onClick={() => onQuickAction(item, 'ask')} />
          )}
        </div>
      </div>
    </div>
  );
}

function QuickBtn({ label, color, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: '0.22rem 0.6rem', borderRadius: '0.5rem', border: 'none',
      background: color + '14', color, cursor: 'pointer',
      fontFamily: 'Syne', fontWeight: 700, fontSize: '0.67rem',
      transition: 'all 0.15s',
    }}
      onMouseEnter={e => { e.currentTarget.style.background = color + '28'; }}
      onMouseLeave={e => { e.currentTarget.style.background = color + '14'; }}
    >{label}</button>
  );
}

// ─────────────────────────────────────────────────────────────
// List row view
// ─────────────────────────────────────────────────────────────
function ItemRow({ item, onStar, onDelete, onOpen, index }) {
  const [hovered, setHovered] = useState(false);
  const type = ITEM_TYPES[item.type] || ITEM_TYPES.chat;
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onOpen(item)}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.9rem',
        padding: '0.85rem 1rem',
        borderRadius: '0.9rem',
        background: hovered ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.6)',
        border: `1px solid ${hovered ? type.color + '25' : 'rgba(108,99,255,0.08)'}`,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        animation: `lib-card-in 0.35s ease ${index * 40}ms both`,
      }}
    >
      <div style={{
        width: 34, height: 34, borderRadius: '0.7rem', flexShrink: 0,
        background: type.bg, display: 'flex', alignItems: 'center',
        justifyContent: 'center', color: type.color,
      }}>
        {React.cloneElement(ITEM_TYPES[item.type]?.icon || <FileText size={16} />, { size: 16 })}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: 'Syne', fontWeight: 700, fontSize: '0.85rem', color: '#111827',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{item.title}</div>
        {item.preview && (
          <div style={{
            fontFamily: 'DM Sans', fontSize: '0.75rem', color: '#9CA3AF',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{item.preview}</div>
        )}
      </div>

      <span style={{
        fontFamily: 'DM Sans', fontSize: '0.68rem', fontWeight: 700,
        color: type.color, background: type.bg, border: `1px solid ${type.color}22`,
        borderRadius: 999, padding: '2px 8px', flexShrink: 0,
      }}>{type.label}</span>

      <span style={{ fontFamily: 'DM Sans', fontSize: '0.72rem', color: '#9CA3AF', flexShrink: 0, minWidth: 55, textAlign: 'right' }}>
        {timeAgo(item.updatedAt)}
      </span>

      <div style={{ display: 'flex', gap: '0.25rem', opacity: hovered ? 1 : 0, transition: 'opacity 0.2s' }} onClick={e => e.stopPropagation()}>
        <button onClick={() => onStar(item.id)} style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem',
          color: item.starred ? '#F59E0B' : '#D1D5DB',
        }}>
          <Star size={13} fill={item.starred ? '#F59E0B' : 'none'} />
        </button>
        <button onClick={() => onDelete(item.id)} style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem', color: '#EF4444',
        }}>
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Stats bar
// ─────────────────────────────────────────────────────────────
function StatsBar({ items, sessions }) {
  const chatItems     = items.filter(i => i.type === 'chat');
  const docItems      = items.filter(i => i.type === 'document');
  const starred       = items.filter(i => i.starred).length;
  const totalPdfs     = (sessions || []).reduce((acc, s) => acc + (s.documentCount ?? s.document_count ?? s.uploads?.length ?? 0), 0);
  const totalMessages = (sessions || []).reduce((acc, s) => acc + (s.messageCount ?? s.message_count ?? 0), 0);

  const stats = [
    { label: 'Sessions',    value: chatItems.length, color: '#6C63FF', icon: <MessageSquare size={14} /> },
    { label: 'PDFs Uploaded', value: totalPdfs,      color: '#0EA5E9', icon: <FileText size={14} />      },
    { label: 'Messages',    value: totalMessages,    color: '#8B5CF6', icon: <TrendingUp size={14} />     },
    { label: 'Starred',     value: starred,           color: '#F59E0B', icon: <Star size={14} />          },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
      {stats.map(({ label, value, color, icon }, i) => (
        <div key={label} style={{
          background: 'rgba(255,255,255,0.75)',
          backdropFilter: 'blur(16px)',
          borderRadius: '1rem',
          border: `1px solid ${color}18`,
          padding: '0.9rem 1.1rem',
          display: 'flex', alignItems: 'center', gap: '0.7rem',
          boxShadow: `0 2px 12px ${color}0A`,
          animation: `lib-card-in 0.4s ease ${i * 60}ms both`,
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: '0.75rem',
            background: color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color,
          }}>{icon}</div>
          <div>
            <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '1.25rem', color: '#111827', lineHeight: 1 }}>{value}</div>
            <div style={{ fontFamily: 'DM Sans', fontSize: '0.72rem', color: '#9CA3AF', marginTop: '0.15rem' }}>{label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// New Folder Modal
// ─────────────────────────────────────────────────────────────
const FOLDER_EMOJIS = ['📁','📚','🧠','🎯','💡','🔬','🏫','💼','🗂️','✨','🌱','⚡'];
const FOLDER_COLORS = ['#6C63FF','#EC4899','#10B981','#F59E0B','#0EA5E9','#8B5CF6','#EF4444'];

function NewFolderModal({ onClose, onCreate }) {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('📁');
  const [color, setColor] = useState('#6C63FF');

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: 'rgba(15,15,26,0.4)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'white', borderRadius: '1.5rem', padding: '1.75rem',
        width: 380, maxWidth: '90vw',
        boxShadow: '0 24px 80px rgba(108,99,255,0.22)',
        border: '1px solid rgba(108,99,255,0.15)',
        animation: 'lib-card-in 0.3s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.4rem' }}>
          <FolderPlus size={20} color="#6C63FF" />
          <h3 style={{ fontFamily: 'Syne', fontWeight: 800, color: '#111827', margin: 0 }}>New Collection</h3>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontFamily: 'DM Sans', fontSize: '0.77rem', fontWeight: 700, color: '#6B7280', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Name</label>
          <input
            autoFocus
            value={name} onChange={e => setName(e.target.value)}
            placeholder="e.g. Semester 5, AI Research…"
            style={{
              width: '100%', padding: '0.7rem 1rem',
              border: '1.5px solid rgba(108,99,255,0.2)',
              borderRadius: '0.85rem', fontFamily: 'DM Sans', fontSize: '0.88rem',
              outline: 'none', boxSizing: 'border-box', color: '#111827',
            }}
            onFocus={e => e.target.style.borderColor = '#6C63FF'}
            onBlur={e => e.target.style.borderColor = 'rgba(108,99,255,0.2)'}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontFamily: 'DM Sans', fontSize: '0.77rem', fontWeight: 700, color: '#6B7280', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Icon</label>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {FOLDER_EMOJIS.map(e => (
              <div key={e} onClick={() => setEmoji(e)} style={{
                width: 36, height: 36, borderRadius: '0.65rem', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem',
                background: emoji === e ? `${color}15` : 'rgba(108,99,255,0.05)',
                border: `2px solid ${emoji === e ? color : 'transparent'}`,
                transition: 'all 0.15s',
              }}>{e}</div>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '1.4rem' }}>
          <label style={{ display: 'block', fontFamily: 'DM Sans', fontSize: '0.77rem', fontWeight: 700, color: '#6B7280', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Color</label>
          <div style={{ display: 'flex', gap: '0.45rem' }}>
            {FOLDER_COLORS.map(c => (
              <div key={c} onClick={() => setColor(c)} style={{
                width: 26, height: 26, borderRadius: '50%', background: c, cursor: 'pointer',
                outline: color === c ? `2px solid ${c}` : '2px solid transparent',
                outlineOffset: '2px', transition: 'all 0.15s',
                transform: color === c ? 'scale(1.15)' : 'scale(1)',
              }} />
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '0.65rem', borderRadius: '0.85rem',
            border: '1.5px solid rgba(108,99,255,0.2)', background: 'none',
            fontFamily: 'DM Sans', fontSize: '0.85rem', color: '#6B7280', cursor: 'pointer',
          }}>Cancel</button>
          <button
            onClick={() => { if (!name.trim()) return; onCreate({ name: name.trim(), emoji, color }); onClose(); }}
            style={{
              flex: 1, padding: '0.65rem', borderRadius: '0.85rem',
              background: 'linear-gradient(135deg, #6C63FF, #8A7DFF)', border: 'none',
              fontFamily: 'Syne', fontWeight: 700, fontSize: '0.85rem', color: 'white',
              cursor: 'pointer', opacity: name.trim() ? 1 : 0.5,
              boxShadow: '0 4px 14px rgba(108,99,255,0.32)',
            }}
          ><Check size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />Create</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────────────────────
function EmptyState({ tab, onUpload }) {
  const cfg = {
    all:       { emoji: '📂', title: 'Your library is empty', sub: 'Upload a PDF or start a chat to build your knowledge base.' },
    document:  { emoji: '📄', title: 'No documents yet',      sub: 'Upload PDFs to analyze, summarize, and quiz yourself.' },
    chat:      { emoji: '💬', title: 'No chats saved',        sub: 'Start a new chat and your sessions will appear here.' },
    summary:   { emoji: '✨', title: 'No summaries yet',      sub: 'Open a document and click Summarize to generate one.' },
    flashcard: { emoji: '🃏', title: 'No flashcards yet',     sub: 'Generate flashcards from any document in your library.' },
    quiz:      { emoji: '📝', title: 'No quizzes yet',        sub: 'Click Quiz Me on any document to generate questions.' },
    note:      { emoji: '📓', title: 'No notes yet',          sub: 'AI-generated notes from your documents will appear here.' },
    starred:   { emoji: '⭐', title: 'No starred items',      sub: 'Star any item to save it here for quick access.' },
  }[tab] || { emoji: '📂', title: 'Nothing here', sub: '' };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: '1rem', padding: '4rem 2rem',
      animation: 'lib-card-in 0.4s ease',
    }}>
      <div style={{ fontSize: '3.2rem' }}>{cfg.emoji}</div>
      <div style={{ textAlign: 'center' }}>
        <h3 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '1.1rem', color: '#111827', margin: '0 0 0.35rem' }}>{cfg.title}</h3>
        <p style={{ fontFamily: 'DM Sans', fontSize: '0.85rem', color: '#9CA3AF', margin: 0, maxWidth: 320 }}>{cfg.sub}</p>
      </div>
      {(tab === 'all' || tab === 'document') && (
        <button onClick={onUpload} style={{
          padding: '0.6rem 1.4rem', borderRadius: '0.85rem',
          background: 'linear-gradient(135deg, #6C63FF, #8A7DFF)', border: 'none',
          fontFamily: 'Syne', fontWeight: 700, fontSize: '0.83rem', color: 'white', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '0.4rem',
          boxShadow: '0 4px 16px rgba(108,99,255,0.32)',
        }}>
          <Upload size={14} /> Upload PDF
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Library Page
// ─────────────────────────────────────────────────────────────
export default function Library() {
  const navigate = useNavigate();
  // Mirror exactly what Sidebar.jsx does — use setActiveSession + setMessages
  const { sessions, setActiveSession, setMessages } = useChatStore();

  // ── Build items ONLY from real sessions — no demo data ──────
  const buildItemsFromSessions = useCallback(() => {
    return (sessions || []).map(s => {
      const sid    = s.session_id ?? s.id;
      const title  = (s.title && s.title !== 'New Chat') ? s.title : `Session #${sid}`;
      const msgCount  = s.messageCount  ?? s.message_count  ?? null;
      const docCount  = s.documentCount ?? s.document_count ?? s.uploads?.length ?? null;
      const lastMsg   = s.lastMessage   ?? s.last_message   ?? null;

      // Build a real, informative preview line
      let preview = '';
      const parts = [];
      if (msgCount  != null) parts.push(`${msgCount} message${msgCount !== 1 ? 's' : ''}`);
      if (docCount  != null && docCount > 0) parts.push(`${docCount} PDF${docCount !== 1 ? 's' : ''} uploaded`);
      if (parts.length) preview = parts.join(' · ');
      if (lastMsg) preview = preview ? `${preview} — "${lastMsg.slice(0, 70)}…"` : `"${lastMsg.slice(0, 90)}…"`;
      if (!preview) preview = 'Click to open and continue this conversation.';

      // Derive tags from title words (skip generic ones)
      const stopWords = new Set(['new','chat','session','the','a','an','of','to','for','and','with','in','on']);
      const tags = title.split(/[\s_\-]+/)
        .map(w => w.replace(/[^a-zA-Z0-9]/g, '').toLowerCase())
        .filter(w => w.length > 2 && !stopWords.has(w))
        .slice(0, 3);

      return {
        id: `chat-${sid}`,
        type: 'chat',
        title,
        preview,
        tags: tags.length ? tags : ['chat'],
        starred: false,
        aiGenerated: false,
        folder: null,
        updatedAt: s.updatedAt ?? s.updated_at ?? s.createdAt ?? s.created_at ?? new Date().toISOString(),
        msgCount,
        docCount,
        sessionRef: s,
        sessionId: sid,
      };
    });
  }, [sessions]);

  const [items,            setItems]            = useState([]);
  const [activeTab,        setActiveTab]        = useState('all');
  const [viewMode,         setViewMode]         = useState('grid');
  const [searchQuery,      setSearchQuery]      = useState('');
  const [sortBy,           setSortBy]           = useState('newest');
  const [sortOpen,         setSortOpen]         = useState(false);
  const [activeFolder,     setActiveFolder]     = useState(null);
  const [showFolderModal,  setShowFolderModal]  = useState(false);
  const [showUploadBanner, setShowUploadBanner] = useState(true);
  const [folders,          setFolders]          = useState([]);

  const fileRef = useRef(null);
  const sortRef = useRef(null);

  // Close sort dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (sortRef.current && !sortRef.current.contains(e.target)) setSortOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Refresh items when sessions change
  useEffect(() => { setItems(buildItemsFromSessions()); }, [buildItemsFromSessions]);

  // ── Filter + sort ──────────────────────────────────────────
  const filtered = items
    .filter(item => {
      if (activeTab === 'starred') return item.starred;
      if (activeTab !== 'all' && item.type !== activeTab) return false;
      if (activeFolder && item.folder !== activeFolder) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return item.title.toLowerCase().includes(q) ||
          item.preview?.toLowerCase().includes(q) ||
          item.tags?.some(t => t.toLowerCase().includes(q));
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.updatedAt) - new Date(a.updatedAt);
      if (sortBy === 'oldest') return new Date(a.updatedAt) - new Date(b.updatedAt);
      if (sortBy === 'name')   return a.title.localeCompare(b.title);
      if (sortBy === 'type')   return a.type.localeCompare(b.type);
      return 0;
    });

  // ── Navigate to a session — mirrors Sidebar.jsx handleSessionClick exactly ──
  const openSession = (sessionRef) => {
    if (!sessionRef) return;
    setActiveSession(sessionRef);   // sets the full session object
    setMessages([]);                // clears old messages so Chat loads fresh
    navigate('/chat');              // same route Sidebar uses
  };

  // ── Handlers ───────────────────────────────────────────────
  const handleStar = (id) => setItems(prev => prev.map(i => i.id === id ? { ...i, starred: !i.starred } : i));

  const handleDelete = (id) => {
    setItems(prev => prev.filter(i => i.id !== id));
    toast.success('Removed from library');
  };

  const handleOpen = (item) => {
    if (item.type === 'chat' && item.sessionRef) {
      openSession(item.sessionRef);
    } else if (item.type === 'document') {
      toast('Open the chat where this PDF was uploaded to interact with it.', { icon: '📄' });
    } else {
      toast.success(`Opening "${item.title}"…`);
    }
  };

  const handleQuickAction = (item, action) => {
    if (item.sessionRef) {
      openSession(item.sessionRef);
      const hints = {
        ask:     'Chat opened — continue your conversation.',
        quiz:    'Chat opened — click "Quiz Me" in the top bar.',
        summary: 'Chat opened — click "Summarize" in the top bar.',
      };
      toast.success(hints[action] || 'Chat opened!', { duration: 3000 });
    }
  };

  const handleNewFile = (file) => {
    if (!file) return;
    const ext  = file.name.split('.').pop().toUpperCase();
    const size = (file.size / 1024).toFixed(0);
    const newItem = {
      id: `doc-${Date.now()}`,
      type: 'document',
      title: file.name,
      preview: `${ext} · ${size} KB — Ready to analyze. Open a chat and upload this PDF to ask questions, generate summaries, or create a quiz.`,
      tags: [ext.toLowerCase()],
      starred: false,
      aiGenerated: false,
      folder: null,
      updatedAt: new Date().toISOString(),
      sessionRef: null,
    };
    setItems(prev => [newItem, ...prev]);
  };
  const handleCreateFolder = (folderData) => {
    setFolders(prev => [...prev, { id: `f${Date.now()}`, ...folderData }]);
    toast.success(`Collection "${folderData.name}" created!`);
  };

  // Tab counts
  const tabCounts = TABS.reduce((acc, tab) => {
    if (tab.id === 'all')     acc[tab.id] = items.length;
    else if (tab.id === 'starred') acc[tab.id] = items.filter(i => i.starred).length;
    else acc[tab.id] = items.filter(i => i.type === tab.id).length;
    return acc;
  }, {});

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#E8ECFF', overflow: 'hidden' }}>
      <style>{`
        @keyframes lib-card-in { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes topbar-shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        @keyframes lib-progress { 0% { transform: translateX(-100%); } 100% { transform: translateX(250%); } }

        .lib-scroll::-webkit-scrollbar       { width: 4px; }
        .lib-scroll::-webkit-scrollbar-track  { background: transparent; }
        .lib-scroll::-webkit-scrollbar-thumb  { background: rgba(108,99,255,0.2); border-radius: 99px; }

        .tab-pill {
          display: flex; align-items: center; gap: 0.38rem;
          padding: 0.4rem 0.9rem; border-radius: 999px; border: none;
          cursor: pointer; transition: all 0.25s cubic-bezier(0.34,1.56,0.64,1);
          font-family: 'Syne'; font-weight: 700; font-size: 0.78rem;
          white-space: nowrap;
        }
        .tab-pill:hover { transform: translateY(-1px); }
        .search-inp:focus { outline: none; border-color: #6C63FF !important; box-shadow: 0 0 0 3px rgba(108,99,255,0.12) !important; }
      `}</style>

      <Sidebar />

      <main style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        overflow: 'hidden', position: 'relative',
        background: 'radial-gradient(ellipse 70% 50% at 55% 5%, rgba(108,99,255,0.07) 0%, transparent 60%)',
      }}>
        <LibraryBackground />

        {/* ── TOP BAR ────────────────────────────────────────── */}
        <div style={{
          padding: '0.82rem 1.7rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
          background: 'rgba(255,255,255,0.82)',
          backdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(108,99,255,0.11)',
          position: 'relative', zIndex: 10,
          boxShadow: '0 2px 18px rgba(108,99,255,0.09)',
          flexShrink: 0,
        }}>
          {/* shimmer accent */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 2,
            background: 'linear-gradient(90deg, #6C63FF, #9DEBFF, #C4B5FD, #6C63FF)',
            backgroundSize: '200% auto',
            animation: 'topbar-shimmer 4s linear infinite',
          }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: 'linear-gradient(135deg, #6C63FF, #9DEBFF)',
              boxShadow: '0 0 8px rgba(108,99,255,0.65)',
            }} />
            <h2 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '0.94rem', color: '#111827', margin: 0, letterSpacing: '0.01em' }}>
              Library
            </h2>
            <div style={{
              fontFamily: 'DM Sans', fontSize: '0.72rem', fontWeight: 700,
              color: '#6C63FF', background: 'rgba(108,99,255,0.1)',
              border: '1px solid rgba(108,99,255,0.2)', borderRadius: 999, padding: '2px 10px',
            }}>
              {items.length} items
            </div>
          </div>

          {/* Search */}
          <div style={{ flex: 1, maxWidth: 420, position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
            <input
              className="search-inp"
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search titles, tags, content…"
              style={{
                width: '100%', paddingLeft: 34, paddingRight: 12, paddingTop: 8, paddingBottom: 8,
                border: '1.5px solid rgba(108,99,255,0.18)', borderRadius: '0.85rem',
                fontFamily: 'DM Sans', fontSize: '0.83rem', color: '#111827',
                background: 'rgba(255,255,255,0.9)', transition: 'all 0.2s', boxSizing: 'border-box',
              }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} style={{
                position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', display: 'flex',
              }}><X size={13} /></button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center' }}>
            {/* Sort dropdown */}
            <div ref={sortRef} style={{ position: 'relative' }}>
              <button onClick={() => setSortOpen(v => !v)} style={{
                display: 'flex', alignItems: 'center', gap: '0.35rem',
                padding: '0.45rem 0.85rem', borderRadius: '0.75rem',
                border: '1.5px solid rgba(108,99,255,0.18)',
                background: 'rgba(255,255,255,0.8)', cursor: 'pointer',
                fontFamily: 'DM Sans', fontSize: '0.78rem', color: '#6B7280',
              }}>
                <Filter size={12} />
                {SORT_OPTIONS.find(o => o.value === sortBy)?.label}
                <ChevronDown size={11} style={{ transform: sortOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
              </button>
              {sortOpen && (
                <div style={{
                  position: 'absolute', top: '110%', right: 0,
                  background: 'white', borderRadius: '0.9rem',
                  border: '1px solid rgba(108,99,255,0.15)',
                  boxShadow: '0 12px 32px rgba(108,99,255,0.18)',
                  padding: '0.4rem', zIndex: 50, minWidth: 160,
                }}>
                  {SORT_OPTIONS.map(o => (
                    <button key={o.value} onClick={() => { setSortBy(o.value); setSortOpen(false); }} style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem',
                      padding: '0.5rem 0.7rem', borderRadius: '0.6rem', border: 'none',
                      background: sortBy === o.value ? 'rgba(108,99,255,0.08)' : 'none',
                      cursor: 'pointer', fontFamily: 'DM Sans', fontSize: '0.8rem',
                      color: sortBy === o.value ? '#6C63FF' : '#374151', textAlign: 'left',
                    }}>
                      {sortBy === o.value && <Check size={11} />}
                      {o.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Grid / List toggle */}
            <div style={{
              display: 'flex', background: 'rgba(108,99,255,0.07)',
              borderRadius: '0.7rem', padding: '0.2rem', gap: '0.15rem',
            }}>
              {[{ mode: 'grid', icon: <Grid size={13} /> }, { mode: 'list', icon: <List size={13} /> }].map(({ mode, icon }) => (
                <button key={mode} onClick={() => setViewMode(mode)} style={{
                  padding: '0.3rem 0.55rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer',
                  background: viewMode === mode ? 'white' : 'none',
                  color: viewMode === mode ? '#6C63FF' : '#9CA3AF',
                  boxShadow: viewMode === mode ? '0 1px 4px rgba(108,99,255,0.15)' : 'none',
                  transition: 'all 0.2s',
                }}>{icon}</button>
              ))}
            </div>

            {/* Upload */}
            <button
              onClick={() => fileRef.current?.click()}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.35rem',
                padding: '0.45rem 1.05rem', borderRadius: '0.75rem',
                background: 'linear-gradient(135deg, #6C63FF, #8A7DFF)', border: 'none',
                fontFamily: 'Syne', fontWeight: 700, fontSize: '0.78rem', color: 'white',
                cursor: 'pointer', boxShadow: '0 4px 14px rgba(108,99,255,0.32)',
                transition: 'all 0.2s cubic-bezier(0.34,1.56,0.64,1)',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <Upload size={13} /> Upload
            </button>
            <input ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => { handleNewFile(e.target.files[0]); e.target.value = ''; }} />
          </div>
        </div>

        {/* ── SCROLLABLE BODY ─────────────────────────────────── */}
        <div className="lib-scroll" style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 1 }}>
          <div style={{ padding: '1.5rem 1.7rem', maxWidth: 1200, margin: '0 auto' }}>

            {/* Stats bar */}
            <div style={{ marginBottom: '1.25rem' }}>
              <StatsBar items={items} sessions={sessions} />
            </div>

            {/* Upload banner */}
            {showUploadBanner && (
              <div style={{ marginBottom: '1.25rem', position: 'relative' }}>
                <button onClick={() => setShowUploadBanner(false)} style={{
                  position: 'absolute', top: 10, right: 10, background: 'none', border: 'none',
                  cursor: 'pointer', color: '#9CA3AF', zIndex: 2, display: 'flex',
                }}>
                  <X size={14} />
                </button>
                <UploadBanner onFile={handleNewFile} />
              </div>
            )}

            {/* Folders */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '0.82rem', color: '#6B7280', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Collections</span>
                <button onClick={() => setShowFolderModal(true)} style={{
                  display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'none', border: 'none',
                  cursor: 'pointer', fontFamily: 'DM Sans', fontSize: '0.75rem', fontWeight: 600, color: '#6C63FF',
                }}>
                  <FolderPlus size={13} /> New
                </button>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <FolderChip
                  folder={{ name: 'All', emoji: '🗂️', color: '#6C63FF' }}
                  selected={activeFolder === null} count={items.length}
                  onClick={() => setActiveFolder(null)}
                />
                {folders.map(f => (
                  <FolderChip key={f.id} folder={f}
                    selected={activeFolder === f.name}
                    count={items.filter(i => i.folder === f.name).length}
                    onClick={() => setActiveFolder(activeFolder === f.name ? null : f.name)}
                  />
                ))}
              </div>
            </div>

            {/* Tabs — only show tabs that have content or are always visible */}
            <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '1.25rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
              {TABS.filter(tab => tab.id === 'all' || tab.id === 'starred' || tabCounts[tab.id] > 0).map(tab => {
                const active = activeTab === tab.id;
                return (
                  <button key={tab.id} className="tab-pill" onClick={() => setActiveTab(tab.id)}
                    style={{
                      background: active ? '#6C63FF' : 'rgba(255,255,255,0.7)',
                      color: active ? 'white' : '#6B7280',
                      boxShadow: active ? '0 4px 14px rgba(108,99,255,0.3)' : 'none',
                      border: active ? 'none' : '1.5px solid rgba(108,99,255,0.13)',
                    }}
                  >
                    {tab.icon}
                    {tab.label}
                    <span style={{
                      fontSize: '0.65rem', fontWeight: 700, minWidth: 16, textAlign: 'center',
                      background: active ? 'rgba(255,255,255,0.25)' : 'rgba(108,99,255,0.1)',
                      color: active ? 'white' : '#6C63FF',
                      borderRadius: 99, padding: '1px 5px',
                    }}>{tabCounts[tab.id]}</span>
                  </button>
                );
              })}
            </div>

            {/* Search result count */}
            {searchQuery && (
              <div style={{ marginBottom: '1rem', fontFamily: 'DM Sans', fontSize: '0.82rem', color: '#9CA3AF' }}>
                <span style={{ color: '#6C63FF', fontWeight: 700 }}>{filtered.length}</span> result{filtered.length !== 1 ? 's' : ''} for "<span style={{ color: '#111827' }}>{searchQuery}</span>"
              </div>
            )}

            {/* Items */}
            {filtered.length === 0 ? (
              <EmptyState tab={activeTab} onUpload={() => fileRef.current?.click()} />
            ) : viewMode === 'grid' ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '0.9rem',
              }}>
                {filtered.map((item, i) => (
                  <ItemCard
                    key={item.id} item={item}
                    onStar={handleStar} onDelete={handleDelete}
                    onOpen={handleOpen} onQuickAction={handleQuickAction}
                    delay={i * 45}
                  />
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                {filtered.map((item, i) => (
                  <ItemRow key={item.id} item={item} index={i}
                    onStar={handleStar} onDelete={handleDelete} onOpen={handleOpen}
                  />
                ))}
              </div>
            )}

            <div style={{ height: '2rem' }} />
          </div>
        </div>
      </main>

      {showFolderModal && (
        <NewFolderModal
          onClose={() => setShowFolderModal(false)}
          onCreate={handleCreateFolder}
        />
      )}
    </div>
  );
}