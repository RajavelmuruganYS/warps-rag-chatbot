import React from 'react';

export default function GlowCard({ children, style = {}, className = '', onClick }) {
  return (
    <div
      onClick={onClick}
      className={`glass ${className}`}
      style={{
        padding: '1.5rem',
        borderRadius: '1.5rem',
        transition: 'all 0.3s ease',
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 8px 40px rgba(108,99,255,0.25)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {children}
    </div>
  );
}