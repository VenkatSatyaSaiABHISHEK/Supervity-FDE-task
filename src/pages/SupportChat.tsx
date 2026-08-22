import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Plus, Trash2, MessageSquare, Loader2,
  FileText, Headphones, ChevronRight, CreditCard,
  Wrench, Lock, ThumbsUp, ThumbsDown, Sparkles,
  HelpCircle, X
} from 'lucide-react';
import {
  getChatSessions, createChatSession, deleteChatSession,
  streamChatMessage,
  type ChatSessionResponse, type MessageResponse, type TicketMeta
} from '../services/api';
import { TicketStatusCard } from '../components/TicketStatusCard';

// ─── Types ───────────────────────────────────────────────────────────────────

interface MessageWithMeta extends MessageResponse {
  ticketMeta?: TicketMeta;
  isStreaming?: boolean;
  feedback?: 'up' | 'down' | null;
}

// ─── Markdown-lite renderer ──────────────────────────────────────────────────
function renderContent(text: string) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code class="bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded text-[11px] font-mono">$1</code>')
    .replace(/\n/g, '<br/>');
}

// ─── Category definitions ─────────────────────────────────────────────────────
const CATEGORIES = [
  {
    key: 'billing',
    icon: CreditCard,
    label: 'Billing Issue',
    emoji: '💳',
    color: 'from-amber-500 to-orange-500',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-700/40',
    badgeText: 'text-amber-700 dark:text-amber-300',
    message: 'I have a billing issue with my account.',
    subOptions: [
      { label: 'Payment Failed', msg: 'My payment failed. What should I do?' },
      { label: 'Charged Twice', msg: 'I was charged twice for my subscription.' },
      { label: 'Refund Request', msg: 'I would like to request a refund.' },
      { label: 'Subscription Issue', msg: 'I have an issue with my subscription plan.' },
      { label: 'Wrong Amount', msg: 'I was charged the wrong amount on my invoice.' },
    ],
  },
  {
    key: 'technical',
    icon: Wrench,
    label: 'Technical Problem',
    emoji: '🔧',
    color: 'from-blue-500 to-cyan-500',
    badgeBg: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-700/40',
    badgeText: 'text-blue-700 dark:text-blue-300',
    message: 'Something is not working properly.',
    subOptions: [
      { label: 'App Crashing', msg: 'The application keeps crashing when I try to use it.' },
      { label: 'Error Message', msg: 'I am seeing an error message and cannot continue.' },
      { label: 'Upload Failing', msg: 'I cannot upload files. It keeps failing.' },
      { label: 'Slow Performance', msg: 'The application is extremely slow and lagging.' },
      { label: 'Feature Broken', msg: 'A specific feature is not working at all.' },
    ],
  },
  {
    key: 'account',
    icon: Lock,
    label: 'Account Access',
    emoji: '🔐',
    color: 'from-violet-500 to-purple-600',
    badgeBg: 'bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-700/40',
    badgeText: 'text-violet-700 dark:text-violet-300',
    message: 'I cannot access my account.',
    subOptions: [
      { label: 'Forgot Password', msg: 'I forgot my password and cannot log in.' },
      { label: 'Account Locked', msg: 'My account is locked. How do I unlock it?' },
      { label: 'Cannot Log In', msg: 'I cannot log in to my account even with the correct password.' },
      { label: 'Email Not Arriving', msg: 'I am not receiving the verification or reset email.' },
      { label: 'Two-Factor Issue', msg: 'I lost access to my two-factor authentication device.' },
    ],
  },
];

const DEMO_SCENARIOS = [
  { label: 'Billing', text: 'I was charged twice for my subscription this month.' },
  { label: 'Technical', text: 'The application crashes when I try to upload a PDF file.' },
  { label: 'Account Access', text: 'I forgot my password and cannot log in to my account.' },
  { label: 'Out of Scope', text: 'Who will win the cricket match tomorrow?' },
  { label: 'Ambiguous', text: 'My payment thing is not working and I don\'t know what happened.' },
];

// ─── Component ────────────────────────────────────────────────────────────────

const SupportChat: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSessionResponse[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSessionResponse | null>(null);
  const [messages, setMessages] = useState<MessageWithMeta[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pendingFiredRef = useRef(false);

  // ── Load sessions ─────────────────────────────────────────────────────────
  const loadSessions = useCallback(async () => {
    try {
      const data = await getChatSessions();
      setSessions(data);
      return data;
    } catch (e) {
      console.error('Failed loading sessions:', e);
      return [];
    }
  }, []);

  useEffect(() => {
    async function initSessions() {
      setLoadingSessions(true);
      const data = await loadSessions();
      if (data.length > 0) activateSession(data[0]);
      setLoadingSessions(false);
    }
    initSessions();
  }, []);

  // ── Handle pending message from landing page ──────────────────────────────
  useEffect(() => {
    if (pendingFiredRef.current) return;
    const pending = sessionStorage.getItem('pendingMessage');
    if (pending) {
      sessionStorage.removeItem('pendingMessage');
      pendingFiredRef.current = true;
      // Small delay to ensure sessions are loaded
      const t = setTimeout(() => handleSend(pending), 600);
      return () => clearTimeout(t);
    }
  }, [loadingSessions]);

  const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); };
  useEffect(() => { scrollToBottom(); }, [messages]);

  // ── Session helpers ───────────────────────────────────────────────────────
  const activateSession = (session: ChatSessionResponse) => {
    setActiveSession(session);
    setSelectedCategory(null);
    const mapped: MessageWithMeta[] = session.messages.map(m => {
      if (m.role === 'assistant' && m.ticket_category) {
        return {
          ...m,
          ticketMeta: {
            category: m.ticket_category,
            category_confidence: m.ticket_category_confidence ?? 0,
            retrieval_confidence: m.ticket_retrieval_confidence ?? 0,
            status: (m.ticket_status as 'resolved' | 'escalated') || 'resolved',
            escalation_reason: m.ticket_escalation_reason ?? '',
            label: m.ticket_category.replace('_', ' '),
            color: 'slate',
          }
        };
      }
      return m;
    });
    setMessages(mapped);
  };

  const handleNewSession = async () => {
    try {
      const session = await createChatSession('New Support Ticket');
      const updated = await loadSessions();
      const fresh = updated.find(s => s.id === session.id) || session;
      setActiveSession(fresh);
      setMessages([]);
      setSelectedCategory(null);
    } catch (e) {
      console.error('Failed creating session:', e);
    }
  };

  const handleDeleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteChatSession(id);
      const updated = await loadSessions();
      if (activeSession?.id === id) {
        if (updated.length > 0) activateSession(updated[0]);
        else { setActiveSession(null); setMessages([]); setSelectedCategory(null); }
      }
    } catch (e) {
      console.error('Failed deleting session:', e);
    }
  };

  // ── Send message ──────────────────────────────────────────────────────────
  const handleSend = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || isGenerating) return;

    let session = activeSession;
    if (!session) {
      try { session = await createChatSession(text.slice(0, 35)); await loadSessions(); }
      catch { return; }
    }

    setInput('');
    setSelectedCategory(null);
    setIsGenerating(true);

    const userMsg: MessageWithMeta = {
      id: `temp-user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      citations: []
    };

    const assistantMsgId = `temp-assistant-${Date.now()}`;
    const assistantMsg: MessageWithMeta = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      citations: [],
      isStreaming: true,
    };

    setMessages(prev => [...prev, userMsg, assistantMsg]);

    abortRef.current = new AbortController();

    await streamChatMessage(
      session.id,
      text,
      'qwen2.5:3b',
      (token) => {
        setMessages(prev => prev.map(m =>
          m.id === assistantMsgId ? { ...m, content: m.content + token } : m
        ));
      },
      (meta) => {
        setMessages(prev => prev.map(m =>
          m.id === assistantMsgId ? { ...m, ticketMeta: meta } : m
        ));
      },
      (citations) => {
        setMessages(prev => prev.map(m =>
          m.id === assistantMsgId ? { ...m, citations } : m
        ));
      },
      async () => {
        setMessages(prev => prev.map(m =>
          m.id === assistantMsgId ? { ...m, isStreaming: false } : m
        ));
        setIsGenerating(false);
        const updated = await loadSessions();
        const refreshed = updated.find(s => s.id === session!.id);
        if (refreshed) setActiveSession(refreshed);
      },
      (err) => {
        if ((err as any)?.name === 'AbortError') return;
        setMessages(prev => prev.map(m =>
          m.id === assistantMsgId ? { ...m, content: '⚠ Connection error. Please check that the backend is running.', isStreaming: false } : m
        ));
        setIsGenerating(false);
      },
      abortRef.current.signal
    );
  };

  const handleFeedback = (msgId: string, feedback: 'up' | 'down') => {
    setMessages(prev => prev.map(m =>
      m.id === msgId ? { ...m, feedback: m.feedback === feedback ? null : feedback } : m
    ));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // ── Empty state with quick categories ────────────────────────────────────
  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center h-full text-center py-10 space-y-6 px-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-indigo-500/30"
      >
        <Headphones className="w-10 h-10 text-white" />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <h2 className="text-xl font-black text-slate-800 dark:text-slate-200">Hi! How can I help you today?</h2>
        <p className="text-sm text-slate-400 mt-1.5 max-w-sm">
          Select a category below, pick an issue, or just type your question.
        </p>
      </motion.div>

      {/* No category selected — show 3 big buttons */}
      <AnimatePresence mode="wait">
        {!selectedCategory ? (
          <motion.div
            key="categories"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ delay: 0.25 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-xl"
          >
            {CATEGORIES.map(cat => (
              <motion.button
                key={cat.key}
                whileHover={{ y: -3, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setSelectedCategory(cat.key)}
                className={`flex flex-col items-center gap-2 p-5 rounded-2xl border-2 ${cat.badgeBg} transition-all shadow-sm hover:shadow-lg group`}
              >
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
                  <cat.icon className="w-5 h-5 text-white" />
                </div>
                <span className={`text-sm font-bold ${cat.badgeText}`}>{cat.label}</span>
              </motion.button>
            ))}
          </motion.div>
        ) : (
          // Category selected — show sub-options
          <motion.div
            key="suboptions"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="w-full max-w-lg space-y-2"
          >
            {/* Back button + category header */}
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={() => setSelectedCategory(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
              {(() => {
                const cat = CATEGORIES.find(c => c.key === selectedCategory)!;
                return (
                  <span className={`flex items-center gap-1.5 text-sm font-bold ${cat.badgeText}`}>
                    <cat.icon className="w-4 h-4" />
                    {cat.label} — What specifically?
                  </span>
                );
              })()}
            </div>

            {CATEGORIES.find(c => c.key === selectedCategory)?.subOptions.map((opt, i) => (
              <motion.button
                key={opt.label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ x: 4 }}
                onClick={() => handleSend(opt.msg)}
                disabled={isGenerating}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-sm text-slate-700 dark:text-slate-300 font-medium hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition-all text-left shadow-sm hover:shadow group"
              >
                <ChevronRight className="w-4 h-4 text-indigo-400 group-hover:text-indigo-600 transition-colors flex-shrink-0" />
                {opt.label}
              </motion.button>
            ))}

            {/* Or type custom */}
            <div className="pt-2 border-t border-slate-100 dark:border-white/5">
              <p className="text-xs text-slate-400 text-center">or type your specific issue below ↓</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Suggested demo */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-center">
        <p className="text-[11px] text-slate-400 mb-2 uppercase tracking-widest font-bold flex items-center justify-center gap-1.5">
          <Sparkles className="w-3 h-3" /> Try these examples
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {[
            'I was charged twice for my subscription.',
            'App crashes when I upload a file.',
            'I forgot my password.',
          ].map(ex => (
            <button
              key={ex}
              onClick={() => handleSend(ex)}
              disabled={isGenerating}
              className="px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-xs text-slate-500 dark:text-slate-400 hover:border-indigo-300 dark:hover:border-indigo-600 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
            >
              {ex}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-[calc(100vh-7rem)] gap-4 overflow-hidden">

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            key="sidebar"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 272, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="flex-shrink-0 overflow-hidden"
          >
            <div className="w-68 h-full flex flex-col bg-white/60 dark:bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-200/50 dark:border-white/8 shadow-lg overflow-hidden">
              {/* New Ticket */}
              <div className="p-3 border-b border-slate-200/40 dark:border-white/5">
                <button
                  onClick={handleNewSession}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-bold shadow-md hover:shadow-lg hover:scale-[1.01] transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Support Ticket
                </button>
              </div>

              {/* Session list */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {loadingSessions ? (
                  <div className="flex items-center justify-center py-8 text-slate-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs">No tickets yet</div>
                ) : (
                  sessions.map(sess => (
                    <div
                      key={sess.id}
                      onClick={() => activateSession(sess)}
                      className={`group flex items-center gap-2 p-2.5 rounded-xl cursor-pointer transition-all text-xs ${
                        activeSession?.id === sess.id
                          ? 'bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/40'
                          : 'hover:bg-slate-100/60 dark:hover:bg-slate-800/40 border border-transparent'
                      }`}
                    >
                      <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 ${activeSession?.id === sess.id ? 'text-indigo-500' : 'text-slate-400'}`} />
                      <span className="flex-1 truncate font-medium text-slate-700 dark:text-slate-300">{sess.title}</span>
                      <button
                        onClick={(e) => handleDeleteSession(sess.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:text-rose-500 transition-all text-slate-400"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Demo scenarios */}
              <div className="p-3 border-t border-slate-200/40 dark:border-white/5">
                <p className="text-[9px] uppercase font-bold tracking-widest text-slate-400 mb-2">Demo Scenarios</p>
                <div className="space-y-1">
                  {DEMO_SCENARIOS.map(s => (
                    <button
                      key={s.label}
                      onClick={() => handleSend(s.text)}
                      disabled={isGenerating}
                      className="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-lg text-[10px] font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-40"
                    >
                      <ChevronRight className="w-3 h-3 text-indigo-400 flex-shrink-0" />
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ── Chat Area ────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white/60 dark:bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-200/50 dark:border-white/8 shadow-lg">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200/40 dark:border-white/5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(v => !v)}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <MessageSquare className="w-4 h-4 text-slate-500" />
            </button>
            <div>
              <h1 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Headphones className="w-4 h-4 text-indigo-500" />
                {activeSession?.title || 'Support Chat'}
              </h1>
              <p className="text-[10px] text-slate-400 mt-0.5">AI-powered Tier-1 triage · Grounded answers · Human escalation</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">AI Online</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {messages.length === 0 && !isGenerating
            ? renderEmptyState()
            : messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              {/* Ticket status card */}
              {msg.role === 'assistant' && msg.ticketMeta && (
                <div className="w-full max-w-2xl">
                  <TicketStatusCard meta={msg.ticketMeta} />
                </div>
              )}

              {/* Message bubble */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`max-w-2xl rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-br-sm'
                    : 'bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-white/8 text-slate-700 dark:text-slate-200 rounded-bl-sm'
                }`}
              >
                {msg.role === 'user' ? (
                  <span>{msg.content}</span>
                ) : msg.isStreaming && !msg.content ? (
                  <span className="flex items-center gap-2 text-slate-400">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Analyzing your request...
                  </span>
                ) : (
                  <span dangerouslySetInnerHTML={{ __html: renderContent(msg.content) }} />
                )}

                {/* Streaming cursor */}
                {msg.isStreaming && msg.content && (
                  <span className="inline-block w-0.5 h-3.5 bg-indigo-400 ml-0.5 animate-pulse" />
                )}
              </motion.div>

              {/* Citations */}
              {msg.role === 'assistant' && msg.citations.length > 0 && !msg.isStreaming && (
                <div className="flex flex-wrap gap-1.5 mt-1.5 max-w-2xl">
                  {msg.citations.map(cite => (
                    <span key={cite} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-white/8">
                      <FileText className="w-2.5 h-2.5" />
                      {cite}
                    </span>
                  ))}
                </div>
              )}

              {/* Feedback buttons for assistant messages */}
              {msg.role === 'assistant' && !msg.isStreaming && msg.content && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="flex items-center gap-2 mt-1.5 max-w-2xl"
                >
                  <span className="text-[10px] text-slate-400">Was this helpful?</span>
                  <button
                    onClick={() => handleFeedback(msg.id, 'up')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all ${
                      msg.feedback === 'up'
                        ? 'bg-emerald-100 dark:bg-emerald-900/40 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 scale-105'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-white/10 text-slate-500 hover:border-emerald-300 hover:text-emerald-600 dark:hover:text-emerald-400'
                    }`}
                  >
                    <ThumbsUp className="w-3 h-3" />
                    {msg.feedback === 'up' ? 'Helpful!' : 'Yes'}
                  </button>
                  <button
                    onClick={() => handleFeedback(msg.id, 'down')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all ${
                      msg.feedback === 'down'
                        ? 'bg-rose-100 dark:bg-rose-900/40 border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300 scale-105'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-white/10 text-slate-500 hover:border-rose-300 hover:text-rose-600 dark:hover:text-rose-400'
                    }`}
                  >
                    <ThumbsDown className="w-3 h-3" />
                    {msg.feedback === 'down' ? 'Not helpful' : 'No'}
                  </button>
                </motion.div>
              )}

              <span className="text-[9px] text-slate-400 mt-1 px-1">{msg.timestamp}</span>
            </div>
          ))}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="px-5 py-4 border-t border-slate-200/40 dark:border-white/5">
          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isGenerating}
                rows={1}
                placeholder="Describe your support issue... (Enter to send, Shift+Enter for new line)"
                className="w-full resize-none px-4 py-3 pr-12 rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-800/60 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 focus:border-indigo-300 dark:focus:border-indigo-700 transition-all min-h-[48px] max-h-36 overflow-y-auto"
                style={{ fieldSizing: 'content' } as any}
              />
            </div>
            <button
              onClick={() => handleSend()}
              disabled={isGenerating || !input.trim()}
              className="flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[10px] text-slate-400 mt-2 text-center">
            SupportFlow AI answers from the support knowledge base only · Out-of-scope queries are escalated
          </p>
        </div>
      </div>
    </div>
  );
};

export default SupportChat;
