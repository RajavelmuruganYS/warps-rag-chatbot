import React, { useState } from 'react';
import { FileText, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

export default function CitationCard({ source }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.75)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(108,99,255,0.2)',
        borderRadius: '1rem',
        padding: '0.75rem 1rem',
        marginTop: '0.5rem',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 20px rgba(108,99,255,0.2)'}
      onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
      onClick={() => setExpanded(!expanded)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <FileText size={14} color="#6C63FF" />
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#6C63FF', fontFamily: 'Syne' }}>
          {source?.filename || 'Document'}
        </span>
        <span style={{ fontSize: '0.75rem', color: '#9CA3AF', marginLeft: 'auto' }}>
          {source?.page ? `p. ${source.page}` : ''}
        </span>
        {expanded ? <ChevronUp size={14} color="#9CA3AF" /> : <ChevronDown size={14} color="#9CA3AF" />}
      </div>
      {expanded && (
        <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#4B5563', lineHeight: 1.5 }}>
          {source?.preview || 'Click to preview this source in the document.'}
        </div>
      )}
    </div>
  );
}