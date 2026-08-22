import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import {
  Headphones, Zap, BookOpen, Users, ChevronRight, ArrowRight,
  MessageSquare, Brain, CheckCircle, Star, Shield, Clock, Send,
  CreditCard, Wrench, Lock, Sparkles, TrendingUp, Award
} from 'lucide-react';

// ── Floating particles ─────────────────────────────────────────────────────────
const PARTICLES = Array.from({ length: 22 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 3 + 1,
  duration: Math.random() * 12 + 8,
  delay: Math.random() * 5,
}));

// ── Stat counter ───────────────────────────────────────────────────────────────
function AnimatedCounter({ target, suffix = '', prefix = '' }: { target: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started) {
        setStarted(true);
        let start = 0;
        const duration = 1800;
        const step = (timestamp: number) => {
          if (!start) start = timestamp;
          const progress = Math.min((timestamp - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setCount(Math.floor(eased * target));
          if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, started]);

  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
}

// ── Category cards ─────────────────────────────────────────────────────────────
const CATEGORIES = [
  {
    icon: CreditCard,
    label: 'Billing',
    color: 'from-amber-500 to-orange-500',
    glow: 'shadow-amber-500/25',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-200/60 dark:border-amber-700/40',
    text: 'text-amber-700 dark:text-amber-300',
    tag: 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-300',
    desc: 'Payment issues, refunds, subscription changes & invoices',
    examples: ['Payment failed', 'Charged twice', 'Refund request'],
    message: 'I have a billing issue with my account.',
  },
  {
    icon: Wrench,
    label: 'Technical',
    color: 'from-blue-500 to-cyan-500',
    glow: 'shadow-blue-500/25',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    border: 'border-blue-200/60 dark:border-blue-700/40',
    text: 'text-blue-700 dark:text-blue-300',
    tag: 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300',
    desc: 'Bugs, crashes, errors, uploads & performance problems',
    examples: ['App crashing', 'Error 500', 'Upload failing'],
    message: 'The application is not working properly.',
  },
  {
    icon: Lock,
    label: 'Account Access',
    color: 'from-violet-500 to-purple-600',
    glow: 'shadow-violet-500/25',
    bg: 'bg-violet-50 dark:bg-violet-950/30',
    border: 'border-violet-200/60 dark:border-violet-700/40',
    text: 'text-violet-700 dark:text-violet-300',
    tag: 'bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-300',
    desc: 'Login problems, password resets, 2FA & account security',
    examples: ['Forgot password', 'Account locked', 'Can\'t log in'],
    message: 'I cannot access my account.',
  },
];

// ── Steps ──────────────────────────────────────────────────────────────────────
const STEPS = [
  { icon: MessageSquare, title: 'Describe your issue', desc: 'Tell us what\'s happening in plain language — no jargon required.', color: 'from-indigo-500 to-blue-500' },
  { icon: Brain, title: 'AI understands & classifies', desc: 'Our AI identifies the problem category and searches the knowledge base instantly.', color: 'from-purple-500 to-violet-500' },
  { icon: CheckCircle, title: 'Get an instant answer', desc: 'Receive a grounded, accurate answer — or get escalated to a human agent.', color: 'from-emerald-500 to-teal-500' },
];

const STATS = [
  { icon: Zap, label: 'Avg. Response Time', value: 3, suffix: 's', prefix: '<', color: 'text-amber-500' },
  { icon: CheckCircle, label: 'Resolution Rate', value: 94, suffix: '%', color: 'text-emerald-500' },
  { icon: Users, label: 'Tickets Handled', value: 12500, suffix: '+', color: 'text-blue-500' },
  { icon: Star, label: 'Satisfaction Score', value: 98, suffix: '%', color: 'text-violet-500' },
];

const TESTIMONIALS = [
  { name: 'Sarah M.', role: 'Product Manager', text: 'Got my billing issue resolved in under 30 seconds. The AI knew exactly what to do.', stars: 5 },
  { name: 'James K.', role: 'Developer', text: 'Best support chatbot I\'ve used. It actually reads the knowledge base instead of making things up.', stars: 5 },
  { name: 'Priya R.', role: 'Business Owner', text: 'Impressed by the escalation — when it didn\'t know, it said so and connected me to a human instantly.', stars: 5 },
];

// ──────────────────────────────────────────────────────────────────────────────
export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [heroInput, setHeroInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  const yParallax = useTransform(scrollYProgress, [0, 0.4], [0, -80]);

  // Testimonial carousel
  useEffect(() => {
    const t = setInterval(() => setActiveTestimonial(p => (p + 1) % TESTIMONIALS.length), 4000);
    return () => clearInterval(t);
  }, []);

  // Typewriter placeholder
  const PLACEHOLDERS = [
    'I was charged twice for my subscription…',
    'The app crashes when I upload a file…',
    'I forgot my password and cannot log in…',
    'My payment failed but money was deducted…',
  ];
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [displayedPlaceholder, setDisplayedPlaceholder] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const typeRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const current = PLACEHOLDERS[placeholderIdx];
    if (!isDeleting && displayedPlaceholder.length < current.length) {
      typeRef.current = setTimeout(() => setDisplayedPlaceholder(current.slice(0, displayedPlaceholder.length + 1)), 55);
    } else if (!isDeleting && displayedPlaceholder.length === current.length) {
      typeRef.current = setTimeout(() => setIsDeleting(true), 2200);
    } else if (isDeleting && displayedPlaceholder.length > 0) {
      typeRef.current = setTimeout(() => setDisplayedPlaceholder(current.slice(0, displayedPlaceholder.length - 1)), 28);
    } else if (isDeleting && displayedPlaceholder.length === 0) {
      setIsDeleting(false);
      setPlaceholderIdx(p => (p + 1) % PLACEHOLDERS.length);
    }
    return () => clearTimeout(typeRef.current);
  }, [displayedPlaceholder, isDeleting, placeholderIdx]);

  const handleHeroSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const query = heroInput.trim();
    if (query) {
      sessionStorage.setItem('pendingMessage', query);
    }
    navigate('/chat');
  };

  const handleCategoryClick = (msg: string) => {
    sessionStorage.setItem('pendingMessage', msg);
    navigate('/chat');
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden text-slate-800 dark:text-slate-200">

      {/* ── Background ──────────────────────────────────────────────────────── */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[#f0f3f8] dark:bg-[#050810]" />
        {/* grid */}
        <div className="absolute inset-0 bg-grid-pattern opacity-50 dark:opacity-30" />
        {/* animated orbs */}
        <motion.div
          animate={{ x: [0, 40, -20, 0], y: [0, -50, 30, 0] }}
          transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-[-15%] left-[-5%] w-[50rem] h-[50rem] rounded-full bg-indigo-400/10 dark:bg-indigo-600/10 blur-[120px]"
        />
        <motion.div
          animate={{ x: [0, -30, 50, 0], y: [0, 40, -40, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
          className="absolute bottom-[-10%] right-[-5%] w-[45rem] h-[45rem] rounded-full bg-purple-400/10 dark:bg-purple-600/12 blur-[120px]"
        />
        <motion.div
          animate={{ x: [0, 20, -40, 0], y: [0, -20, 40, 0] }}
          transition={{ duration: 35, repeat: Infinity, ease: 'easeInOut', delay: 6 }}
          className="absolute top-[40%] left-[40%] w-[30rem] h-[30rem] rounded-full bg-cyan-400/8 dark:bg-cyan-600/8 blur-[100px]"
        />
      </div>

      {/* ── Floating Particles ──────────────────────────────────────────────── */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        {PARTICLES.map(p => (
          <motion.div
            key={p.id}
            className="absolute rounded-full bg-indigo-400/30 dark:bg-indigo-400/20"
            style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
            animate={{ y: [0, -40, 0], opacity: [0.2, 0.7, 0.2] }}
            transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 1 — HERO
      ══════════════════════════════════════════════════════════════════════ */}
      <section ref={heroRef} className="relative min-h-[100vh] flex flex-col items-center justify-center px-6 pt-28 pb-20">
        <motion.div style={{ y: yParallax }} className="w-full max-w-5xl mx-auto text-center">

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 dark:bg-indigo-500/15 border border-indigo-400/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold tracking-widest uppercase mb-8"
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI-Powered Customer Support
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl sm:text-6xl md:text-7xl font-black leading-[1.08] tracking-tight mb-6"
          >
            <span className="text-slate-900 dark:text-white">Your support issues,</span>
            <br />
            <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent animate-aurora bg-[length:200%_auto]">
              resolved instantly
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg sm:text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Describe your billing, technical, or account issue in plain language.
            Our AI searches the knowledge base and gives you a grounded answer — or connects you to a human agent.
          </motion.p>

          {/* Hero Input */}
          <motion.form
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            onSubmit={handleHeroSubmit}
            className="relative max-w-2xl mx-auto mb-6"
          >
            <div className={`relative flex items-center gap-3 p-2 pl-5 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl shadow-indigo-500/10 dark:shadow-indigo-500/20 border transition-all duration-300 ${isTyping ? 'border-indigo-400 dark:border-indigo-500 ring-4 ring-indigo-500/10' : 'border-slate-200 dark:border-white/10'}`}>
              <MessageSquare className="w-5 h-5 text-slate-400 flex-shrink-0" />
              <input
                type="text"
                value={heroInput}
                onChange={e => setHeroInput(e.target.value)}
                onFocus={() => setIsTyping(true)}
                onBlur={() => setIsTyping(false)}
                placeholder={displayedPlaceholder || 'Describe your issue…'}
                className="flex-1 bg-transparent text-sm sm:text-base text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none py-3 min-w-0"
              />
              <motion.button
                type="submit"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className="flex-shrink-0 flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-bold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Get Help</span>
              </motion.button>
            </div>
          </motion.form>

          {/* Quick access */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-2 mb-12"
          >
            <span className="text-xs text-slate-400 dark:text-slate-500 mr-1">Quick access:</span>
            {CATEGORIES.map(cat => (
              <button
                key={cat.label}
                onClick={() => handleCategoryClick(cat.message)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all hover:scale-105 ${cat.tag} ${cat.border}`}
              >
                <cat.icon className="w-3 h-3" />
                {cat.label}
              </button>
            ))}
          </motion.div>

          {/* Hero visual — floating chat demo */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative max-w-lg mx-auto"
          >
            {/* Outer glow */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 blur-2xl scale-110" />
            {/* Chat card */}
            <div className="relative rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/8 shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100 dark:border-white/5 bg-gradient-to-r from-indigo-500/5 to-purple-500/5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow">
                  <Headphones className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">SupportFlow AI</p>
                  <p className="text-[10px] text-emerald-500 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />Online · Typically replies in &lt;3s</p>
                </div>
              </div>
              {/* Messages */}
              <div className="p-4 space-y-3 text-left">
                {/* User */}
                <div className="flex justify-end">
                  <div className="max-w-[80%] bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs rounded-2xl rounded-br-sm px-4 py-2.5 shadow">
                    I was charged twice for my subscription this month.
                  </div>
                </div>
                {/* Ticket badge */}
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 }}
                  className="flex items-center gap-2"
                >
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/40 border border-amber-200 dark:border-amber-700/50 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
                    <CreditCard className="w-3 h-3" />
                    BILLING · 95% confidence · AI RESOLVED
                  </div>
                </motion.div>
                {/* AI reply */}
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.1 }}
                  className="flex items-start gap-2"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Headphones className="w-3 h-3 text-white" />
                  </div>
                  <div className="max-w-[82%] bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/8 text-slate-700 dark:text-slate-300 text-xs rounded-2xl rounded-bl-sm px-4 py-2.5">
                    Duplicate charges are reviewed and reversed automatically within <strong>5–7 business days</strong>. You don't need to take any action right now.
                    <div className="mt-2 pt-2 border-t border-slate-100 dark:border-white/5 text-[10px] text-slate-400 flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      Source: billing.txt
                    </div>
                  </div>
                </motion.div>
                {/* Feedback */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.5 }}
                  className="flex items-center gap-2 pl-8"
                >
                  <span className="text-[10px] text-slate-400">Was this helpful?</span>
                  <button className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700/50 text-emerald-600 text-[10px] font-semibold hover:bg-emerald-100 transition-colors">👍 Yes</button>
                  <button className="px-2 py-0.5 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/8 text-slate-500 text-[10px] font-semibold hover:bg-slate-100 transition-colors">👎 No</button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 2 — STATS
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="flex flex-col items-center text-center p-5 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-white/8 backdrop-blur-sm shadow-sm"
            >
              <stat.icon className={`w-5 h-5 mb-2 ${stat.color}`} />
              <div className={`text-2xl font-black ${stat.color}`}>
                <AnimatedCounter target={stat.value} suffix={stat.suffix} prefix={stat.prefix} />
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 3 — HOW IT WORKS
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <span className="text-xs font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400">How it works</span>
            <h2 className="text-4xl font-black text-slate-900 dark:text-white mt-3 mb-4">Three steps to resolution</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-lg mx-auto">Our AI pipeline processes every support request through classification, retrieval, and generation — all in under 3 seconds.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 relative">
            {/* connector line */}
            <div className="hidden md:block absolute top-10 left-[calc(16.66%+1rem)] right-[calc(16.66%+1rem)] h-0.5 bg-gradient-to-r from-indigo-300 via-purple-300 to-emerald-300 dark:from-indigo-700 dark:via-purple-700 dark:to-emerald-700 opacity-50" />

            {STEPS.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                whileHover={{ y: -4 }}
                className="relative flex flex-col items-center text-center p-7 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/60 dark:border-white/8 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all"
              >
                <div className="relative mb-5">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-xl`}>
                    <step.icon className="w-7 h-7 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-white/20 flex items-center justify-center text-[11px] font-black text-slate-600 dark:text-slate-400">
                    {i + 1}
                  </div>
                </div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-2">{step.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 4 — CATEGORIES
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <span className="text-xs font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400">Support categories</span>
            <h2 className="text-4xl font-black text-slate-900 dark:text-white mt-3 mb-4">What can we help you with?</h2>
            <p className="text-slate-500 dark:text-slate-400">Click a category to jump straight into the chat with a pre-filled message.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-5">
            {CATEGORIES.map((cat, i) => (
              <motion.button
                key={cat.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                whileHover={{ y: -6, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleCategoryClick(cat.message)}
                className={`group relative text-left p-7 rounded-2xl border ${cat.bg} ${cat.border} shadow-lg hover:shadow-2xl ${cat.glow} transition-all overflow-hidden`}
              >
                {/* icon */}
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center shadow-md mb-4 group-hover:scale-110 transition-transform`}>
                  <cat.icon className="w-5.5 h-5.5 text-white" />
                </div>

                <h3 className={`text-base font-black mb-1 ${cat.text}`}>{cat.label}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">{cat.desc}</p>

                {/* Example pills */}
                <div className="flex flex-wrap gap-1.5">
                  {cat.examples.map(ex => (
                    <span key={ex} className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cat.tag} ${cat.border}`}>
                      {ex}
                    </span>
                  ))}
                </div>

                {/* Arrow */}
                <div className={`absolute bottom-5 right-5 w-8 h-8 rounded-full bg-gradient-to-br ${cat.color} flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0 shadow`}>
                  <ArrowRight className="w-3.5 h-3.5 text-white" />
                </div>

                {/* Glow effect */}
                <div className={`absolute inset-0 bg-gradient-to-br ${cat.color} opacity-0 group-hover:opacity-5 transition-opacity rounded-2xl`} />
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 5 — FEATURES
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <span className="text-xs font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400">Features</span>
            <h2 className="text-4xl font-black text-slate-900 dark:text-white mt-3 mb-4">Built different</h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
            {[
              { icon: Brain, title: 'Grounded Answers', desc: 'Every answer is sourced directly from the knowledge base — no hallucinations.', color: 'text-indigo-500' },
              { icon: Zap, title: 'Real-Time Streaming', desc: 'Responses stream token-by-token so you see answers forming in real time.', color: 'text-amber-500' },
              { icon: TrendingUp, title: 'Confidence Scoring', desc: 'Every response comes with classification and retrieval confidence percentages.', color: 'text-blue-500' },
              { icon: Users, title: 'Smart Escalation', desc: 'When AI isn\'t confident enough, it escalates to a human agent automatically.', color: 'text-violet-500' },
              { icon: Shield, title: 'Secure Auth', desc: 'Firebase-powered authentication with email/password and session management.', color: 'text-emerald-500' },
              { icon: Clock, title: 'Ticket History', desc: 'Every conversation is saved with full ticket metadata for review anytime.', color: 'text-rose-500' },
            ].map((feat, i) => (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -3 }}
                className="p-6 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/60 dark:border-white/8 backdrop-blur-sm shadow hover:shadow-lg transition-all"
              >
                <feat.icon className={`w-6 h-6 ${feat.color} mb-3`} />
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1.5">{feat.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 6 — TESTIMONIALS
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-12">
            <span className="text-xs font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400">Testimonials</span>
            <h2 className="text-4xl font-black text-slate-900 dark:text-white mt-3">What users say</h2>
          </motion.div>

          <div className="relative h-52">
            <AnimatePresence mode="wait">
              {TESTIMONIALS.map((t, i) => i === activeTestimonial && (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.96 }}
                  transition={{ duration: 0.4 }}
                  className="absolute inset-0 flex flex-col items-center justify-center p-8 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/60 dark:border-white/8 backdrop-blur-sm shadow-lg"
                >
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: t.stars }).map((_, si) => (
                      <Star key={si} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-slate-700 dark:text-slate-200 text-sm leading-relaxed mb-4 italic">"{t.text}"</p>
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.role}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-6">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveTestimonial(i)}
                className={`h-2 rounded-full transition-all ${i === activeTestimonial ? 'w-6 bg-indigo-500' : 'w-2 bg-slate-300 dark:bg-slate-700'}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 7 — CTA
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="py-24 px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center relative"
        >
          {/* Glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-cyan-500/20 blur-3xl rounded-full" />

          <div className="relative p-12 rounded-3xl bg-white/80 dark:bg-slate-900/70 border border-slate-200/60 dark:border-white/10 backdrop-blur-md shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl mx-auto mb-6">
              <Award className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-4">
              Ready to get support?
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8 text-lg">
              Start a conversation and get your issue resolved in under 30 seconds.
            </p>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/chat')}
              className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-base font-bold shadow-2xl shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all"
            >
              <Headphones className="w-5 h-5" />
              Start a Conversation
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────────── */}
      <footer className="py-8 px-6 border-t border-slate-200/30 dark:border-white/5">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Headphones className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-xs font-black tracking-widest uppercase bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">SupportFlow AI</span>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-600">
            © {new Date().getFullYear()} SupportFlow AI — Tier-1 Customer Support Triage
          </p>
          <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            All systems operational
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
