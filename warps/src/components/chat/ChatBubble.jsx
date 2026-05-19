import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, ThumbsUp, ThumbsDown, RefreshCw, Check } from 'lucide-react';
import CitationCard from './CitationCard';
import toast from 'react-hot-toast';

export default function ChatBubble({ message, onRegenerate }) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState(null); // null | 'up' | 'down'

  const copy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    toast.success('Copied!', { duration: 1500 });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <style>{`
        @keyframes warps-fade-up {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes warps-avatar-glow {
          0%, 100% { box-shadow: 0 0 14px rgba(108,99,255,0.45), 0 0 0 0 rgba(108,99,255,0.2); }
          50%       { box-shadow: 0 0 24px rgba(108,99,255,0.7), 0 0 32px rgba(157,235,255,0.2); }
        }
        @keyframes warps-user-shimmer {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .warps-action-btn {
          transition: transform 0.18s cubic-bezier(0.34,1.56,0.64,1),
                      color 0.18s ease, background 0.18s ease, box-shadow 0.18s ease;
        }
        .warps-action-btn:hover {
          transform: scale(1.15);
          color: #6C63FF !important;
          background: rgba(108,99,255,0.1) !important;
          box-shadow: 0 0 10px rgba(108,99,255,0.2);
        }
        .warps-action-btn:active { transform: scale(0.92); }
      `}</style>

      <div style={{
        display: 'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        alignItems: 'flex-end',
        gap: '0.75rem',
        marginBottom: '1.5rem',
        animation: 'warps-fade-up 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards',
      }}>

        {/* AI Avatar */}
        {!isUser && (
          <div style={{
            width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #6C63FF 0%, #9DEBFF 100%)',
            overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'warps-avatar-glow 3s ease-in-out infinite',
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(135deg, rgba(255,255,255,0.2), transparent)',
              borderRadius: '50%',
            }} />
            <img
              src="/mascot/icon.png"
              alt="WARPS"
              style={{ width: '100%', height: '100%', objectFit: 'contain', position: 'relative', zIndex: 1 }}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.insertAdjacentHTML('beforeend',
                  '<span style="color:white;font-weight:800;font-size:15px;position:relative;z-index:1">W</span>');
              }}
            />
          </div>
        )}

        <div style={{ maxWidth: isUser ? '70%' : '78%' }}>

          {/* Bubble */}
          <div style={{
            background: isUser
              ? 'linear-gradient(135deg, #6C63FF 0%, #8A7DFF 50%, #9DEBFF 100%)'
              : 'rgba(255,255,255,0.88)',
            backgroundSize: isUser ? '200% 200%' : undefined,
            animation: isUser ? 'warps-user-shimmer 6s ease infinite' : undefined,
            backdropFilter: isUser ? 'none' : 'blur(20px)',
            border: isUser ? 'none' : '1px solid rgba(108,99,255,0.15)',
            borderRadius: isUser
              ? '1.4rem 1.4rem 0.3rem 1.4rem'
              : '1.4rem 1.4rem 1.4rem 0.3rem',
            padding: '0.95rem 1.25rem',
            color: isUser ? 'white' : '#111827',
            boxShadow: isUser
              ? '0 6px 28px rgba(108,99,255,0.45), inset 0 1px 0 rgba(255,255,255,0.2)'
              : '0 2px 16px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.95)',
            fontSize: '0.92rem',
            lineHeight: 1.7,
            position: 'relative', overflow: 'hidden',
          }}>
            {/* Glass highlight on AI bubble */}
            {!isUser && (
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: '50%',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.5), transparent)',
                borderRadius: '1.4rem 1.4rem 0 0',
                pointerEvents: 'none',
              }} />
            )}

            <div style={{ position: 'relative', zIndex: 1 }}>
              <ReactMarkdown
                components={{
                  code({ inline, className, children }) {
                    const lang = /language-(\w+)/.exec(className || '')?.[1];
                    return !inline ? (
                      <div style={{
                        borderRadius: '0.75rem', overflow: 'hidden',
                        border: '1px solid rgba(108,99,255,0.15)',
                        margin: '0.5rem 0',
                        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                      }}>
                        <SyntaxHighlighter
                          style={oneLight}
                          language={lang}
                          PreTag="div"
                          customStyle={{ margin: 0, borderRadius: 0, background: 'rgba(248,247,255,0.9)' }}
                        >
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                      </div>
                    ) : (
                      <code style={{
                        background: isUser ? 'rgba(255,255,255,0.25)' : 'rgba(108,99,255,0.1)',
                        padding: '2px 7px', borderRadius: '5px',
                        fontSize: '0.84em',
                        color: isUser ? 'white' : '#6C63FF',
                        fontFamily: 'monospace',
                      }}>{children}</code>
                    );
                  },
                  p: ({ children }) => (
                    <p style={{ margin: '0 0 0.6em 0' }}>{children}</p>
                  ),
                  ul: ({ children }) => (
                    <ul style={{ paddingLeft: '1.4rem', margin: '0.4em 0' }}>{children}</ul>
                  ),
                  li: ({ children }) => (
                    <li style={{ marginBottom: '0.25em' }}>{children}</li>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          </div>

          {/* Citations */}
          {message.sources?.length > 0 && (
            <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {message.sources.map((s, i) => <CitationCard key={i} source={s} />)}
            </div>
          )}

          {/* Action buttons (AI only) */}
          {!isUser && (
            <div style={{
              display: 'flex', gap: '0.4rem', marginTop: '0.55rem',
              paddingLeft: '0.35rem', flexWrap: 'wrap',
            }}>
              {[
                {
                  icon: copied ? <Check size={12} /> : <Copy size={12} />,
                  label: copied ? 'Copied' : 'Copy',
                  onClick: copy,
                  active: copied,
                },
                {
                  icon: <ThumbsUp size={12} />,
                  label: 'Good',
                  onClick: () => setLiked(liked === 'up' ? null : 'up'),
                  active: liked === 'up',
                },
                {
                  icon: <ThumbsDown size={12} />,
                  label: 'Bad',
                  onClick: () => setLiked(liked === 'down' ? null : 'down'),
                  active: liked === 'down',
                },
                {
                  icon: <RefreshCw size={12} />,
                  label: 'Retry',
                  onClick: onRegenerate,
                  active: false,
                },
              ].map((btn) => (
                <button
                  key={btn.label}
                  className="warps-action-btn"
                  title={btn.label}
                  onClick={btn.onClick}
                  style={{
                    background: btn.active
                      ? 'rgba(108,99,255,0.12)'
                      : 'rgba(255,255,255,0.75)',
                    border: `1px solid ${btn.active ? 'rgba(108,99,255,0.35)' : 'rgba(108,99,255,0.12)'}`,
                    borderRadius: '99px',
                    padding: '4px 10px',
                    display: 'flex', alignItems: 'center', gap: 4,
                    cursor: 'pointer',
                    color: btn.active ? '#6C63FF' : '#9CA3AF',
                    fontSize: '0.72rem', fontWeight: 600,
                    backdropFilter: 'blur(8px)',
                    boxShadow: btn.active
                      ? '0 0 10px rgba(108,99,255,0.2)'
                      : '0 1px 4px rgba(0,0,0,0.05)',
                  }}
                >
                  {btn.icon}
                  {btn.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}