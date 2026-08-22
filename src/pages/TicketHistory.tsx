import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Clock3, CheckCircle, AlertTriangle, MessageSquare,
  RefreshCw, ChevronRight, User, Bot
} from 'lucide-react';
import { getChatSessions, type ChatSessionResponse, type MessageResponse } from '../services/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CATEGORY_STYLES: Record<string, { badge: string; dot: string }> = {
  billing:        { badge: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',   dot: 'bg-amber-500' },
  technical:      { badge: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',       dot: 'bg-blue-500' },
  account_access: { badge: 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300', dot: 'bg-violet-500' },
  unknown:        { badge: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',       dot: 'bg-slate-400' },
};

interface TicketRow {
  sessionId: string;
  sessionTitle: string;
  sessionDate: string;
  userMessage: string;
  category: string;
  categoryConfidence: number;
  retrievalConfidence: number;
  status: 'resolved' | 'escalated';
  escalationReason: string;
  timestamp: string;
}

function extractTicketRows(sessions: ChatSessionResponse[]): TicketRow[] {
  const rows: TicketRow[] = [];
  for (const sess of sessions) {
    // Find the first assistant message with ticket metadata
    const assistantMsgs = sess.messages.filter(m => m.role === 'assistant' && m.ticket_category);
    const userMsgs = sess.messages.filter(m => m.role === 'user');

    assistantMsgs.forEach((am, idx) => {
      const um = userMsgs[idx];
      if (!am.ticket_category) return;
      rows.push({
        sessionId: sess.id,
        sessionTitle: sess.title,
        sessionDate: sess.date,
        userMessage: um?.content ?? '',
        category: am.ticket_category,
        categoryConfidence: am.ticket_category_confidence ?? 0,
        retrievalConfidence: am.ticket_retrieval_confidence ?? 0,
        status: (am.ticket_status as 'resolved' | 'escalated') ?? 'resolved',
        escalationReason: am.ticket_escalation_reason ?? '',
        timestamp: am.timestamp,
      });
    });
  }
  return rows;
}

// ─── Component ────────────────────────────────────────────────────────────────

const TicketHistory: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSessionResponse[]>([]);
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'resolved' | 'escalated'>('all');

  const load = async () => {
    setLoading(true);
    try {
      const data = await getChatSessions();
      setSessions(data);
      setTickets(extractTicketRows(data));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const filtered = filterStatus === 'all' ? tickets : tickets.filter(t => t.status === filterStatus);
  const resolvedCount   = tickets.filter(t => t.status === 'resolved').length;
  const escalatedCount  = tickets.filter(t => t.status === 'escalated').length;
  const avgCatConf      = tickets.length ? Math.round(tickets.reduce((a, t) => a + t.categoryConfidence, 0) / tickets.length * 100) : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-800 dark:text-slate-200 flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Clock3 className="w-5 h-5 text-white" />
          </span>
          Ticket History
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 ml-1">
          All previous support interactions with triage classification and escalation outcomes
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Tickets',        value: tickets.length,   color: 'text-indigo-500' },
          { label: 'AI Resolved',          value: resolvedCount,    color: 'text-emerald-500' },
          { label: 'Escalated',            value: escalatedCount,   color: 'text-amber-500' },
          { label: 'Avg Classification',   value: `${avgCatConf}%`, color: 'text-blue-500' },
        ].map(s => (
          <div key={s.label} className="bg-white/60 dark:bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-200/50 dark:border-white/8 p-4 shadow-sm">
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2">
        {(['all', 'resolved', 'escalated'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilterStatus(f)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              filterStatus === f
                ? 'bg-indigo-500 text-white shadow-md'
                : 'bg-white/60 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-white/10 hover:border-indigo-300'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            <span className="ml-1.5 text-[9px] opacity-70">
              {f === 'all' ? tickets.length : f === 'resolved' ? resolvedCount : escalatedCount}
            </span>
          </button>
        ))}
        <button onClick={load} className="ml-auto p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>

      {/* Ticket table */}
      <div className="bg-white/60 dark:bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-200/50 dark:border-white/8 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 flex justify-center">
            <div className="flex items-center gap-2 text-slate-400 text-sm"><RefreshCw className="w-4 h-4 animate-spin" /> Loading ticket history...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-sm text-slate-400">No tickets found.</p>
            <p className="text-xs text-slate-400 mt-1">Start a support chat to create your first ticket.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100/60 dark:divide-white/5">
            {filtered.map((t, i) => {
              const styles = CATEGORY_STYLES[t.category] || CATEGORY_STYLES.unknown;
              const isOpen = expanded === `${t.sessionId}-${i}`;
              const label = t.category.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());

              return (
                <motion.div key={`${t.sessionId}-${i}`} layout>
                  <button
                    onClick={() => setExpanded(isOpen ? null : `${t.sessionId}-${i}`)}
                    className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors text-left"
                  >
                    {/* Status dot */}
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${t.status === 'resolved' ? 'bg-emerald-500' : 'bg-amber-500'}`} />

                    {/* Issue */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">{t.userMessage || t.sessionTitle}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{t.sessionDate} · {t.timestamp}</p>
                    </div>

                    {/* Category badge */}
                    <span className={`hidden sm:inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${styles.badge}`}>
                      {label}
                    </span>

                    {/* Confidence */}
                    <span className="hidden md:block text-[10px] font-semibold text-slate-500 w-16 text-center">
                      {Math.round(t.categoryConfidence * 100)}%
                    </span>

                    {/* Status */}
                    {t.status === 'resolved' ? (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold">
                        <CheckCircle className="w-2.5 h-2.5" /> Resolved
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 text-[9px] font-bold">
                        <AlertTriangle className="w-2.5 h-2.5" /> Escalated
                      </span>
                    )}

                    <ChevronRight className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                  </button>

                  {/* Expanded detail */}
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-slate-100/60 dark:border-white/5 px-5 py-4 bg-slate-50/40 dark:bg-slate-800/20 space-y-3"
                    >
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[10px]">
                        <div>
                          <p className="text-slate-400 font-medium uppercase tracking-wider mb-0.5">Category</p>
                          <p className="font-bold text-slate-700 dark:text-slate-300">{label}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 font-medium uppercase tracking-wider mb-0.5">Classification</p>
                          <p className="font-bold text-slate-700 dark:text-slate-300">{Math.round(t.categoryConfidence * 100)}%</p>
                        </div>
                        <div>
                          <p className="text-slate-400 font-medium uppercase tracking-wider mb-0.5">KB Match</p>
                          <p className="font-bold text-slate-700 dark:text-slate-300">{Math.round(t.retrievalConfidence * 100)}%</p>
                        </div>
                        <div>
                          <p className="text-slate-400 font-medium uppercase tracking-wider mb-0.5">Outcome</p>
                          <p className={`font-bold ${t.status === 'resolved' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                            {t.status === 'resolved' ? 'AI Resolved' : 'Human Escalated'}
                          </p>
                        </div>
                      </div>
                      {t.status === 'escalated' && t.escalationReason && (
                        <div className="p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40">
                          <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">Escalation Reason</p>
                          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{t.escalationReason}</p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketHistory;
