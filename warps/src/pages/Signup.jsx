import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, Zap } from 'lucide-react';
import WarpsMascot from '../components/ui/WarpsMascot';
import FloatingParticles from '../components/ui/FloatingParticles';
import toast from 'react-hot-toast';

export default function Signup() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { toast.success('Account created!'); navigate('/chat'); }, 1200);
  };

  const fields = [
    { key: 'name', icon: <User size={16} />, placeholder: 'Full name', type: 'text' },
    { key: 'email', icon: <Mail size={16} />, placeholder: 'Email address', type: 'email' },
    { key: 'password', icon: <Lock size={16} />, placeholder: 'Create password', type: show ? 'text' : 'password', toggle: true },
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <div style={{
        flex: 1, position: 'relative',
        background: 'linear-gradient(135deg, #EEF2FF 0%, #F5F7FF 50%, #C8F1FF40 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }}>
        <FloatingParticles count={25} />
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <WarpsMascot state="aura" size={250} />
          <h2 style={{ fontFamily: 'Syne', fontSize: '2rem', fontWeight: 800, color: '#111827', marginTop: '1.5rem' }}>
            Think Smarter with WARPS
          </h2>
          <p style={{ color: '#6B7280', marginTop: '0.5rem', maxWidth: 300 }}>
            Upload documents, ask questions, get cited AI answers.
          </p>
        </div>
      </div>

      <div style={{
        width: 480, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '2rem', background: 'white',
      }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2.5rem' }}>
            <div style={{
              width: 36, height: 36, background: 'linear-gradient(135deg, #6C63FF, #9DEBFF)',
              borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Zap size={20} color="white" />
            </div>
            <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '1.4rem', color: '#111827' }}>WARPS</span>
          </div>

          <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '1.75rem', color: '#111827', marginBottom: '0.5rem' }}>
            Create account
          </h1>
          <p style={{ color: '#6B7280', marginBottom: '2rem', fontSize: '0.9rem' }}>
            Already have an account? <Link to="/login" style={{ color: '#6C63FF', fontWeight: 600 }}>Sign in</Link>
          </p>

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {fields.map((f) => (
              <div key={f.key} style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }}>{f.icon}</span>
                <input
                  type={f.type} required value={form[f.key]}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  placeholder={f.placeholder}
                  style={{
                    width: '100%', padding: `0.85rem ${f.toggle ? '3rem' : '1rem'} 0.85rem 2.75rem`,
                    border: '1.5px solid #E5E7EB', borderRadius: '0.875rem',
                    fontFamily: 'DM Sans', fontSize: '0.9rem', outline: 'none', transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#6C63FF'}
                  onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                />
                {f.toggle && (
                  <button type="button" onClick={() => setShow(!show)} style={{
                    position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF',
                  }}>
                    {show ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                )}
              </div>
            ))}

            <button type="submit" className="btn-primary" style={{ padding: '0.9rem', fontSize: '0.95rem', marginTop: '0.5rem' }} disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}