import { BrowserRouter, Routes, Route } from 'react-router-dom';
import RootLayout from './layouts/RootLayout';
import Home from './pages/Home';
import Chat from './pages/Chat';
import Chunks from './pages/Chunks';
import Vault from './pages/Vault';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import Flashcards from './pages/Flashcards';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './components/Login';
import LottieLoader from './components/LottieLoader';

function AppContent() {
  const { isLoggedIn, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#0b1120] text-slate-500">
        <LottieLoader message="Initializing secure pipeline..." size={350} />
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Login />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootLayout />}>
          <Route index element={<Home />} />
          <Route path="chat" element={<Chat />} />
          <Route path="chunks" element={<Chunks />} />
          <Route path="vault" element={<Vault />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="settings" element={<Settings />} />
          <Route path="flashcards" element={<Flashcards />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
