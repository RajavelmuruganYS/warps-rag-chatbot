import { motion } from "framer-motion";
import { useEffect, useRef } from "react";

// ─── GlassCard ────────────────────────────────────────────────────────────────
export const GlassCard = ({ children, className = "", hover = false, onClick }) => (
  <motion.div
    onClick={onClick}
    whileHover={hover ? { y: -4, scale: 1.01 } : {}}
    className={`
      backdrop-blur-xl bg-white/60 border border-white/80
      shadow-[0_8px_32px_rgba(99,102,241,0.10),inset_0_1px_0_rgba(255,255,255,0.9)]
      rounded-[22px] ${className}
    `}
  >
    {children}
  </motion.div>
);

// ─── AnimatedButton ───────────────────────────────────────────────────────────
export const AnimatedButton = ({
  children,
  variant = "primary",
  className = "",
  onClick,
  disabled = false,
  type = "button",
}) => {
  const base =
    "relative inline-flex items-center gap-2 font-semibold rounded-2xl px-5 py-2.5 transition-all text-sm select-none";
  const variants = {
    primary:
      "bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 text-white shadow-[0_4px_24px_rgba(99,102,241,0.35)] hover:shadow-[0_6px_32px_rgba(99,102,241,0.55)] hover:-translate-y-0.5 active:translate-y-0",
    ghost:
      "bg-white/70 border border-indigo-100 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-200",
    danger:
      "bg-red-50 border border-red-100 text-red-500 hover:bg-red-100",
  };
  return (
    <motion.button
      type={type}
      disabled={disabled}
      whileTap={{ scale: 0.96 }}
      className={`${base} ${variants[variant]} ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} ${className}`}
      onClick={onClick}
    >
      {children}
    </motion.button>
  );
};

// ─── GradientHeading ──────────────────────────────────────────────────────────
export const GradientHeading = ({ children, className = "", as: Tag = "h1" }) => (
  <Tag
    className={`font-extrabold bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-500 bg-clip-text text-transparent ${className}`}
  >
    {children}
  </Tag>
);

// ─── AIOrb ────────────────────────────────────────────────────────────────────
export const AIOrb = ({ size = 80, className = "" }) => (
  <motion.div
    className={`relative rounded-full ${className}`}
    style={{ width: size, height: size }}
    animate={{ scale: [1, 1.08, 1], rotate: [0, 10, 0] }}
    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
  >
    <div
      className="absolute inset-0 rounded-full"
      style={{
        background:
          "radial-gradient(circle at 35% 35%, #c4b5fd, #7c3aed 60%, #4338ca)",
        boxShadow: "0 0 40px rgba(139,92,246,0.45), 0 0 80px rgba(99,102,241,0.2)",
      }}
    />
    <motion.div
      className="absolute inset-0 rounded-full"
      style={{
        background:
          "radial-gradient(circle at 60% 60%, rgba(255,255,255,0.3), transparent 70%)",
      }}
      animate={{ opacity: [0.4, 0.9, 0.4] }}
      transition={{ duration: 3, repeat: Infinity }}
    />
  </motion.div>
);

// ─── FloatingParticles ────────────────────────────────────────────────────────
export const FloatingParticles = ({ count = 20 }) => {
  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 2,
    delay: Math.random() * 5,
    duration: Math.random() * 6 + 6,
    color: ["#a78bfa", "#818cf8", "#60a5fa", "#c4b5fd"][Math.floor(Math.random() * 4)],
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: p.color,
            opacity: 0.5,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.7, 0.2],
            scale: [1, 1.4, 1],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

// ─── SourceCitation ───────────────────────────────────────────────────────────
export const SourceCitation = ({ sources = [] }) => {
  if (!sources.length) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {sources.map((src, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50/80 border border-indigo-100 text-indigo-700 text-xs font-medium"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          {src.source}
          {src.page && <span className="text-indigo-400">· p.{src.page}</span>}
        </motion.div>
      ))}
    </div>
  );
};

// ─── SessionCard ──────────────────────────────────────────────────────────────
export const SessionCard = ({ session, active, onClick, onDelete }) => (
  <motion.div
    whileHover={{ x: 4 }}
    onClick={onClick}
    className={`
      group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all text-sm
      ${active
        ? "bg-gradient-to-r from-indigo-100 to-violet-100 border border-indigo-200/60 text-indigo-800 font-semibold"
        : "hover:bg-white/70 text-slate-600 hover:text-slate-800"}
    `}
  >
    <span className="truncate flex-1">{session.title || "New Chat"}</span>
    <button
      onClick={(e) => { e.stopPropagation(); onDelete(session.session_id); }}
      className="ml-2 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-400 transition-all text-xs"
    >
      ×
    </button>
  </motion.div>
);