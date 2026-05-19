import { create } from 'zustand';

// ── Persist helpers ────────────────────────────────────────────────────────

const loadPersistedSession = () => {
  try {
    const raw = sessionStorage.getItem('warps_active_session');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

const persistSession = (session) => {
  try {
    if (session) sessionStorage.setItem('warps_active_session', JSON.stringify(session));
    else sessionStorage.removeItem('warps_active_session');
  } catch {}
};

// ── Persist uploads per session ID ─────────────────────────────────────────

const uploadsKey = (sessionId) => `warps_uploads_${sessionId}`;

const loadPersistedUploads = (sessionId) => {
  if (!sessionId) return [];
  try {
    const raw = sessionStorage.getItem(uploadsKey(sessionId));
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};

const persistUploads = (sessionId, uploads) => {
  if (!sessionId) return;
  try {
    // Store only serializable metadata — File objects can't survive sessionStorage.
    // IMPORTANT: preserve BOTH `name` AND `filename` so PDF pickers always find them.
    const serializable = uploads.map((f) => {
      if (f instanceof File) {
        return { name: f.name, filename: f.name, size: f.size, type: f.type, _isFileMeta: true };
      }
      // Already a plain object — make sure filename is always set
      return {
        ...f,
        name: f.name || f.filename || String(f),
        filename: f.filename || f.name || String(f),
      };
    });
    sessionStorage.setItem(uploadsKey(sessionId), JSON.stringify(serializable));
  } catch {}
};

const clearPersistedUploads = (sessionId) => {
  if (!sessionId) return;
  try { sessionStorage.removeItem(uploadsKey(sessionId)); } catch {}
};

// ── Store ──────────────────────────────────────────────────────────────────

const useChatStore = create((set, get) => {
  const restoredSession = loadPersistedSession();
  const restoredUploads = restoredSession
    ? loadPersistedUploads(restoredSession.id ?? restoredSession.session_id)
    : [];

  return {
    sessions: [],
    activeSession: restoredSession,
    messages: [],
    uploads: restoredUploads,   // ← rehydrated on page load
    isThinking: false,
    mascotState: 'idle',

    setSessions: (fn) =>
      set((s) => ({
        sessions: typeof fn === 'function' ? fn(s.sessions) : fn,
      })),

    setActiveSession: (session) => {
      persistSession(session);
      const sessionId = session?.id ?? session?.session_id ?? null;
      // Rehydrate uploads for the session being switched to
      const uploads = sessionId ? loadPersistedUploads(sessionId) : [];
      set({ activeSession: session, uploads });
    },

    setMessages: (messages) =>
      set({ messages: Array.isArray(messages) ? messages : [] }),

    addMessage: (msg) =>
      set((s) => ({ messages: [...s.messages, msg] })),

    setUploads: (uploads) => {
      const sessionId =
        get().activeSession?.id ?? get().activeSession?.session_id ?? null;
      // Normalise before persisting so both name & filename are always present
      const normalised = (uploads || []).map((f) => ({
        ...f,
        name: f.name || f.filename || String(f),
        filename: f.filename || f.name || String(f),
      }));
      persistUploads(sessionId, normalised);
      set({ uploads: normalised });
    },

    addUpload: (file) => {
      const entry = file instanceof File
        ? { name: file.name, filename: file.name, size: file.size, type: file.type, _isFileMeta: true }
        : { ...file, name: file.name || file.filename || String(file), filename: file.filename || file.name || String(file) };
      const next = [...get().uploads, entry];
      const sessionId =
        get().activeSession?.id ?? get().activeSession?.session_id ?? null;
      persistUploads(sessionId, next);
      set({ uploads: next });
    },

    setIsThinking: (v) => set({ isThinking: v }),
    setMascotState: (state) => set({ mascotState: state }),

    updateActiveSessionTitle: (title) => {
      const current = get().activeSession;
      if (!current) return;
      const updated = { ...current, title };
      persistSession(updated);
      set((s) => ({
        activeSession: updated,
        sessions: s.sessions.map((sess) =>
          sess.id === current.id ? { ...sess, title } : sess
        ),
      }));
    },

    clearChat: () => {
      const sessionId =
        get().activeSession?.id ?? get().activeSession?.session_id ?? null;
      clearPersistedUploads(sessionId);
      persistSession(null);
      set({ messages: [], uploads: [], activeSession: null });
    },
  };
});

export default useChatStore;