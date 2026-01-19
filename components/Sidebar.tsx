import React from 'react';
import { ViewState } from '../types';

interface SidebarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  isAdmin?: boolean;
  isOpen?: boolean; // Mobile state
  onClose?: () => void; // Mobile close handler
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, isAdmin = false, isOpen = false, onClose }) => {
  const clientMenuItems = [
    { id: ViewState.DASHBOARD, label: 'Monitoramento', icon: '📡' },
    { id: ViewState.AI_INSIGHTS, label: 'Inteligência Artificial', icon: '🧠' },
    { id: ViewState.ARCHITECTURE, label: 'Arquitetura do Sistema', icon: '📐' },
  ];

  const adminMenuItems = [
    { id: ViewState.ADMIN_OVERVIEW, label: 'Visão Global', icon: '🌐' },
    { id: ViewState.ADMIN_CLIENTS, label: 'Gestão de Clientes', icon: '👥' }, // Novo Item
    { id: ViewState.DASHBOARD, label: 'Simular Cliente', icon: '👁️' },
    { id: ViewState.ARCHITECTURE, label: 'Infraestrutura', icon: '🏗️' },
  ];

  const menuItems = isAdmin ? adminMenuItems : clientMenuItems;

  // Theme Config
  const theme = isAdmin ? {
    bg: 'bg-[#050505]',
    border: 'border-white/5',
    textActive: 'text-amber-100',
    textInactive: 'text-slate-500',
    activeBg: 'bg-gradient-to-r from-amber-900/20 to-transparent border-l-2 border-amber-500',
    logoColor: 'text-amber-400',
    logoBox: 'bg-gradient-to-br from-amber-700 via-yellow-700 to-amber-900 shadow-[0_0_15px_rgba(245,158,11,0.2)]',
  } : {
    bg: 'bg-slate-900',
    border: 'border-slate-800',
    textActive: 'text-white',
    textInactive: 'text-slate-400',
    activeBg: 'bg-blue-600 text-white shadow-lg shadow-blue-900/40 rounded-xl',
    logoColor: 'text-blue-500',
    logoBox: 'bg-blue-600',
  };

  return (
    <aside
      className={`
        fixed left-0 top-0 h-full w-64 z-30 
        transition-transform duration-300 ease-out
        ${theme.bg} border-r ${theme.border} flex flex-col
        ${isOpen ? 'translate-x-0 pointer-events-auto' : '-translate-x-full pointer-events-none'} 
        md:translate-x-0 md:pointer-events-auto
      `}
      aria-hidden={!isOpen}
    >
      <div className={`p-6 border-b ${theme.border} flex items-center justify-between relative overflow-hidden`}>
        {isAdmin && <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-600/50 via-yellow-500/50 to-transparent"></div>}

        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white shadow-lg ${theme.logoBox}`}>
            {isAdmin ? 'A' : 'N'}
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white leading-none">
              Neo<span className={theme.logoColor}>Rastro</span>
            </h1>
            {isAdmin && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                <span className="text-[9px] uppercase tracking-[0.25em] text-amber-500/80 font-bold">Command</span>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Close Button inside Sidebar */}
        <button
          onClick={onClose}
          className="md:hidden text-slate-500 hover:text-white p-1"
        >
          ✕
        </button>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-4 px-4 pt-2">
          {isAdmin ? 'Módulos de Controle' : 'Menu Principal'}
        </div>
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onChangeView(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 transition-all duration-300 text-sm font-medium group ${isAdmin ? 'rounded-r-lg rounded-l-none' : 'rounded-xl'
              } ${currentView === item.id
                ? `${theme.activeBg} ${theme.textActive}`
                : `${theme.textInactive} hover:text-white hover:bg-white/5`
              }`}
          >
            <span className={`text-lg transition-transform duration-300 ${currentView === item.id ? 'scale-110' : 'scale-100 group-hover:scale-110'}`}>
              {item.icon}
            </span>
            {item.label}
          </button>
        ))}
      </nav>

      <div className={`p-4 border-t ${theme.border}`}>
        <div className={`rounded-xl p-4 border ${isAdmin ? 'bg-amber-950/10 border-amber-900/20' : 'bg-slate-800/30 border-white/5'}`}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Status do Sistema</p>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isAdmin ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]' : 'bg-emerald-500'} animate-pulse`}></span>
                <span className={`text-sm font-medium ${isAdmin ? 'text-amber-100' : 'text-slate-300'}`}>
                  {isAdmin ? 'SECURE' : 'Online'}
                </span>
              </div>
            </div>
            {isAdmin && (
              <span className="text-amber-500 text-xs">🔒</span>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};