import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Mic, Zap } from 'lucide-react';

export default function ChatInput({ onSend, onUploadClick, disabled }) {
  const [text, setText] = useState('');
  const [reasoning, setReasoning] = useState(false);
  const [focused, setFocused] = useState(false);
  const [recording, setRecording] = useState(false);
  const ref = useRef(null);

  // Ripple on send button click
  const sendRippleRef = useRef(null);

  const triggerRipple = () => {
    const el = sendRippleRef.current;
    if (!el) return;
    el.classList.remove('warps-ripple-active');
    void el.offsetWidth;
    el.classList.add('warps-ripple-active');
  };

  const send = () => {
    const t = text.trim();
    if (!t || disabled) return;
    triggerRipple();
    onSend(t, reasoning);
    setText('');
    if (ref.current) ref.current.style.height = 'auto';
  };

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const autoResize = (e) => {
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px';
    setText(e.target.value);
  };

  const canSend = text.trim() && !disabled;

  return (
    <>
      <style>{`
        @keyframes warps-input-glow {
          0%, 100% { box-shadow: 0 0 0 3px rgba(108,99,255,0.12), 0 4px 24px rgba(108,99,255,0.15); }
          50%       { box-shadow: 0 0 0 4px rgba(108,99,255,0.18), 0 8px 32px rgba(108,99,255,0.22); }
        }
        @keyframes warps-send-pop {
          0%   { transform: scale(1); }
          40%  { transform: scale(0.88); }
          70%  { transform: scale(1.12); }
          100% { transform: scale(1); }
        }
        @keyframes warps-ripple {
          from { transform: scale(0); opacity: 0.6; }
          to   { transform: scale(2.8); opacity: 0; }
        }
        @keyframes warps-mic-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.5); }
          50%       { box-shadow: 0 0 0 8px rgba(239,68,68,0); }
        }
        @keyframes warps-reason-shine {
          0%   { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
        .warps-ripple-active::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: rgba(255,255,255,0.5);
          animation: warps-ripple 0.5s ease-out forwards;
        }
        .warps-icon-btn {
          transition: transform 0.18s cubic-bezier(0.34,1.56,0.64,1),
                      background 0.18s ease, box-shadow 0.18s ease;
        }
        .warps-icon-btn:hover {
          transform: scale(1.12);
        }
        .warps-icon-btn:active {
          transform: scale(0.93);
        }
      `}</style>

      <div style={{
        padding: '0.85rem 1.25rem 1rem',
        background: 'rgba(255,255,255,0.7)',
        backdropFilter: 'blur(28px)',
        borderTop: '1px solid rgba(108,99,255,0.1)',
        position: 'relative',
      }}>
        {/* Subtle top glow line */}
        <div style={{
          position: 'absolute', top: 0, left: '10%', right: '10%', height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(108,99,255,0.4), rgba(157,235,255,0.4), transparent)',
          opacity: focused ? 1 : 0,
          transition: 'opacity 0.4s ease',
        }} />

        <div style={{
          display: 'flex', alignItems: 'flex-end', gap: '0.65rem',
          background: focused
            ? 'rgba(255,255,255,0.97)'
            : 'rgba(255,255,255,0.88)',
          border: `1.5px solid ${focused ? '#6C63FF' : 'rgba(108,99,255,0.2)'}`,
          borderRadius: '1.6rem',
          padding: '0.7rem 0.8rem 0.7rem 1rem',
          animation: focused ? 'warps-input-glow 3s ease-in-out infinite' : 'none',
          boxShadow: focused
            ? 'none'
            : '0 2px 16px rgba(0,0,0,0.06)',
          transition: 'border-color 0.3s ease, background 0.3s ease',
          position: 'relative',
        }}>

          {/* Paperclip */}
          <button
            className="warps-icon-btn"
            onClick={onUploadClick}
            title="Upload PDF"
            style={{
              background: 'rgba(108,99,255,0.08)',
              border: 'none', borderRadius: '50%',
              width: 36, height: 36, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(108,99,255,0.18)';
              e.currentTarget.style.boxShadow = '0 0 12px rgba(108,99,255,0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(108,99,255,0.08)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <Paperclip size={15} color="#6C63FF" />
          </button>

          {/* Textarea */}
          <textarea
            ref={ref}
            value={text}
            onChange={autoResize}
            onKeyDown={onKey}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Ask anything…"
            rows={1}
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              resize: 'none', fontFamily: 'DM Sans', fontSize: '0.93rem',
              color: '#111827', lineHeight: 1.65,
              maxHeight: 160, overflowY: 'auto',
            }}
          />

          {/* Right controls */}
          <div style={{ display: 'flex', gap: '0.45rem', flexShrink: 0, alignItems: 'center' }}>

            {/* Mic */}
            <button
              className="warps-icon-btn"
              title="Voice input"
              onClick={() => setRecording(!recording)}
              style={{
                background: recording ? 'rgba(239,68,68,0.12)' : 'rgba(108,99,255,0.08)',
                border: 'none', borderRadius: '50%',
                width: 36, height: 36,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                animation: recording ? 'warps-mic-pulse 1s ease-in-out infinite' : 'none',
              }}
            >
              <Mic size={15} color={recording ? '#EF4444' : '#6C63FF'} />
            </button>

            {/* Reason toggle */}
            <button
              onClick={() => setReasoning(!reasoning)}
              title="Reasoning mode"
              style={{
                border: `1px solid ${reasoning ? '#6C63FF' : 'transparent'}`,
                borderRadius: '99px',
                padding: '5px 11px',
                display: 'flex', alignItems: 'center', gap: 4,
                cursor: 'pointer', fontSize: '0.72rem',
                fontWeight: 700, letterSpacing: '0.03em',
                transition: 'all 0.25s ease',
                position: 'relative', overflow: 'hidden',
                background: reasoning
                  ? 'linear-gradient(135deg, #6C63FF, #9DEBFF)'
                  : 'rgba(108,99,255,0.07)',
                color: reasoning ? 'white' : '#9CA3AF',
                boxShadow: reasoning ? '0 4px 14px rgba(108,99,255,0.4)' : 'none',
              }}
            >
              <Zap size={11} fill={reasoning ? 'white' : 'none'} />
              Reason
            </button>

            {/* Send */}
            <div ref={sendRippleRef} style={{ position: 'relative' }}>
              <button
                onClick={send}
                disabled={!canSend}
                style={{
                  background: canSend
                    ? 'linear-gradient(135deg, #6C63FF, #8A7DFF)'
                    : 'rgba(108,99,255,0.12)',
                  border: 'none', borderRadius: '50%',
                  width: 40, height: 40,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: canSend ? 'pointer' : 'not-allowed',
                  boxShadow: canSend
                    ? '0 4px 18px rgba(108,99,255,0.5), 0 0 0 0 rgba(108,99,255,0.3)'
                    : 'none',
                  transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
                  transform: canSend ? 'scale(1)' : 'scale(0.93)',
                }}
                onMouseEnter={(e) => canSend && (e.currentTarget.style.transform = 'scale(1.1)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = canSend ? 'scale(1)' : 'scale(0.93)')}
                onMouseDown={(e) => canSend && (e.currentTarget.style.transform = 'scale(0.92)')}
                onMouseUp={(e) => canSend && (e.currentTarget.style.transform = 'scale(1.05)')}
              >
                <Send size={15} color={canSend ? 'white' : '#9CA3AF'}
                  style={{ transform: 'rotate(-15deg)', marginLeft: 1 }} />
              </button>
            </div>
          </div>
        </div>

        <p style={{
          textAlign: 'center', fontSize: '0.68rem',
          color: '#D1D5DB', fontFamily: 'DM Sans',
          marginTop: '0.5rem', letterSpacing: '0.02em',
        }}>
          WARPS can make mistakes — always verify important info.
        </p>
      </div>
    </>
  );
}