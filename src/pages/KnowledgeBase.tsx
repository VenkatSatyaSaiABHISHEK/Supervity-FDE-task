import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, CheckCircle, Clock, Upload, Trash2,
  FileText, AlertCircle, RefreshCw, X
} from 'lucide-react';
import { getDocuments, deleteDocument, uploadDocument, type DocumentResponse } from '../services/api';

const SUPPORT_KB_ID = 'support-kb';

const TYPE_COLORS: Record<string, string> = {
  txt:   'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
  pdf:   'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400',
  docx:  'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400',
  image: 'bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400',
};

const KB_TOPICS = [
  { name: 'Billing',        desc: 'Billing cycles, plan changes, auto-renewal' },
  { name: 'Payments & Refunds', desc: 'Duplicate charges, refund eligibility, failed payments' },
  { name: 'Subscriptions',  desc: 'Plans, upgrades, cancellations, free trial' },
  { name: 'Technical',      desc: 'Crashes, upload failures, API errors, performance' },
  { name: 'Login & Access', desc: 'Login failures, account locked, 2FA, SSO' },
  { name: 'Password Reset', desc: 'Password reset steps, expired links, email issues' },
  { name: 'General FAQ',    desc: 'Support hours, SLA, contact info, GDPR' },
];

const KnowledgeBase: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const loadDocs = async () => {
    setLoading(true);
    try {
      const docs = await getDocuments(SUPPORT_KB_ID);
      setDocuments(docs);
    } catch {
      setError('Failed to load knowledge base documents.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadDocs(); }, []);

  const handleUpload = async (file: File) => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      await uploadDocument(file, SUPPORT_KB_ID, setUploadProgress);
      await loadDocs();
    } catch (e: any) {
      setError(e.message || 'Upload failed.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Remove this document from the knowledge base?')) return;
    try { await deleteDocument(id); setDocuments(prev => prev.filter(d => d.id !== id)); }
    catch { setError('Failed to delete document.'); }
  };

  const indexedCount = documents.filter(d => d.status === 'Indexed').length;

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-800 dark:text-slate-200 flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
            <BookOpen className="w-5 h-5 text-white" />
          </span>
          Knowledge Base
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 ml-1">
          Support documents indexed in ChromaDB · Used for RAG-grounded answers
        </p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Documents', value: documents.length, icon: FileText, color: 'text-indigo-500' },
          { label: 'Indexed',         value: indexedCount,     icon: CheckCircle, color: 'text-emerald-500' },
          { label: 'Processing',      value: documents.filter(d => d.status === 'Processing').length, icon: Clock, color: 'text-amber-500' },
        ].map(s => (
          <div key={s.label} className="bg-white/60 dark:bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-200/50 dark:border-white/8 p-4 flex items-center gap-3 shadow-sm">
            <s.icon className={`w-6 h-6 ${s.color}`} />
            <div>
              <p className="text-xl font-black text-slate-800 dark:text-slate-200">{s.value}</p>
              <p className="text-[10px] text-slate-500 font-medium">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* KB topic coverage */}
      <div className="bg-white/60 dark:bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-200/50 dark:border-white/8 p-5 shadow-sm">
        <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">Knowledge Base Coverage</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {KB_TOPICS.map(t => (
            <div key={t.name} className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/40 dark:border-white/5">
              <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{t.name}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{t.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upload zone */}
      <div className="bg-white/60 dark:bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-200/50 dark:border-white/8 p-5 shadow-sm">
        <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Add to Knowledge Base</h2>
        <div
          onDrop={handleDrop}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
            dragOver
              ? 'border-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20'
              : 'border-slate-200 dark:border-white/10 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/30'
          }`}
        >
          <Upload className={`w-8 h-8 mx-auto mb-2 ${dragOver ? 'text-indigo-500' : 'text-slate-400'}`} />
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
            {dragOver ? 'Drop to add to knowledge base' : 'Drop a file or click to upload'}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">PDF, DOCX, TXT, Images · Max 50MB</p>
        </div>
        <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.docx,.txt,.png,.jpg,.jpeg" onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0])} />

        {uploading && (
          <div className="mt-3 space-y-1">
            <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <motion.div className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full" animate={{ width: `${uploadProgress}%` }} />
            </div>
            <p className="text-[10px] text-slate-400 text-center">Uploading and indexing... {uploadProgress}%</p>
          </div>
        )}
      </div>

      {/* Document list */}
      <div className="bg-white/60 dark:bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-200/50 dark:border-white/8 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200/40 dark:border-white/5 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300">Indexed Documents</h2>
          <button onClick={loadDocs} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>

        {error && (
          <div className="mx-5 my-3 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
            <button onClick={() => setError(null)} className="ml-auto"><X className="w-3.5 h-3.5 text-red-400" /></button>
          </div>
        )}

        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="flex items-center gap-2 text-slate-400 text-sm"><RefreshCw className="w-4 h-4 animate-spin" /> Loading documents...</div>
          </div>
        ) : documents.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">No documents in the knowledge base yet.</div>
        ) : (
          <div className="divide-y divide-slate-100/60 dark:divide-white/5">
            {documents.map(doc => (
              <motion.div key={doc.id} layout className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                <div className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${TYPE_COLORS[doc.type] || TYPE_COLORS.txt}`}>
                  {doc.type}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">{doc.name}</p>
                  <p className="text-[10px] text-slate-400">{doc.size} · {doc.upload_date}</p>
                </div>
                <div className="flex items-center gap-2">
                  {doc.status === 'Indexed' && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold">
                      <CheckCircle className="w-2.5 h-2.5" /> Indexed
                    </span>
                  )}
                  {doc.status === 'Processing' && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 text-[9px] font-bold">
                      <Clock className="w-2.5 h-2.5 animate-spin" /> Processing
                    </span>
                  )}
                  {doc.status === 'Failed' && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-[9px] font-bold">
                      <AlertCircle className="w-2.5 h-2.5" /> Failed
                    </span>
                  )}
                  <button onClick={() => handleDelete(doc.id)} className="opacity-0 group-hover:opacity-100 p-1 rounded hover:text-rose-500 text-slate-400 transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default KnowledgeBase;
