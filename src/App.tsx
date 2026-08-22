import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import RootLayout from './layouts/RootLayout';
import SupportChat from './pages/SupportChat';
import KnowledgeBase from './pages/KnowledgeBase';
import TicketHistory from './pages/TicketHistory';
import LandingPage from './pages/LandingPage';
import LandingLayout from './layouts/LandingLayout';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './components/Login';


// ── Splash loader ──────────────────────────────────────────────────────────────
function SplashLoader() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#f0f3f8] dark:bg-[#0b1120] z-50">
      <div className="relative w-16 h-16 mb-6">
        <div className="absolute inset-0 rounded-full border-4 border-indigo-100 dark:border-indigo-950" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-500 animate-spin" />
        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24">
            <path d="M3 18c0-2.8 2.2-5 5-5h8c2.8 0 5 2.2 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M12 3c2.8 0 5 2.2 5 5s-2.2 5-5 5-5-2.2-5-5 2.2-5 5-5z" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </div>
      </div>
      <p className="text-xs font-black uppercase tracking-widest text-indigo-500 animate-pulse">SupportFlow AI</p>
      <p className="text-[10px] text-slate-400 mt-1 tracking-wide">Initializing...</p>
    </div>
  );
}

// ── Auth guard for inner pages ─────────────────────────────────────────────────
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, loading } = useAuth();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 4000);
    return () => clearTimeout(t);
  }, []);

  if (loading && !timedOut) return <SplashLoader />;
  if (!isLoggedIn) return <Login />;
  return <>{children}</>;
}

// ── App Content ───────────────────────────────────────────────────────────────
function AppContent() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public landing page */}
        <Route element={<LandingLayout />}>
          <Route path="/" element={<LandingPage />} />
        </Route>

        {/* Auth-gated app pages */}
        <Route
          element={
            <RequireAuth>
              <RootLayout />
            </RequireAuth>
          }
        >
          <Route path="/chat" element={<SupportChat />} />
          <Route path="/knowledge-base" element={<KnowledgeBase />} />
          <Route path="/tickets" element={<TicketHistory />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
