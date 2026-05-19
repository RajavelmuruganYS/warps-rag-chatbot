import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera, Mail, User, Zap, Edit3, Check, X, Copy, MessageSquare,
  FileText, Clock, TrendingUp, Award, Star, ChevronRight, LogOut,
  Shield, Hash, Calendar, BookOpen,
} from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import useChatStore from '../store/chatStore';
import toast from 'react-hot-toast';

// ── Storage ────────────────────────────────────────────────────────────────
const PROFILE_KEY = 'warps_profile';

const defaultProfile = {
  name: 'WARPS User',
  email: 'user@warps.ai',
  bio: 'AI enthusiast & power user. Exploring the frontier of knowledge.',
  role: 'Student',
  joinedAt: new Date().toISOString(),
  avatarColor: '#6C63FF',
  avatarEmoji: '🚀',
  plan: 'free',
};

function loadProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? { ...defaultProfile, ...JSON.parse(raw) } : { ...defaultProfile };
  } catch { return { ...defaultProfile }; }
}

function saveProfile(p) {
  try { localStorage.setItem(PROFILE_KEY, JSON.stringify(p)); } catch {}
}

// ── Avatar emojis ──────────────────────────────────────────────────────────
const AVATARS = ['🚀', '🌟', '🎯', '💡', '🔮', '🧠', '⚡', '🎓', '🌊', '🔥', '💎', '🦋'];
const AVATAR_COLORS = ['#6C63FF', '#EC4899', '#10B981', '#F59E0B', '#0EA5E9', '#8B5CF6', '#EF4444', '#14B8A6'];

// ── Stat Card ──────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, color, delay }) {
  const [counted, setCounted] = useState(0);
  const num = parseInt(value) || 0;

  useEffect(() => {
    if (num === 0) return;
    let start = 0;
    const step = Math.ceil(num / 30);
    const interval = setInterval(() => {
      start = Math.min(start + step, num);
      setCounted(start);
      if (start >= num) clearInterval(interval);
    }, 30);
    return () => clearInterval(interval);
  }, [num]);

  return (
    <div style={{
      background: 'rgba(255,255,255,0.85)',
      backdropFilter: 'blur(20px)',
      borderRadius: '1.1rem',
      border: `1px solid ${color}1A`,
      padding: '1.25rem',
      display: 'flex', flexDirection: 'column', gap: '0.5rem',
      boxShadow: `0 4px 20px ${color}0D`,
      animation: `stat-in 0.5s ease ${delay}s both`,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: '0.75rem',
        background: `linear-gradient(135deg, ${color}20, ${color}10)`,
        border: `1px solid ${color}25`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {React.cloneElement(icon, { size: 17, color })}
      </div>
      <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '1.6rem', color: '#111827', lineHeight: 1 }}>
        {num > 0 ? counted : value}
      </div>
      <div style={{ fontFamily: 'DM Sans', fontSize: '0.75rem', color: '#9CA3AF', fontWeight: 500 }}>{label}</div>
    </div>
  );
}

// ── Avatar Picker ──────────────────────────────────────────────────────────
function AvatarPicker({ current, color, onSelect, onColorSelect, onClose }) {
  return (
    <div style={{
      position: 'absolute', top: '110%', left: '50%', transform: 'translateX(-50%)',
      background: 'white', borderRadius: '1.25rem',
      border: '1px solid rgba(108,99,255,0.15)',
      boxShadow: '0 16px 48px rgba(108,99,255,0.2)',
      padding: '1.25rem', zIndex: 50, width: 260,
      animation: 'fade-up 0.25s cubic-bezier(0.34,1.56,0.64,1)',
    }}>
      <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '0.8rem', color: '#6B7280', marginBottom: '0.75rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Choose Avatar</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.4rem', marginBottom: '1rem' }}>
        {AVATARS.map(e => (
          <div key={e} onClick={() => onSelect(e)} style={{
            width: 36, height: 36, borderRadius: '0.65rem',
            background: current === e ? `${color}20` : 'rgba(108,99,255,0.05)',
            border: `2px solid ${current === e ? color : 'transparent'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontSize: '1.1rem',
            transition: 'all 0.15s',
          }}>{e}</div>
        ))}
      </div>
      <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '0.8rem', color: '#6B7280', marginBottom: '0.6rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Background Color</div>
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
        {AVATAR_COLORS.map(c => (
          <div key={c} onClick={() => onColorSelect(c)} style={{
            width: 24, height: 24, borderRadius: '50%', background: c, cursor: 'pointer',
            outline: color === c ? `3px solid ${c}` : '3px solid transparent',
            outlineOffset: '2px', transition: 'all 0.15s',
            transform: color === c ? 'scale(1.15)' : 'scale(1)',
          }} />
        ))}
      </div>
      <button onClick={onClose} style={{
        width: '100%', padding: '0.5rem', borderRadius: '0.65rem',
        background: 'linear-gradient(135deg, #6C63FF, #8A7DFF)',
        border: 'none', cursor: 'pointer',
        fontFamily: 'Syne', fontWeight: 700, fontSize: '0.8rem', color: 'white',
      }}>Done</button>
    </div>
  );
}

// ── Achievement Badge ──────────────────────────────────────────────────────
function Badge({ emoji, label, desc, unlocked }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.75rem',
      padding: '0.75rem 0.9rem', borderRadius: '0.9rem',
      background: unlocked ? 'rgba(108,99,255,0.06)' : 'rgba(0,0,0,0.02)',
      border: `1px solid ${unlocked ? 'rgba(108,99,255,0.18)' : 'rgba(0,0,0,0.06)'}`,
      opacity: unlocked ? 1 : 0.45,
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: '0.75rem',
        background: unlocked ? 'linear-gradient(135deg, rgba(108,99,255,0.15), rgba(157,235,255,0.1))' : 'rgba(0,0,0,0.04)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.3rem',
        filter: unlocked ? 'none' : 'grayscale(100%)',
      }}>{emoji}</div>
      <div>
        <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '0.83rem', color: '#111827' }}>{label}</div>
        <div style={{ fontFamily: 'DM Sans', fontSize: '0.73rem', color: '#9CA3AF' }}>{desc}</div>
      </div>
      {unlocked && <Check size={14} color="#6C63FF" style={{ marginLeft: 'auto' }} />}
    </div>
  );
}

// ── Editable Field ─────────────────────────────────────────────────────────
function EditableField({ label, icon, value, onChange, multiline, placeholder }) {
  const [focused, setFocused] = useState(false);
  const commonStyle = {
    width: '100%',
    padding: focused ? '0.75rem 1rem 0.75rem 2.6rem' : '0.7rem 1rem 0.7rem 2.6rem',
    border: `1.5px solid ${focused ? '#6C63FF' : '#E5E7EB'}`,
    borderRadius: '0.85rem',
    fontFamily: 'DM Sans', fontSize: '0.88rem', outline: 'none',
    background: focused ? 'rgba(108,99,255,0.02)' : 'white',
    color: '#111827',
    transition: 'all 0.2s',
    boxShadow: focused ? '0 0 0 3px rgba(108,99,255,0.1)' : 'none',
    boxSizing: 'border-box',
  };

  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.77rem', fontWeight: 700, color: '#6B7280', marginBottom: '0.4rem', fontFamily: 'DM Sans', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: '0.9rem', top: multiline ? '0.85rem' : '50%', transform: multiline ? 'none' : 'translateY(-50%)', color: focused ? '#6C63FF' : '#9CA3AF', transition: 'color 0.2s' }}>
          {React.cloneElement(icon, { size: 15 })}
        </span>
        {multiline ? (
          <textarea
            value={value}
            onChange={e => onChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={placeholder}
            rows={3}
            style={{ ...commonStyle, resize: 'vertical' }}
          />
        ) : (
          <input
            value={value}
            onChange={e => onChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={placeholder}
            style={commonStyle}
          />
        )}
      </div>
    </div>
  );
}

// ── Main Profile Page ──────────────────────────────────────────────────────
export default function Profile() {
  const navigate = useNavigate();
  const { sessions, clearChat } = useChatStore();

  const [profile, setProfile] = useState(loadProfile);
  const [form, setForm] = useState({ ...loadProfile() });
  const [editing, setEditing] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [saved, setSaved] = useState(false);
  const avatarRef = useRef(null);

  // Click outside avatar picker
  useEffect(() => {
    const handler = (e) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target)) {
        setShowAvatarPicker(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Stats derived from real data
  const stats = {
    sessions: sessions?.length || 0,
    messages: sessions?.reduce((acc, s) => acc + (s.messageCount || 0), 0) || 0,
    daysSince: Math.floor((Date.now() - new Date(profile.joinedAt).getTime()) / (1000 * 60 * 60 * 24)),
    streak: parseInt(localStorage.getItem('warps_streak') || '1'),
  };

  // Achievements
  const achievements = [
    { emoji: '🚀', label: 'First Launch', desc: 'Started your WARPS journey', unlocked: true },
    { emoji: '💬', label: 'First Chat', desc: 'Sent your first message', unlocked: stats.sessions >= 1 },
    { emoji: '📄', label: 'PDF Master', desc: 'Uploaded 5+ documents', unlocked: stats.sessions >= 5 },
    { emoji: '🧠', label: 'Knowledge Seeker', desc: 'Asked 50+ questions', unlocked: stats.messages >= 50 },
    { emoji: '⚡', label: 'Power User', desc: 'Used all AI tools', unlocked: false },
    { emoji: '🏆', label: 'WARPS Legend', desc: 'Active for 30+ days', unlocked: stats.daysSince >= 30 },
  ];

  const handleSave = () => {
    const updated = { ...profile, ...form };
    setProfile(updated);
    saveProfile(updated);
    setEditing(false);
    setSaved(true);
    toast.success('Profile updated!', { icon: '✅' });
    setTimeout(() => setSaved(false), 3000);
  };

  const handleCancel = () => {
    setForm({ ...profile });
    setEditing(false);
  };

  const handleCopyId = () => {
    const id = profile.joinedAt?.slice(0, 8).replace(/-/g, '').toUpperCase() || 'WARPS001';
    navigator.clipboard.writeText(id).catch(() => {});
    toast.success('User ID copied!');
  };

  const updateAvatar = (key, val) => {
    const updated = { ...form, [key]: val };
    setForm(updated);
    const fullUpdate = { ...profile, [key]: val };
    setProfile(fullUpdate);
    saveProfile(fullUpdate);
  };

  const userId = profile.joinedAt?.slice(0, 8).replace(/-/g, '').toUpperCase() || 'WARPS001';

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'linear-gradient(135deg, #F0F4FF 0%, #F5F0FF 50%, #FAF0FF 100%)', overflow: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
        @keyframes fade-up { from { opacity: 0; transform: translateX(-50%) translateY(12px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
        @keyframes stat-in { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes profile-in { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
        .profile-scroll::-webkit-scrollbar { width: 4px; }
        .profile-scroll::-webkit-scrollbar-thumb { background: rgba(108,99,255,0.2); border-radius: 99px; }
      `}</style>

      <Sidebar />

      <main className="profile-scroll" style={{ flex: 1, overflowY: 'auto', padding: '2rem 2.5rem' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>

          {/* ── Profile hero card ──────────────────────────────────── */}
          <div style={{
            background: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(20px)',
            borderRadius: '1.5rem',
            border: '1px solid rgba(108,99,255,0.12)',
            boxShadow: '0 8px 40px rgba(108,99,255,0.1)',
            overflow: 'hidden',
            marginBottom: '1.25rem',
            animation: 'profile-in 0.4s ease',
          }}>
            {/* Gradient banner */}
            <div style={{
              height: 100,
              background: `linear-gradient(135deg, ${profile.avatarColor}40 0%, ${profile.avatarColor}15 40%, rgba(157,235,255,0.2) 100%)`,
              position: 'relative',
            }}>
              <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: `radial-gradient(circle at 20% 50%, ${profile.avatarColor}25 0%, transparent 60%)`,
              }} />
              {/* Edit button */}
              {!editing ? (
                <button onClick={() => setEditing(true)} style={{
                  position: 'absolute', top: '1rem', right: '1rem',
                  padding: '0.45rem 0.9rem', borderRadius: '0.75rem',
                  background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(108,99,255,0.2)',
                  cursor: 'pointer', fontFamily: 'Syne', fontWeight: 700, fontSize: '0.78rem',
                  color: '#6C63FF', display: 'flex', alignItems: 'center', gap: '0.35rem',
                  transition: 'all 0.2s',
                }}>
                  <Edit3 size={13} /> Edit Profile
                </button>
              ) : (
                <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.4rem' }}>
                  <button onClick={handleSave} style={{
                    padding: '0.45rem 0.9rem', borderRadius: '0.75rem',
                    background: 'linear-gradient(135deg, #6C63FF, #8A7DFF)',
                    border: 'none', cursor: 'pointer',
                    fontFamily: 'Syne', fontWeight: 700, fontSize: '0.78rem', color: 'white',
                    display: 'flex', alignItems: 'center', gap: '0.35rem',
                    boxShadow: '0 4px 12px rgba(108,99,255,0.3)',
                  }}><Check size={13} /> Save</button>
                  <button onClick={handleCancel} style={{
                    padding: '0.45rem 0.75rem', borderRadius: '0.75rem',
                    background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(239,68,68,0.2)',
                    cursor: 'pointer', color: '#EF4444', display: 'flex', alignItems: 'center',
                  }}><X size={13} /></button>
                </div>
              )}
            </div>

            <div style={{ padding: '0 1.75rem 1.75rem', position: 'relative' }}>
              {/* Avatar */}
              <div ref={avatarRef} style={{ position: 'relative', display: 'inline-block', marginTop: -48, marginBottom: '0.75rem' }}>
                <div
                  onClick={() => setShowAvatarPicker(v => !v)}
                  style={{
                    width: 88, height: 88, borderRadius: '1.4rem',
                    background: `linear-gradient(135deg, ${profile.avatarColor}, ${profile.avatarColor}AA)`,
                    border: '4px solid white',
                    boxShadow: `0 8px 24px ${profile.avatarColor}40`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '2.4rem', cursor: 'pointer',
                    transition: 'transform 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  {profile.avatarEmoji}
                  <div style={{
                    position: 'absolute', bottom: 2, right: 2,
                    width: 26, height: 26, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6C63FF, #8A7DFF)',
                    border: '2.5px solid white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Camera size={11} color="white" />
                  </div>
                </div>
                {showAvatarPicker && (
                  <AvatarPicker
                    current={form.avatarEmoji}
                    color={form.avatarColor}
                    onSelect={e => updateAvatar('avatarEmoji', e)}
                    onColorSelect={c => updateAvatar('avatarColor', c)}
                    onClose={() => setShowAvatarPicker(false)}
                  />
                )}
              </div>

              {/* Name & meta */}
              {!editing ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div>
                      <h2 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '1.4rem', color: '#111827', margin: '0 0 0.2rem' }}>{profile.name}</h2>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: 'DM Sans', fontSize: '0.85rem', color: '#9CA3AF' }}>{profile.email}</span>
                        <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#D1D5DB' }} />
                        <span style={{
                          fontFamily: 'Syne', fontSize: '0.72rem', fontWeight: 700,
                          color: profile.avatarColor,
                          background: `${profile.avatarColor}14`,
                          border: `1px solid ${profile.avatarColor}28`,
                          borderRadius: 999, padding: '1px 8px',
                        }}>{profile.role}</span>
                      </div>
                      {profile.bio && (
                        <p style={{ fontFamily: 'DM Sans', fontSize: '0.85rem', color: '#6B7280', margin: '0.65rem 0 0', lineHeight: 1.6, maxWidth: 420 }}>{profile.bio}</p>
                      )}
                    </div>
                  </div>

                  {/* User ID */}
                  <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      background: 'rgba(108,99,255,0.06)', border: '1px solid rgba(108,99,255,0.14)',
                      borderRadius: '0.65rem', padding: '0.35rem 0.75rem',
                    }}>
                      <Hash size={11} color="#9CA3AF" />
                      <span style={{ fontFamily: 'DM Sans', fontSize: '0.75rem', color: '#6B7280', fontWeight: 600 }}>{userId}</span>
                      <button onClick={handleCopyId} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', display: 'flex', padding: 0 }}>
                        <Copy size={11} />
                      </button>
                    </div>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '0.4rem',
                      background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
                      borderRadius: '0.65rem', padding: '0.35rem 0.75rem',
                    }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 6px rgba(16,185,129,0.5)' }} />
                      <span style={{ fontFamily: 'DM Sans', fontSize: '0.75rem', color: '#10B981', fontWeight: 600 }}>Active</span>
                    </div>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '0.4rem',
                      background: profile.plan === 'pro' ? 'rgba(108,99,255,0.1)' : 'rgba(245,158,11,0.08)',
                      border: `1px solid ${profile.plan === 'pro' ? 'rgba(108,99,255,0.25)' : 'rgba(245,158,11,0.2)'}`,
                      borderRadius: '0.65rem', padding: '0.35rem 0.75rem',
                    }}>
                      <Star size={11} color={profile.plan === 'pro' ? '#6C63FF' : '#F59E0B'} />
                      <span style={{ fontFamily: 'Syne', fontSize: '0.72rem', color: profile.plan === 'pro' ? '#6C63FF' : '#F59E0B', fontWeight: 700 }}>
                        {profile.plan === 'pro' ? 'PRO' : 'FREE'}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.6rem' }}>
                    <Calendar size={12} color="#9CA3AF" />
                    <span style={{ fontFamily: 'DM Sans', fontSize: '0.75rem', color: '#9CA3AF' }}>
                      Joined {new Date(profile.joinedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                </>
              ) : (
                /* Edit form */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <EditableField label="Full Name" icon={<User />} value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="Your name" />
                  <EditableField label="Email" icon={<Mail />} value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} placeholder="your@email.com" />
                  <div>
                    <label style={{ display: 'block', fontSize: '0.77rem', fontWeight: 700, color: '#6B7280', marginBottom: '0.4rem', fontFamily: 'DM Sans', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Role</label>
                    <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} style={{
                      width: '100%', padding: '0.75rem 1rem',
                      border: '1.5px solid #E5E7EB', borderRadius: '0.85rem',
                      fontFamily: 'DM Sans', fontSize: '0.88rem', outline: 'none',
                      background: 'white', cursor: 'pointer',
                    }}>
                      {['Student', 'Researcher', 'Professional', 'Educator', 'Developer', 'Other'].map(r => (
                        <option key={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                  <EditableField label="Bio" icon={<Edit3 />} value={form.bio} onChange={v => setForm(f => ({ ...f, bio: v }))} placeholder="Tell us about yourself..." multiline />
                </div>
              )}
            </div>
          </div>

          {/* ── Stats grid ──────────────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.85rem', marginBottom: '1.25rem' }}>
            <StatCard icon={<MessageSquare />} label="Sessions" value={stats.sessions} color="#6C63FF" delay={0.1} />
            <StatCard icon={<TrendingUp />} label="Messages" value={stats.messages} color="#EC4899" delay={0.15} />
            <StatCard icon={<Clock />} label="Days Active" value={stats.daysSince || 1} color="#10B981" delay={0.2} />
            <StatCard icon={<Award />} label="Day Streak" value={stats.streak} color="#F59E0B" delay={0.25} />
          </div>

          {/* ── Achievements ─────────────────────────────────────────── */}
          <div style={{
            background: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(20px)',
            borderRadius: '1.25rem',
            border: '1px solid rgba(108,99,255,0.1)',
            boxShadow: '0 4px 24px rgba(108,99,255,0.06)',
            padding: '1.4rem',
            marginBottom: '1.25rem',
            animation: 'profile-in 0.4s ease 0.3s both',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.1rem' }}>
              <Award size={18} color="#6C63FF" />
              <h3 style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '0.95rem', color: '#111827', margin: 0 }}>Achievements</h3>
              <div style={{
                marginLeft: 'auto', fontFamily: 'Syne', fontSize: '0.72rem', fontWeight: 700,
                color: '#6C63FF', background: 'rgba(108,99,255,0.1)', borderRadius: 999, padding: '2px 8px',
              }}>
                {achievements.filter(a => a.unlocked).length}/{achievements.length}
              </div>
            </div>
            {/* Progress bar */}
            <div style={{ height: 5, background: 'rgba(108,99,255,0.1)', borderRadius: 99, marginBottom: '1.1rem', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 99,
                width: `${(achievements.filter(a => a.unlocked).length / achievements.length) * 100}%`,
                background: 'linear-gradient(90deg, #6C63FF, #9DEBFF)',
                transition: 'width 1s ease',
              }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
              {achievements.map(a => <Badge key={a.label} {...a} />)}
            </div>
          </div>

          {/* ── Pro upgrade card ─────────────────────────────────────── */}
          {profile.plan !== 'pro' && (
            <div style={{
              background: 'linear-gradient(135deg, #6C63FF, #8A7DFF)',
              borderRadius: '1.25rem',
              padding: '1.5rem',
              marginBottom: '1.25rem',
              position: 'relative', overflow: 'hidden',
              animation: 'profile-in 0.4s ease 0.35s both',
            }}>
              <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
              <div style={{ position: 'absolute', bottom: -60, right: 60, width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                      <Zap size={18} color="white" />
                      <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '1.1rem', color: 'white' }}>Upgrade to WARPS Pro</span>
                    </div>
                    <p style={{ fontFamily: 'DM Sans', fontSize: '0.83rem', color: 'rgba(255,255,255,0.82)', margin: 0, lineHeight: 1.5 }}>
                      Unlimited PDFs · Priority AI · Advanced Analytics · Early Access
                    </p>
                  </div>
                  <button onClick={() => {
                    const updated = { ...profile, plan: 'pro' };
                    setProfile(updated);
                    saveProfile(updated);
                    toast.success('🎉 Upgraded to Pro! (Demo)', { duration: 4000 });
                  }} style={{
                    padding: '0.65rem 1.4rem', borderRadius: '0.85rem',
                    background: 'white', border: 'none', cursor: 'pointer',
                    fontFamily: 'Syne', fontWeight: 800, fontSize: '0.85rem',
                    color: '#6C63FF', whiteSpace: 'nowrap', flexShrink: 0,
                    boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                    transition: 'transform 0.2s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    Upgrade ✨
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Quick actions ────────────────────────────────────────── */}
          <div style={{
            background: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(20px)',
            borderRadius: '1.25rem',
            border: '1px solid rgba(108,99,255,0.1)',
            boxShadow: '0 4px 24px rgba(108,99,255,0.06)',
            overflow: 'hidden',
            marginBottom: '2rem',
            animation: 'profile-in 0.4s ease 0.4s both',
          }}>
            {[
              { icon: <BookOpen size={15} color="#6C63FF" />, label: 'View Library', desc: 'Browse your documents', action: () => navigate('/library'), color: '#6C63FF' },
              { icon: <Shield size={15} color="#10B981" />, label: 'Privacy Settings', desc: 'Manage your data', action: () => navigate('/settings'), color: '#10B981' },
              { icon: <LogOut size={15} color="#EF4444" />, label: 'Sign Out', desc: 'Log out of WARPS', action: () => {
                clearChat();
                navigate('/login');
              }, color: '#EF4444', danger: true },
            ].map(({ icon, label, desc, action, color, danger }, i) => (
              <div key={label} onClick={action} style={{
                display: 'flex', alignItems: 'center', gap: '0.9rem',
                padding: '1rem 1.4rem', cursor: 'pointer',
                borderBottom: i < 2 ? '1px solid rgba(108,99,255,0.06)' : 'none',
                transition: 'background 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = danger ? 'rgba(239,68,68,0.04)' : 'rgba(108,99,255,0.04)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: '0.75rem',
                  background: `${color}12`, border: `1px solid ${color}20`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>{icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'DM Sans', fontWeight: 600, fontSize: '0.87rem', color: danger ? '#EF4444' : '#111827' }}>{label}</div>
                  <div style={{ fontFamily: 'DM Sans', fontSize: '0.75rem', color: '#9CA3AF' }}>{desc}</div>
                </div>
                <ChevronRight size={14} color="#D1D5DB" />
              </div>
            ))}
          </div>

        </div>
      </main>
    </div>
  );
}