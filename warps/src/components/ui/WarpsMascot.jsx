import React from 'react';

const stateMap = {
  idle: '/mascot/idle.png',
  thinking: '/mascot/thinking.png',
  happy: '/mascot/happy.png',
  typing: '/mascot/typing.png',
  reading: '/mascot/reading.png',
  upload: '/mascot/upload.png',
  search: '/mascot/search.png',
  headset: '/mascot/headset.png',
  aura:'/mascot/aura.png',
};

export default function WarpsMascot({ state = 'idle', size = 120, className = '' }) {
  const src = stateMap[state] || stateMap.idle;

  return (
    <div
      className={`mascot-wrap ${className}`}
      style={{
        width: size,
        height: size,
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Glow ring */}
      <div style={{
        position: 'absolute',
        inset: -12,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(108,99,255,0.25) 0%, transparent 70%)',
        animation: 'pulse-glow 3s ease-in-out infinite',
      }} />
      <img
        src={src}
        alt={`WARPS mascot ${state}`}
        style={{
          width: size,
          height: size,
          objectFit: 'contain',
          animation: 'float 4s ease-in-out infinite',
          filter: 'drop-shadow(0 8px 24px rgba(108,99,255,0.4))',
          position: 'relative',
          zIndex: 1,
        }}
      />
    </div>
  );
}