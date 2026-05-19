import React from 'react';

export default function TypingIndicator() {
  return (
    <>
      <style>{`
        @keyframes warps-dot {
          0%, 60%, 100% { transform: translateY(0) scale(1); opacity: 0.5; }
          30% { transform: translateY(-8px) scale(1.2); opacity: 1; }
        }
        @keyframes warps-glow-pulse {
          0%, 100% { box-shadow: 0 0 12px rgba(108,99,255,0.4), 0 0 24px rgba(108,99,255,0.15); }
          50% { box-shadow: 0 0 20px rgba(108,99,255,0.7), 0 0 40px rgba(108,99,255,0.3); }
        }
        @keyframes warps-bubble-in {
          from { opacity: 0; transform: translateY(10px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes warps-scan {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      `}</style>

      <div style={{
        display: 'flex', alignItems: 'flex-end', gap: '0.75rem',
        padding: '0.5rem 0',
        animation: 'warps-bubble-in 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards',
      }}>
        {/* Avatar */}
        <div style={{
          width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg, #6C63FF, #9DEBFF)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'warps-glow-pulse 2s ease-in-out infinite',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Scan shimmer */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)',
            animation: 'warps-scan 1.8s linear infinite',
          }} />
          <img
            src="/mascot/typing.png"
            alt="typing"
            style={{ width: '100%', height: '100%', objectFit: 'contain', position: 'relative', zIndex: 1 }}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentElement.insertAdjacentHTML('beforeend',
                '<span style="color:white;font-weight:800;font-size:14px;position:relative;z-index:1">W</span>');
            }}
          />
        </div>

        {/* Bubble */}
        <div style={{
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(108,99,255,0.2)',
          borderRadius: '1.25rem 1.25rem 1.25rem 0.25rem',
          padding: '1rem 1.4rem',
          display: 'flex', gap: '7px', alignItems: 'center',
          boxShadow: '0 4px 24px rgba(108,99,255,0.12), inset 0 1px 0 rgba(255,255,255,0.9)',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Inner shimmer */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(135deg, rgba(108,99,255,0.04), rgba(157,235,255,0.04))',
            pointerEvents: 'none',
          }} />
          {[0, 1, 2].map((i) => (
            <div key={i} style={{
              width: 9, height: 9, borderRadius: '50%',
              background: `linear-gradient(135deg, #6C63FF, #9DEBFF)`,
              animation: `warps-dot 1.5s ease-in-out ${i * 0.18}s infinite`,
              boxShadow: '0 0 6px rgba(108,99,255,0.5)',
              position: 'relative', zIndex: 1,
            }} />
          ))}
        </div>
      </div>
    </>
  );
}