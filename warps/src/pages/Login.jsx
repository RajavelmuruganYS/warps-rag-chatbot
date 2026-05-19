import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Zap } from 'lucide-react';
import WarpsMascot from '../components/ui/WarpsMascot';
import FloatingParticles from '../components/ui/FloatingParticles';
import toast from 'react-hot-toast';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      toast.success('Welcome back!');
      navigate('/chat');
    }, 1200);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Left */}
      <div style={{
        flex: 1, position: 'relative',
        background: 'linear-gradient(135deg, #EEF2FF 0%, #F5F7FF 50%, #C8F1FF40 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }}>
        <FloatingParticles count={35} />
        <div style={{
          position: 'absolute', width: 400, height: 400,
          background: 'radial-gradient(circle, rgba(108,99,255,0.2) 0%, transparent 70%)',
          top: '20%', left: '50%', transform: 'translateX(-50%)',
          animation: 'blob 8s ease-in-out infinite',
        }} />
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <WarpsMascot state="happy" size={200} />
          <h2 style={{ fontFamily: 'Syne', fontSize: '2rem', fontWeight: 800, color: '#111827', marginTop: '1.5rem' }}>
            Welcome to WARPS
          </h2>
          <p style={{ color: '#6B7280', marginTop: '0.5rem', maxWidth: 300 }}>
            Your intelligent AI workspace for document intelligence.
          </p>
        </div>
      </div>

      {/* Right */}
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
            Sign in
          </h1>
          <p style={{ color: '#6B7280', marginBottom: '2rem', fontSize: '0.9rem' }}>
            Don't have an account? <Link to="/signup" style={{ color: '#6C63FF', fontWeight: 600 }}>Sign up</Link>
          </p>

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
              <input
                type="email" required value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="Email address"
                style={{
                  width: '100%', padding: '0.85rem 1rem 0.85rem 2.75rem',
                  border: '1.5px solid #E5E7EB', borderRadius: '0.875rem',
                  fontFamily: 'DM Sans', fontSize: '0.9rem', outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => e.target.style.borderColor = '#6C63FF'}
                onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
              />
            </div>

            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
              <input
                type={show ? 'text' : 'password'} required value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Password"
                style={{
                  width: '100%', padding: '0.85rem 3rem 0.85rem 2.75rem',
                  border: '1.5px solid #E5E7EB', borderRadius: '0.875rem',
                  fontFamily: 'DM Sans', fontSize: '0.9rem', outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => e.target.style.borderColor = '#6C63FF'}
                onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
              />
              <button type="button" onClick={() => setShow(!show)} style={{
                position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF',
              }}>
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <button type="submit" className="btn-primary" style={{ padding: '0.9rem', fontSize: '0.95rem', marginTop: '0.5rem' }} disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '0.5rem 0' }}>
              <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
              <span style={{ color: '#9CA3AF', fontSize: '0.8rem' }}>or</span>
              <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
            </div>

            <button type="button" style={{
              width: '100%', padding: '0.85rem', border: '1.5px solid #E5E7EB',
              borderRadius: '0.875rem', background: 'white', display: 'flex',
              alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
              cursor: 'pointer', fontFamily: 'DM Sans', fontWeight: 500,
              fontSize: '0.9rem', color: '#374151', transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = '#6C63FF'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = '#E5E7EB'}
            >
              <svg width="18" height="18" viewBox="0 0 18 18"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/><path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/><path d="M9 3.583c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.583 9 3.583z" fill="#EA4335"/></svg>
              Continue with Google
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}