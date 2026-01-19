import React, { useState, useEffect } from 'react';
import { ViewState, UserRole } from './types';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Architecture } from './pages/Architecture';
import { FleetAI } from './pages/FleetAI';
import Login from './pages/Login';
import Signup from './pages/Signup';
import { AdminDashboard } from './pages/AdminDashboard';
import { supabase } from './src/lib/supabase';

// Types for Auth Navigation
type AuthView = 'LOGIN' | 'SIGNUP';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);
  const [session, setSession] = useState<any>(null);
  const [userRole, setUserRole] = useState<UserRole>('CLIENT');
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);

  // Mobile Menu State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // State to manage Login vs Signup view
  const [currentAuthView, setCurrentAuthView] = useState<AuthView>('LOGIN');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      const email = data.session?.user?.email?.toLowerCase() || '';
      const role = email.includes('admin') ? 'ADMIN' : 'CLIENT';
      setUserRole(role);
      setCurrentView(role === 'ADMIN' ? ViewState.ADMIN_OVERVIEW : ViewState.DASHBOARD);
      setIsAuthChecking(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      const email = newSession?.user?.email?.toLowerCase() || '';
      const role = email.includes('admin') ? 'ADMIN' : 'CLIENT';
      setUserRole(role);
      setCurrentView(role === 'ADMIN' ? ViewState.ADMIN_OVERVIEW : ViewState.DASHBOARD);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)');

    const handleResize = (event: MediaQueryListEvent | MediaQueryList) => {
      const mobile = event.matches;
      setIsMobile(mobile);
      if (!mobile) {
        setIsMobileMenuOpen(false);
      }
    };

    handleResize(mediaQuery);
    mediaQuery.addEventListener('change', handleResize);
    return () => mediaQuery.removeEventListener('change', handleResize);
  }, []);

  const handleLogout = () => {
    supabase.auth.signOut();
    setSession(null);
    setUserRole('CLIENT');
    setCurrentView(ViewState.DASHBOARD);
    setCurrentAuthView('LOGIN');
    setIsMobileMenuOpen(false);
  };

  const handleViewChange = (view: ViewState) => {
    setCurrentView(view);
    setIsMobileMenuOpen(false); // Close mobile menu on navigation
  };

  const renderView = () => {
    switch (currentView) {
      // Roteia ambas as views Admin para o mesmo componente, que gerencia o conteúdo interno via props
      case ViewState.ADMIN_OVERVIEW:
      case ViewState.ADMIN_CLIENTS:
        return userRole === 'ADMIN' ? <AdminDashboard currentView={currentView} /> : <Dashboard onLogout={handleLogout} />;

      case ViewState.DASHBOARD:
        return <Dashboard onLogout={handleLogout} />;
      case ViewState.ARCHITECTURE:
        return <Architecture />;
      case ViewState.AI_INSIGHTS:
        return <FleetAI />;
      default:
        return <Dashboard onLogout={handleLogout} />;
    }
  };

  // Prevent flash of login screen while checking localStorage
  if (isAuthChecking) {
    return <div className="min-h-screen bg-slate-950"></div>;
  }

  // Auth Guard & Navigation Flow
  if (!session) {
    if (currentAuthView === 'SIGNUP') {
      return <Signup onNavigateToLogin={() => setCurrentAuthView('LOGIN')} />;
    }
    return <Login onNavigateToSignup={() => setCurrentAuthView('SIGNUP')} />;
  }

  return (
    <div className={`min-h-screen font-sans flex overflow-hidden ${userRole === 'ADMIN' ? 'bg-[#0B0F19]' : 'bg-slate-950'}`}>

      {/* Mobile Overlay Backdrop */}
      {isMobile && isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 md:hidden animate-fade-in"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      <Sidebar
        currentView={currentView}
        onChangeView={handleViewChange}
        isAdmin={userRole === 'ADMIN'}
        isOpen={isMobile ? isMobileMenuOpen : true}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area - ml-0 on mobile, ml-64 on desktop */}
      <main className={`flex-1 h-screen overflow-y-auto transition-all duration-300 w-full md:ml-64 ${userRole === 'ADMIN' ? 'bg-[#0B0F19]' : 'bg-slate-950'}`}>

        {/* Header Responsive */}
        <header className={`sticky top-0 z-10 backdrop-blur px-4 md:px-8 py-4 flex justify-between items-center border-b ${userRole === 'ADMIN'
          ? 'bg-[#0B0F19]/90 border-amber-900/30'
          : 'bg-slate-950/80 border-slate-800'
          }`}>
          <div className="flex items-center gap-3">
            {/* Hamburger Button (Mobile Only) */}
            <button
              onClick={() => setIsMobileMenuOpen((open) => !open)}
              className="md:hidden p-2 -ml-2 text-slate-400 hover:text-white rounded-lg active:bg-white/10"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div>
              <h2 className={`font-semibold text-sm md:text-lg ${userRole === 'ADMIN' ? 'text-amber-100' : 'text-white'}`}>
                {currentView === ViewState.ADMIN_OVERVIEW && 'Painel Executivo'}
                {currentView === ViewState.ADMIN_CLIENTS && 'Gestão de Clientes'}
                {currentView === ViewState.DASHBOARD && 'Painel de Controle'}
                {currentView === ViewState.ARCHITECTURE && 'Documentação'}
                {currentView === ViewState.AI_INSIGHTS && 'NeoRastro AI'}
              </h2>
              <p className={`text-[10px] md:text-xs ${userRole === 'ADMIN' ? 'text-amber-500/60' : 'text-slate-500'}`}>
                {userRole === 'ADMIN' ? 'Admin Access' : 'Bem-vindo, Cliente'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <button onClick={handleLogout} className={`text-[10px] md:text-xs font-bold px-2 md:px-3 py-1.5 rounded border transition-colors ${userRole === 'ADMIN'
              ? 'bg-amber-900/20 text-amber-500 border-amber-500/30 hover:bg-amber-900/40'
              : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}>
              SAIR
            </button>
            {userRole === 'ADMIN' ? (
              <div className="w-8 h-8 rounded bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center font-bold text-[#0B0F19] shadow-lg shadow-amber-500/20">A</div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-emerald-500 border-2 border-slate-900 shadow-lg shadow-blue-500/20"></div>
            )}
          </div>
        </header>

        {/* Content Padding Adjusted for Mobile */}
        <div className="p-4 md:p-8 pb-24 md:pb-20">
          {renderView()}
        </div>
      </main>
    </div>
  );
};

export default App;