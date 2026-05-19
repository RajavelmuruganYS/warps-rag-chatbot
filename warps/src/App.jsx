import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './index.css';
import './App.css';
import './darkTheme.css';


import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Chat from './pages/Chat';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import Library from './pages/Library';

const Loading = () => (
  <div style={{
    height: '100vh', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', gap: '1rem',
  }}>
    <div style={{
      width: 56, height: 56, background: 'linear-gradient(135deg, #6C63FF, #9DEBFF)',
      borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: 'pulse-glow 2s ease-in-out infinite',
    }}>
      <span style={{ color: 'white', fontFamily: 'Syne', fontWeight: 800, fontSize: '1.2rem' }}>W</span>
    </div>
    <p style={{ fontFamily: 'Syne', fontWeight: 600, color: '#6C63FF' }}>Loading WARPS...</p>
  </div>
);

export default function App() {
   
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            fontFamily: 'DM Sans',
            borderRadius: '1rem',
            border: '1px solid rgba(108,99,255,0.2)',
            boxShadow: '0 4px 24px rgba(108,99,255,0.15)',
          },
          success: { iconTheme: { primary: '#6C63FF', secondary: 'white' } },
        }}
      />
      
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/library"element={<Library />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}