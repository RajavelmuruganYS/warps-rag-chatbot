import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { X, Upload, FileText, CheckCircle, AlertCircle, Loader } from 'lucide-react';

import useChatStore from '../../store/chatStore';
import { uploadPDF, renameSession } from '../../services/api';
import toast from 'react-hot-toast';

// ── File status row ───────────────────────────────────────────────────────────

function FileItem({ file, status, error, uploadProgress, isProcessing }) {
  const getIcon = () => {
    if (status === 'success') return <CheckCircle size={16} style={{ color: '#10B981' }} />;
    if (status === 'error')   return <AlertCircle size={16} style={{ color: '#EF4444' }} />;
    return <Loader size={16} style={{ color: '#6C63FF', animation: 'spin 1s linear infinite' }} />;
  };

  const getStatusText = () => {
    if (status === 'uploading') return `Uploading… ${uploadProgress}%`;
    if (status === 'processing') return 'Processing (this may take a minute)…';
    if (status === 'success') return 'Done';
    if (status === 'error') return error;
    return '';
  };

  const borderColor =
    status === 'error'   ? 'rgba(239,68,68,0.2)'  :
    status === 'success' ? 'rgba(16,185,129,0.2)'  :
                           'rgba(108,99,255,0.15)';

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: '0.4rem',
      padding: '0.65rem 0.9rem',
      background: status === 'error' ? 'rgba(239,68,68,0.04)' : 'rgba(108,99,255,0.04)',
      borderRadius: '0.75rem',
      border: `1px solid ${borderColor}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <FileText size={16} style={{ color: '#6C63FF', flexShrink: 0 }} />
        <span style={{
          flex: 1, fontFamily: 'DM Sans', fontSize: '0.82rem', color: '#374151',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {file.name}
        </span>
        {status !== 'idle' && (
          <span style={{ flexShrink: 0 }}>{getIcon()}</span>
        )}
      </div>

      {/* Progress bar for uploading */}
      {status === 'uploading' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <div style={{
            height: 4, background: 'rgba(108,99,255,0.12)',
            borderRadius: 99, overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', width: `${uploadProgress}%`,
              background: 'linear-gradient(90deg, #6C63FF, #9DEBFF)',
              borderRadius: 99, transition: 'width 0.3s ease',
            }} />
          </div>
          <span style={{ fontSize: '0.7rem', color: '#9CA3AF', fontFamily: 'DM Sans' }}>
            Uploading… {uploadProgress}%
          </span>
        </div>
      )}

      {/* Processing spinner text */}
      {status === 'processing' && (
        <span style={{ fontSize: '0.7rem', color: '#6C63FF', fontFamily: 'DM Sans' }}>
          ⏳ Indexing PDF — OCR + embedding may take 1–3 minutes on CPU…
        </span>
      )}

      {/* Error text */}
      {status === 'error' && error && (
        <span style={{ fontSize: '0.72rem', color: '#EF4444', fontFamily: 'DM Sans' }}>
          {error}
        </span>
      )}

      {/* Success */}
      {status === 'success' && (
        <span style={{ fontSize: '0.7rem', color: '#10B981', fontFamily: 'DM Sans' }}>
          ✓ Indexed and ready to chat
        </span>
      )}
    </div>
  );
}

// ── Upload Zone ───────────────────────────────────────────────────────────────

export default function UploadZone({ sessionId, onClose }) {
  const { addUpload, activeSession, updateActiveSessionTitle } = useChatStore();

  // status: 'idle' | 'uploading' | 'processing' | 'success' | 'error'
  const [fileStates, setFileStates] = useState([]);
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback((accepted, rejected) => {
    if (rejected.length > 0) toast.error('Only PDF files are accepted.');
    setFileStates((prev) => [
      ...prev,
      ...accepted.map((file) => ({ file, status: 'idle', error: null, uploadProgress: 0 })),
    ]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: true,
  });

  const setFileStatus = (file, patch) => {
    setFileStates((prev) =>
      prev.map((fs) => fs.file === file ? { ...fs, ...patch } : fs)
    );
  };

  const handleUpload = async () => {
    if (!sessionId && sessionId !== 0) { toast.error('No active session.'); return; }

    const pending = fileStates.filter((fs) => fs.status === 'idle');
    if (pending.length === 0) { toast('No new files to upload.'); return; }

    setUploading(true);
    let allSuccess = true;
    let firstSuccessName = null;

    for (const item of pending) {
      // Phase 1: uploading (file bytes transfer) — shows progress bar
      setFileStatus(item.file, { status: 'uploading', uploadProgress: 0 });

      try {
        await uploadPDF(item.file, sessionId, (pct) => {
          // Once bytes are fully sent, switch to "processing"
          if (pct >= 100) {
            setFileStatus(item.file, { status: 'processing', uploadProgress: 100 });
          } else {
            setFileStatus(item.file, { uploadProgress: pct });
          }
        });

        // Phase 2 complete: ingestion finished
        setFileStatus(item.file, { status: 'success', error: null });
        addUpload(item.file);
        if (!firstSuccessName) firstSuccessName = item.file.name;
        toast.success(`${item.file.name} indexed!`);
      } catch (err) {
        allSuccess = false;
        const msg = err?.message || 'Upload failed';
        setFileStatus(item.file, { status: 'error', error: msg });
        toast.error(`${item.file.name}: ${msg}`);
      }
    }

    // Auto-rename session to PDF name if it's still "New Chat"
    if (firstSuccessName && activeSession?.title === 'New Chat') {
      try {
        const newTitle = firstSuccessName.replace(/\.pdf$/i, '').slice(0, 60);
        await renameSession(sessionId, newTitle);
        updateActiveSessionTitle(newTitle);
      } catch { /* non-fatal */ }
    }

    setUploading(false);

    // Auto-close if everything succeeded
    if (allSuccess) {
      setTimeout(() => onClose(), 1000);
    }
  };

  const removeFile = (file) => {
    setFileStates((prev) => prev.filter((fs) => fs.file !== file));
  };

  const hasIdle = fileStates.some((fs) => fs.status === 'idle');

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={!uploading ? onClose : undefined}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)',
          zIndex: 50, cursor: uploading ? 'default' : 'pointer',
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 51, width: '90%', maxWidth: 520,
        background: '#fff', borderRadius: '1.5rem', padding: '1.75rem',
        boxShadow: '0 24px 64px rgba(108,99,255,0.18)',
        display: 'flex', flexDirection: 'column', gap: '1.25rem',
      }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '1.1rem', color: '#111827', margin: 0 }}>
            Upload PDFs
          </h3>
          <button
            onClick={!uploading ? onClose : undefined}
            disabled={uploading}
            style={{
              background: 'transparent', border: 'none',
              cursor: uploading ? 'not-allowed' : 'pointer',
              color: '#9CA3AF', padding: '0.25rem', borderRadius: '0.5rem',
              display: 'flex', alignItems: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Upload tip */}
        <div style={{
          background: 'rgba(108,99,255,0.06)', border: '1px solid rgba(108,99,255,0.15)',
          borderRadius: '0.75rem', padding: '0.6rem 0.9rem',
          fontFamily: 'DM Sans', fontSize: '0.78rem', color: '#6C63FF',
          display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
        }}>
          <span style={{ fontSize: '1rem', flexShrink: 0 }}>💡</span>
          <span>
            Large PDFs with scanned pages take <strong>1–3 minutes</strong> to index on CPU.
            Please keep this window open until you see the green checkmark.
          </span>
        </div>

        {/* Drop zone */}
        <div
          {...getRootProps()}
          style={{
            border: `2px dashed ${isDragActive ? '#6C63FF' : 'rgba(108,99,255,0.3)'}`,
            borderRadius: '1.25rem', padding: '2rem 1.5rem',
            textAlign: 'center', cursor: 'pointer',
            background: isDragActive ? 'rgba(108,99,255,0.06)' : 'rgba(108,99,255,0.02)',
            transition: 'all 0.2s',
          }}
        >
          <input {...getInputProps()} />
          <Upload size={32} style={{ color: '#6C63FF', display: 'block', margin: '0 auto 0.75rem' }} />
          <p style={{ fontFamily: 'DM Sans', fontSize: '0.9rem', color: isDragActive ? '#6C63FF' : '#6B7280', margin: 0 }}>
            {isDragActive ? 'Drop your PDFs here' : 'Drag & drop PDFs here, or click to select'}
          </p>
          <p style={{ fontFamily: 'DM Sans', fontSize: '0.75rem', color: '#9CA3AF', marginTop: '0.35rem', marginBottom: 0 }}>
            Max 50 MB · PDF only
          </p>
        </div>

        {/* File list */}
        {fileStates.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 240, overflowY: 'auto' }}>
            {fileStates.map(({ file, status, error, uploadProgress }) => (
              <div key={file.name + file.size} style={{ position: 'relative' }}>
                <FileItem
                  file={file}
                  status={status}
                  error={error}
                  uploadProgress={uploadProgress}
                />
                {status === 'idle' && (
                  <button
                    onClick={() => removeFile(file)}
                    style={{
                      position: 'absolute', top: '0.65rem', right: '0.9rem',
                      background: 'transparent', border: 'none', cursor: 'pointer',
                      color: '#9CA3AF', padding: '2px', display: 'flex', alignItems: 'center',
                    }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button
            onClick={!uploading ? onClose : undefined}
            disabled={uploading}
            style={{
              padding: '0.55rem 1.25rem', borderRadius: '0.75rem',
              border: '1px solid rgba(108,99,255,0.2)', background: 'transparent',
              cursor: uploading ? 'not-allowed' : 'pointer',
              fontFamily: 'DM Sans', fontSize: '0.875rem',
              color: uploading ? '#C4C4C4' : '#6B7280', fontWeight: 500,
            }}
          >
            {uploading ? 'Please wait…' : 'Close'}
          </button>

          <button
            onClick={handleUpload}
            disabled={uploading || !hasIdle || fileStates.length === 0}
            style={{
              padding: '0.55rem 1.5rem', borderRadius: '0.75rem', border: 'none',
              background: uploading || !hasIdle ? 'rgba(108,99,255,0.4)' : '#6C63FF',
              cursor: uploading || !hasIdle ? 'not-allowed' : 'pointer',
              fontFamily: 'DM Sans', fontSize: '0.875rem', color: '#fff',
              fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem',
              transition: 'background 0.2s',
            }}
          >
            {uploading ? (
              <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Processing…</>
            ) : (
              <><Upload size={14} /> Upload</>
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}