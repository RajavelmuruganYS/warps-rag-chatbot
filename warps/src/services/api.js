import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// ── Standard API instance (60s timeout) ─────────────────────────────────────
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
});

// ── Feature API instance (3 min timeout — LLM generation can be slow) ────────
const featureApi = axios.create({
  baseURL: BASE_URL,
  timeout: 180000,
});

// ── Upload API instance (10 min timeout — ingestion is slow on CPU) ──────────
const uploadApi = axios.create({
  baseURL: BASE_URL,
  timeout: 600000,
});

// ── Shared response interceptor ──────────────────────────────────────────────
const responseInterceptor = (response) => response.data;
const errorInterceptor = (error) => {
  const message =
    error?.response?.data?.detail ||
    error?.response?.data?.message ||
    error?.message ||
    'An unexpected error occurred';
  return Promise.reject(
    new Error(typeof message === 'string' ? message : JSON.stringify(message))
  );
};

api.interceptors.response.use(responseInterceptor, errorInterceptor);
featureApi.interceptors.response.use(responseInterceptor, errorInterceptor);
uploadApi.interceptors.response.use(responseInterceptor, errorInterceptor);

// ── Normalizers ──────────────────────────────────────────────────────────────

export const normalizeSession = (raw) => {
  if (!raw) return null;
  const id =
    raw?.id ?? raw?.session_id ?? raw?.data?.id ?? raw?.data?.session_id ?? null;
  const title = raw?.title ?? raw?.name ?? raw?.data?.title ?? 'New Chat';
  return id !== null ? { id, title } : null;
};

export const normalizeSessions = (raw) => {
  let arr = [];
  if (Array.isArray(raw)) arr = raw;
  else if (Array.isArray(raw?.sessions)) arr = raw.sessions;
  else if (Array.isArray(raw?.data)) arr = raw.data;
  return arr.map((s) => ({
    id: s.id ?? s.session_id,
    title: s.title ?? s.name ?? 'New Chat',
    created_at: s.created_at ?? null,
  }));
};

export const normalizeMessages = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.messages)) return raw.messages;
  if (Array.isArray(raw?.data)) return raw.data;
  return [];
};

export const normalizeText = (
  raw,
  keys = ['answer', 'response', 'summary', 'quiz', 'content', 'text']
) => {
  if (!raw) return '';
  for (const key of keys) {
    if (typeof raw[key] === 'string') return raw[key];
  }
  if (typeof raw === 'string') return raw;
  return JSON.stringify(raw);
};

// ── Sessions ─────────────────────────────────────────────────────────────────

export const createSession = async (title = 'New Chat') => {
  const raw = await api.post('/sessions/', { title });
  return normalizeSession(raw);
};

export const getSessions = async () => {
  const raw = await api.get('/sessions/');
  return normalizeSessions(raw);
};

export const deleteSession = async (sessionId) => {
  return api.delete(`/sessions/${sessionId}`);
};

export const renameSession = async (sessionId, title) => {
  const raw = await api.patch(`/sessions/${sessionId}`, { title });
  return normalizeSession(raw);
};

// ── Messages ─────────────────────────────────────────────────────────────────

export const getMessages = async (sessionId) => {
  const raw = await api.get(`/sessions/${sessionId}/messages`);
  return normalizeMessages(raw);
};

// ── Upload (uses uploadApi with 10-min timeout) ───────────────────────────────

export const uploadPDF = async (file, sessionId, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('session_id', String(sessionId));

  return uploadApi.post('/upload/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded * 100) / e.total));
      }
    },
  });
};

// ── Chat ─────────────────────────────────────────────────────────────────────

export const askQuestion = async (sessionId, question) => {
  const raw = await api.post('/chat/ask', { session_id: sessionId, question });
  return {
    answer: normalizeText(raw, ['answer', 'response', 'content', 'text']),
    sources: Array.isArray(raw?.sources) ? raw.sources : [],
  };
};

// ── Session PDFs ──────────────────────────────────────────────────────────────
// Uses the existing GET /upload/files/{session_id} endpoint.
// Returns list of { filename, display_name } — one entry per PDF.
export const getSessionPDFs = async (sessionId) => {
  console.log('[getSessionPDFs] Fetching PDFs for session:', sessionId);
  const raw = await api.get(`/upload/files/${sessionId}`);
  console.log('[getSessionPDFs] Raw response:', raw);
  // Backend returns { files: ["doc1.pdf", "doc2.pdf"], count: 2 }
  // raw is already response.data due to the interceptor
  const files = Array.isArray(raw?.files) ? raw.files : [];
  console.log('[getSessionPDFs] Parsed files:', files);
  if (files.length === 0) {
    throw new Error(`No PDFs found for session ${sessionId}. Check /upload/files/${sessionId} endpoint.`);
  }
  return files.map((filename) => ({
    filename,
    display_name: filename,
  }));
};

// ── Features ─────────────────────────────────────────────────────────────────
// All feature functions now accept an optional `filename` param.
// When provided, the backend filters vectorstore retrieval to that PDF only.

export const summarize = async (sessionId, filename = null) => {
  const body = filename ? { filename } : {};
  const raw = await featureApi.post(`/features/summarize/${sessionId}`, body);
  return {
    summary: normalizeText(raw, ['result', 'summary', 'content', 'text']),
  };
};

export const generateQuiz = async (sessionId, filename = null) => {
  const body = filename ? { filename } : {};
  const raw = await featureApi.post(`/features/quiz/${sessionId}`, body);
  return {
    quiz: normalizeText(raw, ['result', 'quiz', 'content', 'text']),
  };
};

export const generateFlashcards = async (sessionId, filename = null) => {
  const body = filename ? { filename } : {};
  const raw = await featureApi.post(`/features/flashcards/${sessionId}`, body);
  return {
    flashcards: Array.isArray(raw?.flashcards) ? raw.flashcards : [],
    count: raw?.count || 0,
    sessionId: raw?.session_id || sessionId,
  };
};

export const generateNotes = async (sessionId, filename = null) => {
  const body = filename ? { filename } : {};
  const raw = await featureApi.post(`/features/notes/${sessionId}`, body);
  return {
    notes: normalizeText(raw, ['result', 'notes', 'content', 'text']),
  };
};

export const explainTopic = async (sessionId, topic) => {
  const raw = await featureApi.post(`/features/explain/${sessionId}`, { topic });
  return {
    explanation: normalizeText(raw, ['result', 'explanation', 'content', 'text']),
  };
};

export default api;