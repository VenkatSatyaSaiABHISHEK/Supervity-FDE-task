import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertTriangle, HelpCircle } from 'lucide-react';
import type { TicketMeta } from '../services/api';

interface TicketStatusCardProps {
  meta: TicketMeta;
  className?: string;
}

const CATEGORY_STYLES: Record<string, { bg: string; border: string; badge: string; text: string }> = {
  billing: {
    bg:     'bg-amber-50 dark:bg-amber-950/20',
    border: 'border-amber-200 dark:border-amber-800/50',
    badge:  'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300',
    text:   'text-amber-700 dark:text-amber-300',
  },
  technical: {
    bg:     'bg-blue-50 dark:bg-blue-950/20',
    border: 'border-blue-200 dark:border-blue-800/50',
    badge:  'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
    text:   'text-blue-700 dark:text-blue-300',
  },
  account_access: {
    bg:     'bg-violet-50 dark:bg-violet-950/20',
    border: 'border-violet-200 dark:border-violet-800/50',
    badge:  'bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300',
    text:   'text-violet-700 dark:text-violet-300',
  },
  unknown: {
    bg:     'bg-slate-50 dark:bg-slate-800/30',
    border: 'border-slate-200 dark:border-slate-700/50',
    badge:  'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300',
    text:   'text-slate-600 dark:text-slate-300',
  },
};

export const TicketStatusCard: React.FC<TicketStatusCardProps> = ({ meta, className = '' }) => {
  const isEscalated = meta.status === 'escalated';
  const styles = CATEGORY_STYLES[meta.category] || CATEGORY_STYLES.unknown;
  const label = meta.label || meta.category.replace('_', ' ').toUpperCase();
  const catConf = Math.round(meta.category_confidence * 100);
  const retConf = Math.round(meta.retrieval_confidence * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: -6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25 }}
      className={`rounded-xl border p-3 mb-2 ${styles.bg} ${styles.border} ${className}`}
    >
      {/* Top row: category badge + confidence + status */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Category badge */}
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-widest uppercase ${styles.badge}`}>
          {meta.category === 'unknown' && <HelpCircle className="w-3 h-3" />}
          {label}
        </span>

        {/* Classification confidence */}
        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
          Classification: <span className={`font-bold ${styles.text}`}>{catConf}%</span>
        </span>

        {/* Divider */}
        <span className="text-slate-300 dark:text-slate-600 text-xs">·</span>

        {/* Status pill */}
        {isEscalated ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-400/30">
            <AlertTriangle className="w-3 h-3" />
            ESCALATED TO HUMAN SUPPORT
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-400/30">
            <CheckCircle className="w-3 h-3" />
            AI RESOLVED
          </span>
        )}
      </div>

      {/* Escalation details */}
      {isEscalated && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ delay: 0.1, duration: 0.2 }}
          className="mt-2 pt-2 border-t border-amber-200/60 dark:border-amber-800/40"
        >
          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
            <span className="font-bold text-amber-600 dark:text-amber-400">Reason: </span>
            {meta.escalation_reason}
          </p>
          <div className="flex items-center gap-4 mt-1.5">
            <span className="text-[10px] text-slate-500 dark:text-slate-500">
              KB Confidence: <span className="font-bold text-slate-700 dark:text-slate-300">{retConf}%</span>
            </span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default TicketStatusCard;
