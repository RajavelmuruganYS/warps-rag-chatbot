import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Palette, Bell, Shield, Database, Zap, Monitor, Moon, Sun,
  Volume2, VolumeX, Eye, EyeOff, Download, Trash2, RefreshCw,
  Check, ChevronRight, Keyboard, Globe, Lock, Cpu, Sliders,
  AlertTriangle, CheckCircle, Info,
} from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import useChatStore from '../store/chatStore';
import toast from 'react-hot-toast';

// ── Storage helpers ────────────────────────────────────────────────────────
const STORAGE_KEY = 'warps_settings';

const defaultSettings = {
  theme: 'light',
  fontSize: 'medium',
  accentColor: '#6C63FF',
  reducedMotion: false,
  compactMode: false,
  emailNotifications: true,
  uploadAlerts: true,
  responseAlerts: false,
  soundEnabled: true,
  saveChatHistory: true,
  usageAnalytics: false,
  shareImprovements: false,
  autoDeleteDays: '30',
  reasoningDefault: false,
  maxResults: '5',
  responseLength: 'balanced',
  language: 'en',
  streamResponses: true,
  autoSummarize: false,
  shortcutsEnabled: true,
};

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...defaultSettings, ...JSON.parse(raw) } : { ...defaultSettings };
  } catch { return { ...defaultSettings }; }
}

function saveSettingsToStorage(s) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
}

// ── Theme applier ──────────────────────────────────────────────────────────
function applyTheme(theme) {

  const root = document.documentElement;

  const prefersDark =
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches;

  const isDark =
    theme === 'dark' ||
    (theme === 'system' && prefersDark);

  if (isDark) {

    document.body.classList.add('dark-theme');

    root.style.setProperty('--bg', '#07071A');
    root.style.setProperty('--surface', '#0F0F28');
    root.style.setProperty('--text', '#F0EEFF');

  } else {

    document.body.classList.remove('dark-theme');

    root.style.setProperty('--bg', '#F5F7FF');
    root.style.setProperty('--surface', '#FFFFFF');
    root.style.setProperty('--text', '#111827');
  }
}

// ── Sub-components ─────────────────────────────────────────────────────────
function Toggle({ value, onChange, color = '#6C63FF' }) {
  return (
    <div onClick={() => onChange(!value)} style={{
      width: 46, height: 26, borderRadius: 99,
      background: value ? `linear-gradient(135deg, ${color}, ${color}CC)` : '#E5E7EB',
      cursor: 'pointer', position: 'relative', transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
      boxShadow: value ? `0 2px 10px ${color}44` : 'none',
      flexShrink: 0,
    }}>
      <div style={{
        position: 'absolute', top: 3,
        left: value ? 23 : 3,
        width: 20, height: 20, borderRadius: '50%',
        background: 'white', transition: 'left 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
      }} />
    </div>
  );
}

function Select({ value, options, onChange }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={{
      padding: '0.4rem 0.85rem', border: '1.5px solid rgba(108,99,255,0.2)',
      borderRadius: '0.6rem', fontFamily: 'DM Sans', fontSize: '0.82rem',
      color: '#374151', outline: 'none', background: 'white', cursor: 'pointer',
      transition: 'border-color 0.2s',
      appearance: 'none',
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath fill='%236C63FF' d='M0 0l5 6 5-6z'/%3E%3C/svg%3E")`,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'right 0.6rem center',
      paddingRight: '2rem',
    }}
      onFocus={e => e.target.style.borderColor = '#6C63FF'}
      onBlur={e => e.target.style.borderColor = 'rgba(108,99,255,0.2)'}
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function SettingRow({ label, description, children, danger }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '0.9rem 0',
      borderBottom: '1px solid rgba(108,99,255,0.06)',
    }}>
      <div style={{ flex: 1, marginRight: '1rem' }}>
        <div style={{ fontSize: '0.87rem', color: danger ? '#EF4444' : '#111827', fontWeight: 600, fontFamily: 'DM Sans' }}>{label}</div>
        {description && <div style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: '0.15rem', fontFamily: 'DM Sans', lineHeight: 1.4 }}>{description}</div>}
      </div>
      {children}
    </div>
  );
}

function SectionCard({ icon, title, color, children, badge }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{
      background: 'rgba(255,255,255,0.92)',
      backdropFilter: 'blur(20px)',
      borderRadius: '1.25rem',
      border: '1px solid rgba(108,99,255,0.1)',
      boxShadow: '0 4px 24px rgba(108,99,255,0.06)',
      overflow: 'hidden',
      transition: 'box-shadow 0.2s',
    }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.85rem',
          padding: '1.1rem 1.4rem', cursor: 'pointer',
          background: open ? `linear-gradient(135deg, ${color}0A, transparent)` : 'transparent',
          borderBottom: open ? `1px solid ${color}14` : 'none',
          transition: 'background 0.2s',
          userSelect: 'none',
        }}
      >
        <div style={{
          width: 38, height: 38, borderRadius: '0.85rem', flexShrink: 0,
          background: `linear-gradient(135deg, ${color}22, ${color}10)`,
          border: `1px solid ${color}28`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {React.cloneElement(icon, { size: 17, color })}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '0.95rem', color: '#111827' }}>{title}</div>
        </div>
        {badge && (
          <div style={{
            fontSize: '0.65rem', fontWeight: 700, fontFamily: 'Syne',
            color, background: `${color}15`, border: `1px solid ${color}28`,
            borderRadius: 999, padding: '2px 8px', marginRight: '0.5rem',
          }}>{badge}</div>
        )}
        <ChevronRight size={15} color="#9CA3AF" style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1)' }} />
      </div>
      {open && (
        <div style={{ padding: '0 1.4rem 0.5rem' }}>
          {children}
        </div>
      )}
    </div>
  );
}

function ThemeCard({ value, label, icon, isSelected, onClick }) {
  return (
    <div onClick={onClick} style={{
      flex: 1, padding: '0.75rem', borderRadius: '0.9rem', cursor: 'pointer',
      border: `2px solid ${isSelected ? '#6C63FF' : 'rgba(108,99,255,0.12)'}`,
      background: isSelected ? 'rgba(108,99,255,0.08)' : 'rgba(255,255,255,0.5)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem',
      transition: 'all 0.2s cubic-bezier(0.34,1.56,0.64,1)',
      transform: isSelected ? 'scale(1.02)' : 'scale(1)',
      boxShadow: isSelected ? '0 4px 16px rgba(108,99,255,0.2)' : 'none',
    }}>
      <div style={{ fontSize: '1.25rem' }}>{icon}</div>
      <div style={{ fontFamily: 'DM Sans', fontSize: '0.75rem', fontWeight: isSelected ? 700 : 500, color: isSelected ? '#6C63FF' : '#6B7280' }}>{label}</div>
      {isSelected && <Check size={12} color="#6C63FF" />}
    </div>
  );
}

function ColorSwatch({ color, selected, onClick }) {
  return (
    <div onClick={onClick} style={{
      width: 30, height: 30, borderRadius: '50%', background: color,
      cursor: 'pointer', border: selected ? `3px solid ${color}` : '3px solid transparent',
      outline: selected ? `2px solid ${color}` : '2px solid transparent',
      outlineOffset: '2px',
      transition: 'all 0.2s cubic-bezier(0.34,1.56,0.64,1)',
      transform: selected ? 'scale(1.15)' : 'scale(1)',
      boxShadow: selected ? `0 4px 12px ${color}66` : 'none',
    }} />
  );
}

const ACCENT_COLORS = ['#6C63FF', '#EC4899', '#10B981', '#F59E0B', '#0EA5E9', '#8B5CF6', '#EF4444', '#14B8A6'];

// ── Keyboard shortcuts modal ───────────────────────────────────────────────
function KeyboardShortcutsModal({ onClose }) {
  const shortcuts = [
    { keys: ['Ctrl', 'Enter'], desc: 'Send message' },
    { keys: ['Ctrl', 'N'], desc: 'New chat' },
    { keys: ['Ctrl', 'K'], desc: 'Search chats' },
    { keys: ['Ctrl', '/'], desc: 'Toggle sidebar' },
    { keys: ['Ctrl', 'S'], desc: 'Summarize document' },
    { keys: ['Ctrl', 'Q'], desc: 'Generate quiz' },
    { keys: ['Esc'], desc: 'Close panel / Cancel' },
  ];
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: 'rgba(15,15,26,0.4)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'white', borderRadius: '1.5rem', padding: '2rem',
        width: 420, maxWidth: '90vw',
        boxShadow: '0 24px 80px rgba(108,99,255,0.2)',
        border: '1px solid rgba(108,99,255,0.15)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <Keyboard size={20} color="#6C63FF" />
          <h3 style={{ fontFamily: 'Syne', fontWeight: 800, color: '#111827', margin: 0 }}>Keyboard Shortcuts</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {shortcuts.map(({ keys, desc }) => (
            <div key={desc} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'DM Sans', fontSize: '0.85rem', color: '#374151' }}>{desc}</span>
              <div style={{ display: 'flex', gap: '0.3rem' }}>
                {keys.map(k => (
                  <kbd key={k} style={{
                    padding: '2px 8px', borderRadius: '6px',
                    background: 'rgba(108,99,255,0.08)',
                    border: '1px solid rgba(108,99,255,0.2)',
                    fontFamily: 'DM Sans', fontSize: '0.72rem', fontWeight: 700, color: '#6C63FF',
                  }}>{k}</kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
        <button onClick={onClose} style={{
          marginTop: '1.5rem', width: '100%', padding: '0.7rem',
          background: 'linear-gradient(135deg, #6C63FF, #8A7DFF)',
          border: 'none', borderRadius: '0.85rem', cursor: 'pointer',
          fontFamily: 'Syne', fontWeight: 700, color: 'white', fontSize: '0.85rem',
        }}>Got it</button>
      </div>
    </div>
  );
}

// ── Main Settings Page ─────────────────────────────────────────────────────
export default function Settings() {
  const [settings, setSettings] = useState(loadSettings);
  const [saved, setSaved] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [storageInfo, setStorageInfo] = useState({ used: 0, total: 0 });
  const { clearChat, sessions } = useChatStore();
  const navigate = useNavigate();

  // Calculate storage usage
  useEffect(() => {
    let used = 0;
    try {
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          used += (localStorage.getItem(key)?.length || 0) * 2; // bytes approx
        }
      }
    } catch {}
    setStorageInfo({ used: Math.round(used / 1024), total: 5120 }); // ~5MB limit
  }, []);

  // Apply theme when it changes
  useEffect(() => { applyTheme(settings.theme); }, [settings.theme]);

  // Apply font size
  useEffect(() => {
    const sizeMap = { small: '14px', medium: '16px', large: '18px' };
    document.documentElement.style.setProperty('--font-size-base', sizeMap[settings.fontSize] || '16px');
  }, [settings.fontSize]);

  const update = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    saveSettingsToStorage(settings);
    setSaved(true);
    toast.success('Settings saved!', { icon: '✅' });
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    setSettings({ ...defaultSettings });
    saveSettingsToStorage(defaultSettings);
    applyTheme(defaultSettings.theme);
    toast.success('Settings reset to defaults');
  };

  const handleClearAllData = () => {
    if (!window.confirm('This will delete ALL your chat history and settings. This cannot be undone. Continue?')) return;
    clearChat();
    localStorage.clear();
    setSettings({ ...defaultSettings });
    toast.success('All data cleared');
  };

  const handleExportData = () => {
    try {
      const data = {
        settings,
        sessions: sessions || [],
        exportedAt: new Date().toISOString(),
        version: '1.0',
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `warps-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Data exported successfully!');
    } catch {
      toast.error('Export failed');
    }
  };

  const storagePercent = Math.min(100, (storageInfo.used / storageInfo.total) * 100);

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'linear-gradient(135deg, #F0F4FF 0%, #F5F0FF 50%, #FAF0FF 100%)', overflow: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
        @keyframes settings-slide-in { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes saved-bounce { 0%,100% { transform: scale(1); } 50% { transform: scale(1.08); } }
        .settings-section { animation: settings-slide-in 0.4s ease both; }
        .settings-scroll::-webkit-scrollbar { width: 4px; }
        .settings-scroll::-webkit-scrollbar-track { background: transparent; }
        .settings-scroll::-webkit-scrollbar-thumb { background: rgba(108,99,255,0.2); border-radius: 99px; }
      `}</style>

      <Sidebar />

      <main className="settings-scroll" style={{ flex: 1, overflowY: 'auto', padding: '2rem 2.5rem' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem', animation: 'settings-slide-in 0.35s ease' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '0.35rem' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '13px',
                  background: 'linear-gradient(135deg, #6C63FF, #9DEBFF)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 6px 20px rgba(108,99,255,0.35)',
                }}>
                  <Sliders size={22} color="white" />
                </div>
                <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '1.85rem', color: '#111827', margin: 0, letterSpacing: '-0.02em' }}>Settings</h1>
              </div>
              <p style={{ fontFamily: 'DM Sans', fontSize: '0.87rem', color: '#6B7280', margin: 0 }}>
                Customize your WARPS experience. Changes are applied instantly.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.6rem', flexShrink: 0 }}>
              <button onClick={handleReset} style={{
                padding: '0.6rem 1rem', borderRadius: '0.85rem',
                border: '1.5px solid rgba(108,99,255,0.2)',
                background: 'rgba(255,255,255,0.8)', cursor: 'pointer',
                fontFamily: 'DM Sans', fontSize: '0.82rem', color: '#6B7280',
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                transition: 'all 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#6C63FF'; e.currentTarget.style.color = '#6C63FF'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(108,99,255,0.2)'; e.currentTarget.style.color = '#6B7280'; }}
              >
                <RefreshCw size={13} /> Reset
              </button>
              <button onClick={handleSave} style={{
                padding: '0.6rem 1.4rem', borderRadius: '0.85rem',
                background: saved ? 'linear-gradient(135deg, #10B981, #059669)' : 'linear-gradient(135deg, #6C63FF, #8A7DFF)',
                border: 'none', cursor: 'pointer',
                fontFamily: 'Syne', fontWeight: 700, fontSize: '0.85rem', color: 'white',
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                boxShadow: saved ? '0 4px 16px rgba(16,185,129,0.35)' : '0 4px 16px rgba(108,99,255,0.35)',
                transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
                animation: saved ? 'saved-bounce 0.3s ease' : 'none',
              }}>
                {saved ? <><CheckCircle size={14} /> Saved!</> : 'Save Settings'}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* ── APPEARANCE ──────────────────────────────────────────── */}
            <div className="settings-section" style={{ animationDelay: '0.05s' }}>
              <SectionCard icon={<Palette />} title="Appearance" color="#6C63FF">

                <SettingRow label="Theme" description="Choose your preferred color scheme">
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <ThemeCard value="light" label="Light" icon="☀️" isSelected={settings.theme === 'light'} onClick={() => update('theme', 'light')} />
                    <ThemeCard value="dark" label="Dark" icon="🌙" isSelected={settings.theme === 'dark'} onClick={() => update('theme', 'dark')} />
                    <ThemeCard value="system" label="System" icon="💻" isSelected={settings.theme === 'system'} onClick={() => update('theme', 'system')} />
                  </div>
                </SettingRow>

                <SettingRow label="Accent Color" description="Personalize the app's primary color">
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {ACCENT_COLORS.map(c => (
                      <ColorSwatch key={c} color={c} selected={settings.accentColor === c} onClick={() => {
                        update('accentColor', c);
                        document.documentElement.style.setProperty('--accent', c);
                      }} />
                    ))}
                  </div>
                </SettingRow>

                <SettingRow label="Font Size" description="Adjust text size for comfortable reading">
                  <Select value={settings.fontSize} onChange={v => update('fontSize', v)} options={[
                    { value: 'small', label: 'Small' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'large', label: 'Large' },
                  ]} />
                </SettingRow>

                <SettingRow label="Compact Mode" description="Reduce padding for more content density">
                  <Toggle value={settings.compactMode} onChange={v => update('compactMode', v)} />
                </SettingRow>

                <SettingRow label="Reduce Motion" description="Minimize animations for accessibility">
                  <Toggle value={settings.reducedMotion} onChange={v => {
                    update('reducedMotion', v);
                    document.documentElement.style.setProperty('--motion', v ? 'none' : 'auto');
                  }} />
                </SettingRow>

              </SectionCard>
            </div>

            {/* ── NOTIFICATIONS ───────────────────────────────────────── */}
            <div className="settings-section" style={{ animationDelay: '0.1s' }}>
              <SectionCard icon={<Bell />} title="Notifications" color="#F59E0B">

                <SettingRow label="Email Notifications" description="Receive updates and tips via email">
                  <Toggle value={settings.emailNotifications} onChange={v => update('emailNotifications', v)} color="#F59E0B" />
                </SettingRow>

                <SettingRow label="Upload Completion Alerts" description="Notify when PDF processing is done">
                  <Toggle value={settings.uploadAlerts} onChange={v => update('uploadAlerts', v)} color="#F59E0B" />
                </SettingRow>

                <SettingRow label="AI Response Alerts" description="Notify when a long response finishes">
                  <Toggle value={settings.responseAlerts} onChange={v => update('responseAlerts', v)} color="#F59E0B" />
                </SettingRow>

                <SettingRow label="Sound Effects" description="Audio feedback for actions and alerts">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    {settings.soundEnabled ? <Volume2 size={15} color="#F59E0B" /> : <VolumeX size={15} color="#9CA3AF" />}
                    <Toggle value={settings.soundEnabled} onChange={v => update('soundEnabled', v)} color="#F59E0B" />
                  </div>
                </SettingRow>

              </SectionCard>
            </div>

            {/* ── PRIVACY & SECURITY ──────────────────────────────────── */}
            <div className="settings-section" style={{ animationDelay: '0.15s' }}>
              <SectionCard icon={<Shield />} title="Privacy & Security" color="#10B981">

                <SettingRow label="Save Chat History" description="Store conversations locally in your browser">
                  <Toggle value={settings.saveChatHistory} onChange={v => update('saveChatHistory', v)} color="#10B981" />
                </SettingRow>

                <SettingRow label="Usage Analytics" description="Help improve WARPS with anonymous usage data">
                  <Toggle value={settings.usageAnalytics} onChange={v => update('usageAnalytics', v)} color="#10B981" />
                </SettingRow>

                <SettingRow label="Share for Improvement" description="Allow anonymized chats to improve AI responses">
                  <Toggle value={settings.shareImprovements} onChange={v => update('shareImprovements', v)} color="#10B981" />
                </SettingRow>

                <SettingRow label="Auto-Delete History After" description="Automatically clear chats after this period">
                  <Select value={settings.autoDeleteDays} onChange={v => update('autoDeleteDays', v)} options={[
                    { value: 'never', label: 'Never' },
                    { value: '7', label: '7 days' },
                    { value: '30', label: '30 days' },
                    { value: '90', label: '90 days' },
                  ]} />
                </SettingRow>

                {/* Storage bar */}
                <div style={{ padding: '0.9rem 0', borderBottom: '1px solid rgba(108,99,255,0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontFamily: 'DM Sans', fontSize: '0.87rem', fontWeight: 600, color: '#111827' }}>Local Storage Usage</span>
                    <span style={{ fontFamily: 'DM Sans', fontSize: '0.78rem', color: '#6B7280' }}>{storageInfo.used} KB / {storageInfo.total} KB</span>
                  </div>
                  <div style={{ height: 6, background: 'rgba(108,99,255,0.1)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 99,
                      width: `${storagePercent}%`,
                      background: storagePercent > 80 ? 'linear-gradient(90deg, #F59E0B, #EF4444)' : 'linear-gradient(90deg, #10B981, #6C63FF)',
                      transition: 'width 0.6s ease',
                    }} />
                  </div>
                </div>

                <SettingRow label="Export All Data" description="Download your chats and settings as JSON">
                  <button onClick={handleExportData} style={{
                    padding: '0.4rem 0.9rem', borderRadius: '0.6rem',
                    border: '1.5px solid rgba(16,185,129,0.3)',
                    background: 'rgba(16,185,129,0.08)', cursor: 'pointer',
                    fontFamily: 'DM Sans', fontSize: '0.78rem', fontWeight: 600, color: '#10B981',
                    display: 'flex', alignItems: 'center', gap: '0.35rem',
                    transition: 'all 0.2s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.15)'; e.currentTarget.style.borderColor = '#10B981'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.08)'; e.currentTarget.style.borderColor = 'rgba(16,185,129,0.3)'; }}
                  >
                    <Download size={13} /> Export
                  </button>
                </SettingRow>

              </SectionCard>
            </div>

            {/* ── AI & RETRIEVAL ──────────────────────────────────────── */}
            <div className="settings-section" style={{ animationDelay: '0.2s' }}>
              <SectionCard icon={<Cpu />} title="AI & Retrieval" color="#8B5CF6" badge="Beta">

                <SettingRow label="Reasoning Mode by Default" description="Enable deep reasoning for complex questions">
                  <Toggle value={settings.reasoningDefault} onChange={v => update('reasoningDefault', v)} color="#8B5CF6" />
                </SettingRow>

                <SettingRow label="Stream Responses" description="Show AI response as it generates, word by word">
                  <Toggle value={settings.streamResponses} onChange={v => update('streamResponses', v)} color="#8B5CF6" />
                </SettingRow>

                <SettingRow label="Auto-Summarize on Upload" description="Automatically generate summary when you upload a PDF">
                  <Toggle value={settings.autoSummarize} onChange={v => update('autoSummarize', v)} color="#8B5CF6" />
                </SettingRow>

                <SettingRow label="Max Results per Query" description="How many document chunks to retrieve per question">
                  <Select value={settings.maxResults} onChange={v => update('maxResults', v)} options={[
                    { value: '3', label: '3 (Faster)' },
                    { value: '5', label: '5 (Balanced)' },
                    { value: '10', label: '10 (Thorough)' },
                  ]} />
                </SettingRow>

                <SettingRow label="Response Length" description="Preferred length for AI answers">
                  <Select value={settings.responseLength} onChange={v => update('responseLength', v)} options={[
                    { value: 'concise', label: 'Concise' },
                    { value: 'balanced', label: 'Balanced' },
                    { value: 'detailed', label: 'Detailed' },
                  ]} />
                </SettingRow>

              </SectionCard>
            </div>

            {/* ── GENERAL ─────────────────────────────────────────────── */}
            <div className="settings-section" style={{ animationDelay: '0.25s' }}>
              <SectionCard icon={<Globe />} title="General" color="#0EA5E9">

                <SettingRow label="Interface Language" description="Language for the WARPS interface">
                  <Select value={settings.language} onChange={v => update('language', v)} options={[
                    { value: 'en', label: '🇬🇧 English' },
                    { value: 'es', label: '🇪🇸 Spanish' },
                    { value: 'fr', label: '🇫🇷 French' },
                    { value: 'de', label: '🇩🇪 German' },
                    { value: 'ja', label: '🇯🇵 Japanese' },
                  ]} />
                </SettingRow>

                <SettingRow label="Keyboard Shortcuts" description="View and learn all available shortcuts">
                  <button onClick={() => setShowShortcuts(true)} style={{
                    padding: '0.4rem 0.9rem', borderRadius: '0.6rem',
                    border: '1.5px solid rgba(14,165,233,0.3)',
                    background: 'rgba(14,165,233,0.08)', cursor: 'pointer',
                    fontFamily: 'DM Sans', fontSize: '0.78rem', fontWeight: 600, color: '#0EA5E9',
                    display: 'flex', alignItems: 'center', gap: '0.35rem',
                    transition: 'all 0.2s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(14,165,233,0.15)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(14,165,233,0.08)'; }}
                  >
                    <Keyboard size={13} /> View Shortcuts
                  </button>
                </SettingRow>

                <SettingRow label="Enable Keyboard Shortcuts" description="Use keyboard shortcuts throughout the app">
                  <Toggle value={settings.shortcutsEnabled} onChange={v => update('shortcutsEnabled', v)} color="#0EA5E9" />
                </SettingRow>

              </SectionCard>
            </div>

            {/* ── DANGER ZONE ─────────────────────────────────────────── */}
            <div className="settings-section" style={{ animationDelay: '0.3s' }}>
              <SectionCard icon={<AlertTriangle />} title="Danger Zone" color="#EF4444">

                <SettingRow label="Clear All Chat History" description="Permanently delete all your conversations" danger>
                  <button onClick={() => {
                    if (!window.confirm('Delete all chat history? This cannot be undone.')) return;
                    clearChat();
                    toast.success('Chat history cleared');
                  }} style={{
                    padding: '0.4rem 0.9rem', borderRadius: '0.6rem',
                    border: '1.5px solid rgba(239,68,68,0.3)',
                    background: 'rgba(239,68,68,0.08)', cursor: 'pointer',
                    fontFamily: 'DM Sans', fontSize: '0.78rem', fontWeight: 600, color: '#EF4444',
                    display: 'flex', alignItems: 'center', gap: '0.35rem',
                    transition: 'all 0.2s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.borderColor = '#EF4444'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'; }}
                  >
                    <Trash2 size={13} /> Clear History
                  </button>
                </SettingRow>

                <SettingRow label="Delete All Data" description="Permanently erase all data including settings and history" danger>
                  <button onClick={handleClearAllData} style={{
                    padding: '0.4rem 0.9rem', borderRadius: '0.6rem',
                    border: '1.5px solid rgba(239,68,68,0.5)',
                    background: 'rgba(239,68,68,0.12)', cursor: 'pointer',
                    fontFamily: 'DM Sans', fontSize: '0.78rem', fontWeight: 700, color: '#DC2626',
                    display: 'flex', alignItems: 'center', gap: '0.35rem',
                    transition: 'all 0.2s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.22)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; }}
                  >
                    <AlertTriangle size={13} /> Delete Everything
                  </button>
                </SettingRow>

              </SectionCard>
            </div>

            {/* App version badge */}
            <div style={{ textAlign: 'center', padding: '1rem 0 2rem', animation: 'settings-slide-in 0.4s ease 0.35s both' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(12px)',
                border: '1px solid rgba(108,99,255,0.12)', borderRadius: 999,
                padding: '0.35rem 1rem',
                fontFamily: 'DM Sans', fontSize: '0.75rem', color: '#9CA3AF',
              }}>
                <Zap size={11} color="#6C63FF" />
                WARPS v1.0.0 · Built with ❤️
              </div>
            </div>

          </div>
        </div>
      </main>

      {showShortcuts && <KeyboardShortcutsModal onClose={() => setShowShortcuts(false)} />}
    </div>
  );
}