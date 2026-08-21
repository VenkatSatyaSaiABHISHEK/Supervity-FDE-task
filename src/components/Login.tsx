import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, AlertCircle, ArrowRight, ArrowLeft, Database, Sparkles, GraduationCap, BarChart3 } from 'lucide-react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

const steps = [
  {
    id: 1,
    title: "1. Build Your Knowledge Base",
    desc: "Upload textbooks, notes, slides, or documents (PDF, DOCX, TXT, Images). Vedha extracts and indexes them offline into a local vector database.",
    icon: Database,
    color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    mockType: "ingestion"
  },
  {
    id: 2,
    title: "2. Chat Private & Offline",
    desc: "Ask questions, synthesize code, or translate text. Your queries are processed entirely locally on your machine, keeping your data 100% secure.",
    icon: Sparkles,
    color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
    mockType: "chat"
  },
  {
    id: 3,
    title: "3. Auto-Compile Quizzes",
    desc: "Select \"Quiz Me\" or \"Interview Prep\" to generate custom interactive multiple-choice practice exams based directly on your notes.",
    icon: GraduationCap,
    color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    mockType: "quiz"
  },
  {
    id: 4,
    title: "4. Review Analytics",
    desc: "Monitor your study metrics, document library sizes, indexed chunk breakdowns, and system speeds on the Analytics dashboard.",
    icon: BarChart3,
    color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    mockType: "analytics"
  }
];

const renderMockVisual = (type: string) => {
  switch (type) {
    case 'ingestion':
      return (
        <div className="w-full h-32 flex items-center justify-between px-6 relative overflow-visible">
          {/* Glowing Aura Spots */}
          <div className="absolute top-1/2 left-8 -translate-y-1/2 w-20 h-20 bg-blue-500/10 dark:bg-blue-400/5 blur-xl rounded-full" />
          <div className="absolute top-1/2 right-8 -translate-y-1/2 w-20 h-20 bg-indigo-500/10 dark:bg-indigo-400/5 blur-xl rounded-full" />
          
          {/* Source node */}
          <div className="flex flex-col items-center gap-2 z-10">
            <motion.div
              animate={{ y: [-4, 4, -4] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="w-14 h-14 rounded-full bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center text-blue-500 dark:text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]"
            >
              <Database className="w-6 h-6" />
            </motion.div>
            <span className="text-xs font-bold text-slate-550 dark:text-slate-400">Knowledge Files</span>
          </div>

          {/* Ingestion stream */}
          <div className="flex-grow mx-4 relative h-6 flex items-center justify-center">
            {/* The laser stream particle */}
            <motion.div
              initial={{ left: "0%", width: "0%" }}
              animate={{ left: ["0%", "100%"], width: ["0%", "40%", "0%"] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute h-1 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full shadow-[0_0_10px_#3b82f6]"
            />
            {/* Scanning beam line indicator */}
            <motion.div
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-[10px] font-black tracking-widest text-blue-500 dark:text-blue-400 uppercase"
            >
              Analyzing...
            </motion.div>
          </div>

          {/* Destination node */}
          <div className="flex flex-col items-center gap-2 z-10">
            <motion.div
              animate={{ y: [4, -4, 4], scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="w-14 h-14 rounded-full bg-indigo-550/10 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-550 dark:text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]"
            >
              <Sparkles className="w-6 h-6" />
            </motion.div>
            <span className="text-xs font-bold text-indigo-650 dark:text-indigo-400">Indexed DB</span>
          </div>
        </div>
      );
    case 'chat':
      const chatWords = "It lets models focus on specific words when processing text, similar to how humans prioritize visual details.".split(" ");
      return (
        <div className="w-full h-32 flex flex-col justify-center gap-3 relative overflow-visible px-2">
          {/* Glowing Aura Spot */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-indigo-500/5 dark:bg-indigo-400/5 blur-2xl rounded-full" />
          
          {/* User message */}
          <div className="flex justify-end z-10">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="bg-indigo-600/90 text-white rounded-2xl rounded-tr-none px-4 py-2 text-xs font-semibold shadow-md shadow-indigo-500/10"
            >
              Explain LLM attention mechanisms simply.
            </motion.div>
          </div>

          {/* AI Message response */}
          <div className="flex gap-3 items-start z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.2 }}
              className="w-8 h-8 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-550 dark:text-indigo-400 shadow-xs flex-shrink-0"
            >
              <Sparkles className="w-5 h-5" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.2, duration: 0.3 }}
              className="text-left max-w-[80%]"
            >
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-350 leading-relaxed flex flex-wrap gap-x-0.5">
                {chatWords.map((word, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 + i * 0.08 }}
                  >
                    {word}
                  </motion.span>
                ))}
                <motion.span
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  className="inline-block w-1.5 h-3.5 bg-indigo-500 ml-0.5"
                />
              </p>
            </motion.div>
          </div>
        </div>
      );
    case 'quiz':
      return (
        <div className="w-full h-32 flex flex-col justify-center gap-2 relative overflow-visible px-2 text-left">
          {/* Glowing Aura Spot */}
          <div className="absolute top-1/2 right-12 -translate-y-1/2 w-24 h-24 bg-emerald-500/5 dark:bg-emerald-400/5 blur-xl rounded-full" />
          
          <h4 className="text-xs font-black text-slate-800 dark:text-white leading-tight z-10">
            What type of memory has the fastest access time?
          </h4>
          
          <div className="grid grid-cols-2 gap-2 pt-1 relative z-10">
            <div className="px-3 py-1.5 rounded-xl bg-white/40 dark:bg-slate-900/20 text-slate-600 dark:text-slate-400 text-xs font-bold shadow-xs">
              A) Dynamic RAM
            </div>
            
            <motion.div
              animate={{
                backgroundColor: ["rgba(255, 255, 255, 0.4)", "rgba(16, 185, 129, 0.12)", "rgba(255, 255, 255, 0.4)"],
                color: ["rgba(71, 85, 105, 1)", "rgba(5, 150, 105, 1)", "rgba(71, 85, 105, 1)"],
                boxShadow: ["0 1px 2px rgba(0,0,0,0.02)", "0 4px 15px rgba(16, 185, 129, 0.15)", "0 1px 2px rgba(0,0,0,0.02)"]
              }}
              transition={{ delay: 2, duration: 1.5 }}
              className="px-3 py-1.5 rounded-xl bg-white/40 text-xs font-bold flex items-center justify-between dark:bg-slate-900/20 dark:text-slate-400 shadow-xs relative"
            >
              <span>B) L1 Cache Register</span>
              <motion.span
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 1.2, 1], opacity: 1 }}
                transition={{ delay: 2.5, duration: 0.3 }}
                className="text-[9px] font-black bg-emerald-500 text-white w-4.5 h-4.5 rounded-full flex items-center justify-center"
              >
                ✓
              </motion.span>
            </motion.div>
            
            <div className="px-3 py-1.5 rounded-xl bg-white/40 dark:bg-slate-900/20 text-slate-650 dark:text-slate-400 text-xs font-bold shadow-xs">
              C) Solid State Drive
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-white/40 dark:bg-slate-900/20 text-slate-650 dark:text-slate-400 text-xs font-bold shadow-xs">
              D) Virtual Memory
            </div>

            {/* Simulated Mouse Pointer */}
            <motion.div
              initial={{ x: 180, y: 70, opacity: 0 }}
              animate={{ x: 110, y: 22, opacity: [0, 1, 1, 0] }}
              transition={{ delay: 0.5, duration: 2, times: [0, 0.3, 0.8, 1] }}
              className="absolute w-3.5 h-3.5 pointer-events-none z-50 text-slate-600 dark:text-white"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full drop-shadow-md">
                <path d="M4 2l16 11.5-6.5 1.5 5.5 7.5-3 2-5.5-7.5-6.5 5z" />
              </svg>
            </motion.div>
          </div>
        </div>
      );
    case 'analytics':
      return (
        <div className="w-full h-32 flex flex-col justify-center gap-2 relative overflow-visible px-2">
          {/* Glowing Aura Spot */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 bg-amber-500/5 dark:bg-amber-400/5 blur-2xl rounded-full" />
          
          <div className="flex-grow flex items-center justify-between py-1 gap-2 relative">
            <div className="absolute inset-0 z-0 opacity-40">
              <svg viewBox="0 0 100 30" className="w-full h-full">
                <motion.path
                  d="M0,22 Q15,3 30,18 T60,8 T90,20 T100,12"
                  fill="none"
                  stroke="#d97706"
                  strokeWidth="1.5"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                />
              </svg>
            </div>

            <div className="grid grid-cols-3 gap-2 w-full z-10">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white/40 dark:bg-slate-900/20 rounded-2xl p-2.5 flex flex-col items-center shadow-xs"
              >
                <span className="text-[9px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-wider">Speed</span>
                <span className="text-xs font-black text-amber-600 dark:text-amber-400 mt-0.5">12 ms</span>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="bg-white/40 dark:bg-slate-900/20 rounded-2xl p-2.5 flex flex-col items-center shadow-xs"
              >
                <span className="text-[9px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-wider">Accuracy</span>
                <span className="text-xs font-black text-indigo-650 dark:text-indigo-400 mt-0.5">99.4%</span>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.3 }}
                className="bg-white/40 dark:bg-slate-900/20 rounded-2xl p-2.5 flex flex-col items-center shadow-xs"
              >
                <span className="text-[9px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-wider">Indexed</span>
                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 mt-0.5">1,420 Ch</span>
              </motion.div>
            </div>
          </div>
        </div>
      );
    default:
      return null;
  }
};

export const Login: React.FC = () => {
  const { login, register } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loginStep, setLoginStep] = useState<'email' | 'password'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);

  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const handleStepClick = (index: number) => {
    setActiveStep(index);
  };

  const checkEmailExists = async (emailToCheck: string): Promise<boolean> => {
    const cleanEmail = emailToCheck.toLowerCase().trim();
    try {
      const localUsers = JSON.parse(localStorage.getItem('registered_emails') || '[]');
      if (localUsers.includes(cleanEmail)) return true;
    } catch (e) { console.error('LocalStorage read error:', e); }
    
    try {
      const docRef = doc(db, 'registered_emails', cleanEmail);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        try {
          const localUsers = JSON.parse(localStorage.getItem('registered_emails') || '[]');
          if (!localUsers.includes(cleanEmail)) {
            localUsers.push(cleanEmail);
            localStorage.setItem('registered_emails', JSON.stringify(localUsers));
          }
        } catch (e) {}
        return true;
      }
    } catch (e) { console.error('Firestore check error (offline fallback active):', e); }
    return false;
  };

  const handleEmailContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) { setError('Please enter your email.'); return; }
    setIsCheckingEmail(true);
    try {
      await checkEmailExists(email);
      setLoginStep('password');
    } catch (err) { setLoginStep('password'); } finally { setIsCheckingEmail(false); }
  };

  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!password.trim()) { setError('Please enter your password.'); return; }
    setIsLoading(true);
    try {
      await login(email, password);
      const cleanEmail = email.toLowerCase().trim();
      try {
        const localUsers = JSON.parse(localStorage.getItem('registered_emails') || '[]');
        if (!localUsers.includes(cleanEmail)) {
          localUsers.push(cleanEmail);
          localStorage.setItem('registered_emails', JSON.stringify(localUsers));
        }
        const docRef = doc(db, 'registered_emails', cleanEmail);
        await setDoc(docRef, { exists: true });
      } catch (e) { console.error("Auto-heal registration registry failed:", e); }
    } catch (err: any) {
      console.error(err);
      let message = 'Invalid password. Please check your credentials.';
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found') {
        message = 'Wrong password or account does not exist. Please check your credentials or register.';
      }
      setError(message);
    } finally { setIsLoading(false); }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) { setError('Please fill in all fields.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setIsLoading(true);
    try { await register(email, password); } catch (err: any) {
      console.error(err);
      let message = 'Failed to create account. Please try again.';
      if (err.code === 'auth/email-already-in-use') message = 'This email is already registered.';
      else if (err.code === 'auth/invalid-email') message = 'Invalid email address format.';
      setError(message);
    } finally { setIsLoading(false); }
  };

  const handleToggleMode = () => {
    setIsSignUp(!isSignUp);
    setError(null);
    setLoginStep('email');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col md:flex-row w-screen h-screen overflow-hidden bg-[var(--bg-gradient-light)] dark:bg-[var(--bg-gradient-dark)] text-[#101828] dark:text-slate-200">
      <div className="absolute inset-0 bg-grid-pattern opacity-70 pointer-events-none z-0" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div animate={{ x: [0, 20, -20, 0], y: [0, -30, 30, 0] }} transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }} className="absolute bottom-[-10%] left-[-10%] w-[30rem] h-[30rem] rounded-full bg-glow-blue blur-[120px] opacity-75" />
        <motion.div animate={{ x: [0, -30, 20, 0], y: [0, 20, -20, 0] }} transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[30%] right-[-10%] w-[30rem] h-[30rem] rounded-full bg-glow-purple blur-[120px] opacity-75" />
      </div>

      <div className="w-full md:w-[48%] h-auto md:h-full bg-slate-50/10 dark:bg-slate-950/10 backdrop-blur-2xl flex flex-col justify-between p-8 md:p-14 select-none border-b md:border-b-0 md:border-r border-slate-200/50 dark:border-white/5 relative z-10 overflow-y-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center shadow-md shadow-indigo-500/25">
            <svg className="w-4.5 h-4.5 text-white" viewBox="0 0 24 24" fill="none"><path d="M12 2C12 7.5 16.5 12 22 12C16.5 12 12 16.5 12 22C12 16.5 7.5 12 2 12C7.5 12 12 7.5 12 2Z" fill="currentColor" /></svg>
          </div>
          <span className="text-sm font-black tracking-wider text-[#101828] dark:text-white uppercase">Vedha AI</span>
        </div>

        <div className="my-auto max-w-xl mx-auto w-full py-4 relative z-10 flex flex-col gap-6">
          <div>
            <span className="text-xs font-black uppercase tracking-widest text-indigo-650 dark:text-indigo-400 bg-indigo-500/10 dark:bg-indigo-500/20 px-2.5 py-1 rounded-full shadow-xs">⚡ Magic Experience</span>
            <h2 className="text-2xl sm:text-3xl font-black mt-3 tracking-tight">How to use <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent animate-aurora">Vedha AI</span></h2>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1.5">Your completely private, offline learning & research companion.</p>
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={activeStep} initial={{ opacity: 0, x: 45, scale: 0.96 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: -45, scale: 0.96 }} transition={{ type: "spring", stiffness: 260, damping: 26 }} className="space-y-4">
              {renderMockVisual(steps[activeStep].mockType)}
              <div className="space-y-2 text-left px-2 pt-2">
                <div className="flex items-center gap-3.5">
                  <div className={`p-2.5 rounded-xl border flex-shrink-0 bg-white/50 dark:bg-slate-900/30 border-slate-200/50 dark:border-white/5 ${steps[activeStep].color.split(' ')[0]}`}>
                    {React.createElement(steps[activeStep].icon, { className: "w-5.5 h-5.5" })}
                  </div>
                  <h3 className="text-base font-black text-slate-850 dark:text-white tracking-tight">{steps[activeStep].title}</h3>
                </div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed pl-13">{steps[activeStep].desc}</p>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center gap-2 px-1 relative">
              {steps.map((step, idx) => {
                const isActive = activeStep === idx;
                const Icon = step.icon;
                return (
                  <button key={step.id} onClick={() => handleStepClick(idx)} className={`flex-1 flex flex-col items-center gap-1.5 py-2.5 px-3 rounded-2xl cursor-pointer transition-all duration-300 relative ${isActive ? 'text-indigo-600 dark:text-indigo-400 scale-105 font-bold' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400 hover:scale-102'}`}>
                    {isActive && (<motion.div layoutId="activeTabPill" className="absolute inset-0 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-2xl -z-10" transition={{ type: "spring", stiffness: 300, damping: 30 }} />)}
                    <Icon className="w-5 h-5" />
                    <span className="text-[10px] font-bold tracking-tight text-center md:inline hidden leading-tight max-w-[95px] whitespace-normal mt-1">{step.title.split('.')[1].trim()}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div className="text-xs text-slate-400 dark:text-slate-500 font-semibold tracking-tight">&copy; Vedha AI {new Date().getFullYear()}</div>
      </div>

      <div className="w-full md:w-[52%] h-auto md:h-full bg-white/60 dark:bg-slate-950/20 backdrop-blur-md flex items-center justify-center p-8 md:p-16 relative overflow-y-auto z-10">
        <div className="w-full max-w-sm">
          <AnimatePresence mode="wait">
            {!isSignUp ? (
              <motion.div key="signin" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="space-y-7">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-[#101828] dark:text-white tracking-tight">{loginStep === 'email' ? 'Welcome back' : 'Enter password'}</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{loginStep === 'email' ? 'Welcome back! Please enter your details.' : 'Please verify your password to continue.'}</p>
                </div>
                {loginStep === 'email' ? (
                  <form onSubmit={handleEmailContinue} className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-350 block">Email</label>
                      <input type="email" required placeholder="Enter your email" value={email} onChange={(e) => { setEmail(e.target.value); setError(null); }} disabled={isCheckingEmail} className={`w-full px-4 py-3 bg-white dark:bg-slate-950 border ${error ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20' : 'border-slate-300 dark:border-white/10 focus:border-indigo-500 focus:ring-indigo-500/20'} rounded-xl text-sm text-[#101828] dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:ring-3 transition-all font-semibold shadow-xs`} />
                      {error && (<p className="text-sm font-semibold text-rose-500 mt-2 flex items-start gap-1.5 leading-snug"><AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /><span className="flex flex-col gap-1">{error}{error.includes('Try to sign up') && (<button type="button" onClick={handleToggleMode} className="text-xs uppercase tracking-wider font-extrabold text-indigo-600 dark:text-indigo-400 hover:underline text-left cursor-pointer">Sign Up Now &rarr;</button>)}</span></p>)}
                    </div>
                    <button type="submit" disabled={isCheckingEmail} className="w-full py-3.5 rounded-xl bg-indigo-600 dark:bg-indigo-550 hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer">{isCheckingEmail ? (<><Loader2 className="w-5 h-5 animate-spin" /><span>Checking details...</span></>) : (<><span>Continue</span><ArrowRight className="w-4.5 h-4.5" /></>)}</button>
                  </form>
                ) : (
                  <form onSubmit={handlePasswordSignIn} className="space-y-5">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-350 block">Email</label>
                        <button type="button" onClick={() => { setLoginStep('email'); setError(null); }} className="text-xs font-extrabold uppercase text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer flex items-center gap-1"><ArrowLeft className="w-3.5 h-3.5" /> Change</button>
                      </div>
                      <input type="text" disabled value={email} className="w-full px-4 py-3 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/5 rounded-xl text-sm text-slate-450 dark:text-slate-400 font-semibold outline-none cursor-not-allowed" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-350 block">Password</label>
                      <input type="password" required autoFocus placeholder="••••••••" value={password} onChange={(e) => { setPassword(e.target.value); setError(null); }} disabled={isLoading} className={`w-full px-4 py-3 bg-white dark:bg-slate-950 border ${error ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20' : 'border-slate-300 dark:border-white/10 focus:border-indigo-500 focus:ring-indigo-500/20'} rounded-xl text-sm text-[#101828] dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:ring-3 transition-all font-semibold shadow-xs`} />
                      {error && (<p className="text-sm font-semibold text-rose-500 mt-2 flex items-center gap-1.5"><AlertCircle className="w-4 h-4 flex-shrink-0" /><span>{error}</span></p>)}
                    </div>
                    <button type="submit" disabled={isLoading} className="w-full py-3.5 rounded-xl bg-indigo-600 dark:bg-indigo-550 hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer">{isLoading ? (<><Loader2 className="w-5 h-5 animate-spin" /><span>Verifying...</span></>) : (<><span>Sign In</span><ArrowRight className="w-4.5 h-4.5" /></>)}</button>
                  </form>
                )}
                <div className="text-center"><p className="text-sm text-slate-500 dark:text-slate-400">Don't have an account? <button onClick={handleToggleMode} className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer transition-colors">Sign Up</button></p></div>
              </motion.div>
            ) : (
              <motion.div key="signup" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="space-y-7">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-[#101828] dark:text-white tracking-tight">Create your account</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Sign up to build your secure offline knowledge companion.</p>
                </div>
                <form onSubmit={handleSignUp} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-355 block">Email</label>
                    <input type="email" required placeholder="Enter your email" value={email} onChange={(e) => { setEmail(e.target.value); setError(null); }} disabled={isLoading} className={`w-full px-4 py-3 bg-white dark:bg-slate-950 border ${error && error.includes('registered') ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20' : 'border-slate-300 dark:border-white/10 focus:border-indigo-500 focus:ring-indigo-500/20'} rounded-xl text-sm text-[#101828] dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:ring-3 transition-all font-semibold shadow-xs`} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-355 block">Password</label>
                    <input type="password" required placeholder="••••••••" value={password} onChange={(e) => { setPassword(e.target.value); setError(null); }} disabled={isLoading} className={`w-full px-4 py-3 bg-white dark:bg-slate-950 border ${error && (error.includes('match') || error.includes('characters')) ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20' : 'border-slate-300 dark:border-white/10 focus:border-indigo-500 focus:ring-indigo-500/20'} rounded-xl text-sm text-[#101828] dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:ring-3 transition-all font-semibold shadow-xs`} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-355 block">Confirm Password</label>
                    <input type="password" required placeholder="••••••••" value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); setError(null); }} disabled={isLoading} className={`w-full px-4 py-3 bg-white dark:bg-slate-950 border ${error && error.includes('match') ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20' : 'border-slate-300 dark:border-white/10 focus:border-indigo-500 focus:ring-indigo-500/20'} rounded-xl text-sm text-[#101828] dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:ring-3 transition-all font-semibold shadow-xs`} />
                  </div>
                  {error && (<p className="text-sm font-semibold text-rose-500 mt-2 flex items-center gap-1.5"><AlertCircle className="w-4 h-4 flex-shrink-0" /><span>{error}</span></p>)}
                  <button type="submit" disabled={isLoading} className="w-full py-3.5 rounded-xl bg-indigo-600 dark:bg-indigo-550 hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer">{isLoading ? (<><Loader2 className="w-5 h-5 animate-spin" /><span>Registering account...</span></>) : (<><span>Get Started</span><ArrowRight className="w-4.5 h-4.5" /></>)}</button>
                </form>
                <div className="text-center"><p className="text-sm text-slate-500 dark:text-slate-400">Already have an account? <button onClick={handleToggleMode} className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer transition-colors">Sign In</button></p></div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Lottie Animation at the bottom center */}
        {!isSignUp && (
          <div className="absolute bottom-0 md:bottom-2 left-1/2 -translate-x-1/2 w-56 h-56 md:w-64 md:h-64 pointer-events-none z-0">
            <DotLottieReact
              src="https://lottie.host/feae519b-2336-4ad0-90f1-f7946e736152/zxTk901HF6.lottie"
              loop
              autoplay
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
