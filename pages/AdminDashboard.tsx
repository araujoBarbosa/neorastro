import React, { useState, useEffect } from 'react';
import { MapVisualization } from '../components/MapVisualization';
import { MockDB, AuditLog, UserWithBilling, PLANS, SystemMessage } from '../services/mockDatabase';
import { Vehicle, VehicleStatus, ViewState } from '../types';

interface AdminDashboardProps {
  currentView?: ViewState;
}

interface DrawerConfig {
  isOpen: boolean;
  type: 'CLIENT' | 'VEHICLE' | null;
  data: UserWithBilling | Vehicle | null;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentView = ViewState.ADMIN_OVERVIEW }) => {
  const [users, setUsers] = useState<UserWithBilling[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [clientSearch, setClientSearch] = useState('');
  
  const [drawer, setDrawer] = useState<DrawerConfig>({ isOpen: false, type: null, data: null });
  // Novo State: Tab do Drawer (Detalhes vs Mensagens)
  const [drawerTab, setDrawerTab] = useState<'DETAILS' | 'MESSAGES'>('DETAILS');
  const [clientMessages, setClientMessages] = useState<SystemMessage[]>([]);
  
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [clientActionConfirm, setClientActionConfirm] = useState<{id: string, action: 'BLOCK' | 'UNBLOCK'} | null>(null);

  const refreshData = () => {
    setUsers(MockDB.getUsers() as UserWithBilling[]);
    setVehicles(MockDB.getVehicles());
    setAuditLogs(MockDB.getLogs());
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 5000);
    return () => clearInterval(interval);
  }, []);

  const totalUsers = users.filter(u => u.role === 'CLIENT').length;
  const activeVehicles = vehicles.filter(v => v.status === VehicleStatus.MOVING || v.status === VehicleStatus.ONLINE).length;
  const blockedVehicles = vehicles.filter(v => v.status === VehicleStatus.OFFLINE).length; 
  const overdueClients = users.filter(u => u.paymentStatus === 'overdue').length;
  const pendingAnalysis = users.filter(u => u.paymentStatus === 'analyzing').length;
  const currentMRR = MockDB.getMRR(); 

  const filteredUsers = users
    .filter(u => u.role === 'CLIENT' && (u.name.toLowerCase().includes(clientSearch.toLowerCase()) || u.email.toLowerCase().includes(clientSearch.toLowerCase())))
    .sort((a, b) => {
      const score = (status: string) => status === 'analyzing' ? 3 : status === 'pending' ? 2 : status === 'overdue' ? 1 : 0;
      return score(b.paymentStatus) - score(a.paymentStatus);
    });

  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const handleLockVehicle = (vId: string, lock: boolean) => {
    setLoadingAction(vId);
    setTimeout(() => {
      MockDB.toggleLock(vId, lock);
      refreshData(); 
      setLoadingAction(null);
    }, 2000);
  };

  const handleBlockClient = (userId: string, shouldBlock: boolean) => {
    setLoadingAction(userId);
    setTimeout(() => {
       MockDB.toggleClientBlock(userId, shouldBlock);
       refreshData();
       setLoadingAction(null);
       setClientActionConfirm(null);
    }, 1500);
  };

  const handleApprovePayment = (userId: string) => {
    setLoadingAction(userId);
    setTimeout(() => {
      MockDB.approvePayment(userId);
      refreshData();
      setLoadingAction(null);
    }, 1500);
  };

  const handleRejectPayment = (userId: string) => {
    setLoadingAction(userId);
    setTimeout(() => {
      MockDB.rejectPayment(userId);
      refreshData();
      setLoadingAction(null);
    }, 1000);
  };

  const openClientDrawer = (user: UserWithBilling) => {
    setDrawer({ isOpen: true, type: 'CLIENT', data: user });
    setDrawerTab('DETAILS');
    setClientMessages(MockDB.getMessagesByUser(user.id));
  };

  const closeDrawer = () => setDrawer(prev => ({ ...prev, isOpen: false }));

  // --- DRAWER COMPONENT ---
  const renderDrawer = () => {
    if (!drawer.isOpen || !drawer.data) return null;
    const isClient = drawer.type === 'CLIENT';
    const data = drawer.data as any; 
    const isLoading = loadingAction === data.id;

    return (
      <div className="fixed inset-0 z-[100] flex justify-end">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={closeDrawer}></div>

        <div className="relative w-full max-w-md bg-[#0E0E12] border-l border-amber-500/20 h-full shadow-2xl flex flex-col animate-slide-in-right">
           <div className="p-6 border-b border-white/5 bg-gradient-to-l from-amber-900/10 to-transparent flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest block mb-1">
                   {isClient ? 'Detalhes do Cliente' : 'Ficha Técnica'}
                </span>
                <h2 className="text-2xl font-bold text-white tracking-tight leading-none">
                  {isClient ? data.name : data.plate}
                </h2>
                <p className="text-xs text-slate-500 mt-1 font-mono">ID: {data.id}</p>
              </div>
              <button onClick={closeDrawer} className="text-slate-500 hover:text-white transition-colors">✕</button>
           </div>

           {/* Tabs for Client Drawer */}
           {isClient && (
             <div className="flex border-b border-white/5">
                <button 
                  onClick={() => setDrawerTab('DETAILS')} 
                  className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${drawerTab === 'DETAILS' ? 'text-white border-b-2 border-amber-500 bg-white/5' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  Visão Geral
                </button>
                <button 
                  onClick={() => setDrawerTab('MESSAGES')} 
                  className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${drawerTab === 'MESSAGES' ? 'text-white border-b-2 border-amber-500 bg-white/5' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  Mensagens ({clientMessages.length})
                </button>
             </div>
           )}

           <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
              
              {/* === TAB: MESSAGES === */}
              {isClient && drawerTab === 'MESSAGES' && (
                <div className="space-y-4">
                  {clientMessages.length === 0 ? (
                    <div className="text-center text-slate-500 py-10">Nenhuma mensagem enviada.</div>
                  ) : (
                    clientMessages.map((msg) => (
                      <div key={msg.id} className="bg-slate-900/50 border border-slate-700 rounded-lg p-3 animate-fade-in relative overflow-hidden group">
                         <div className={`absolute left-0 top-0 bottom-0 w-1 ${msg.channel === 'WHATSAPP' ? 'bg-emerald-500' : 'bg-blue-500'}`}></div>
                         <div className="flex justify-between items-start mb-1 pl-2">
                           <span className={`text-[10px] font-bold px-1.5 rounded ${msg.channel === 'WHATSAPP' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'}`}>
                             {msg.channel}
                           </span>
                           <span className="text-[10px] text-slate-500">{new Date(msg.timestamp).toLocaleString()}</span>
                         </div>
                         <h4 className="text-white text-sm font-bold pl-2 mb-1">{msg.title}</h4>
                         <p className="text-slate-400 text-xs pl-2 leading-relaxed">{msg.body}</p>
                         <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                           <span className="text-xs">✅</span>
                         </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* === TAB: DETAILS === */}
              {((isClient && drawerTab === 'DETAILS') || !isClient) && (
                <>
                {isClient && (
                  <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg p-5 border border-white/10 shadow-lg">
                    <h3 className="text-xs font-bold text-blue-400 mb-4 uppercase tracking-wider flex items-center gap-2">
                      <span>💳</span> Assinatura & Billing
                    </h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center"><span className="text-xs text-slate-400">Plano Atual</span><span className="text-sm font-bold text-white bg-blue-900/30 px-2 py-1 rounded border border-blue-500/30">{PLANS[data.plan as keyof typeof PLANS]?.name || data.plan}</span></div>
                      <div className="flex justify-between items-center"><span className="text-xs text-slate-400">Valor Mensal</span><span className="text-sm font-mono text-white">{formatCurrency(data.monthlyFee || 0)}</span></div>
                      <div className="flex justify-between items-center"><span className="text-xs text-slate-400">Próximo Vencimento</span><span className={`text-sm font-mono font-bold ${data.paymentStatus === 'overdue' ? 'text-red-400' : data.paymentStatus === 'due' ? 'text-amber-400' : 'text-emerald-400'}`}>{new Date(data.dueDate).toLocaleDateString('pt-BR')}</span></div>
                    </div>
                  </div>
                )}
                
                {/* Status Section */}
                <div className="bg-white/[0.02] rounded-lg p-4 border border-white/5">
                  <h3 className="text-xs font-bold text-white mb-4 uppercase tracking-wider">Status Operacional</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] text-slate-500 block mb-1">Situação</span>
                      {isClient ? (
                        <span className={`inline-flex items-center gap-2 px-2 py-1 rounded border text-xs font-bold ${data.isBlocked ? 'text-red-400 border-red-500/30 bg-red-900/10' : 'text-emerald-400 border-emerald-500/30 bg-emerald-900/10'}`}>
                          {data.isBlocked ? 'BLOQUEADO' : 'ATIVO'}
                        </span>
                      ) : (
                        <span className={`inline-flex items-center gap-2 px-2 py-1 rounded border text-xs font-bold ${data.status === 'offline' ? 'text-red-400 border-red-500/30 bg-red-900/10' : 'text-emerald-400 border-emerald-500/30 bg-emerald-900/10'}`}>
                          {data.status.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                </>
              )}

              {/* Footer Actions (Always visible) */}
              <div className="pt-4 border-t border-white/5">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Ações Administrativas</h3>
                {isClient ? (
                  <button disabled={isLoading} onClick={() => handleBlockClient(data.id, !data.isBlocked)} className={`w-full py-3 rounded font-bold text-xs uppercase tracking-widest border transition-all ${data.isBlocked ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500' : 'bg-transparent hover:bg-red-900/20 text-red-500 border-red-900 hover:border-red-500'}`}>
                    {isLoading ? 'Processando...' : (data.isBlocked ? '🔓 Desbloquear Cliente' : '🔒 Bloquear Cliente')}
                  </button>
                ) : (
                  <button disabled={isLoading} onClick={() => handleLockVehicle(data.id, data.status !== 'offline')} className={`w-full py-3 rounded font-bold text-xs uppercase tracking-widest border transition-all ${data.status === 'offline' ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500' : 'bg-transparent hover:bg-red-900/20 text-red-500 border-red-900 hover:border-red-500'}`}>
                    {isLoading ? 'Processando...' : (data.status === 'offline' ? '🔓 Liberar Veículo' : '🔒 Bloquear Veículo')}
                  </button>
                )}
              </div>
           </div>
        </div>
      </div>
    );
  };

  const renderExecutiveKPIs = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-fade-in-down">
       <div className="relative group bg-[#0A0A0C] border border-white/5 rounded-xl p-6 hover:border-amber-500/20 transition-all duration-500 overflow-hidden shadow-lg">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2"><span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span><h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Total de Clientes</h3></div>
            <div className="flex items-baseline gap-2"><span className="text-4xl font-bold text-white font-mono tracking-tighter">{String(totalUsers).padStart(2, '0')}</span></div>
          </div>
       </div>
       <div className="relative group bg-[#0A0A0C] border border-white/5 rounded-xl p-6 hover:border-emerald-500/20 transition-all duration-500 overflow-hidden shadow-lg">
          <div className="absolute top-0 right-0 p-4 opacity-10"><span className="text-4xl">💰</span></div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span><h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-500/80">Receita Mensal (MRR)</h3></div>
            <div className="flex items-baseline gap-2"><span className="text-4xl font-bold text-emerald-400 font-mono tracking-tighter">{formatCurrency(currentMRR)}</span></div>
            {pendingAnalysis > 0 && <div className="mt-2 text-xs text-yellow-500 font-bold animate-pulse">⚠ {pendingAnalysis} PIX para análise</div>}
          </div>
       </div>
       {/* ... other KPIs ... */}
    </div>
  );

  const renderClientManagement = () => (
    <div className="space-y-8 animate-fade-in max-w-[1600px] mx-auto">
       <div className="bg-[#0A0A0C] border border-white/5 rounded-2xl overflow-hidden shadow-2xl relative">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.08] text-[10px] uppercase tracking-[0.2em] text-slate-500 font-semibold bg-white/[0.01]">
                <th className="py-5 px-8 font-bold text-slate-400">Cliente / Plano</th>
                <th className="py-5 px-8 font-bold text-slate-400">Vencimento</th>
                <th className="py-5 px-8 font-bold text-slate-400">Valor</th>
                <th className="py-5 px-8 font-bold text-slate-400">Status Financeiro</th>
                <th className="py-5 px-8 font-bold text-right text-slate-400">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-sm">
              {filteredUsers.map(user => {
                 const isConfirming = clientActionConfirm?.id === user.id;
                 const isAnalyzing = user.paymentStatus === 'analyzing';
                 const isLoading = loadingAction === user.id;

                 return (
                   <tr key={user.id} className={`hover:bg-white/[0.02] transition-colors duration-200 group cursor-pointer ${user.isBlocked ? 'opacity-90 bg-red-950/[0.05]' : ''}`} onClick={() => openClientDrawer(user)}>
                     <td className="py-6 px-8">
                        <div className="flex items-center gap-5">
                           <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-base font-bold border shadow-lg relative ${user.isBlocked ? 'bg-red-900/10 text-red-500 border-red-500/20 grayscale' : 'bg-gradient-to-br from-slate-800 to-slate-900 text-amber-500 border-white/10'}`}>
                             {user.name.charAt(0)}
                             {isAnalyzing && <span className="absolute -top-1 -right-1 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span></span>}
                           </div>
                           <div>
                             <div className={`font-semibold text-base tracking-tight mb-1 ${user.isBlocked ? 'text-slate-400 line-through' : 'text-white'}`}>{user.name}</div>
                             <div className="text-xs text-slate-500 font-medium">{PLANS[user.plan as keyof typeof PLANS]?.name || user.plan}</div>
                           </div>
                        </div>
                     </td>
                     <td className="py-6 px-8"><span className="font-mono text-xs text-slate-400 bg-white/[0.03] px-2 py-1 rounded border border-white/[0.05]">{new Date(user.dueDate).toLocaleDateString('pt-BR')}</span></td>
                     <td className="py-6 px-8"><span className="font-mono text-sm text-white font-bold">{formatCurrency(user.monthlyFee || 0)}</span></td>
                     <td className="py-6 px-8">
                        <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all ${
                          user.paymentStatus === 'analyzing' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 animate-pulse' :
                          user.paymentStatus === 'pending' ? 'bg-slate-500/10 text-slate-400 border-slate-500/20' :
                          user.paymentStatus === 'overdue' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                          'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${user.paymentStatus === 'analyzing' ? 'bg-yellow-500' : user.paymentStatus === 'pending' ? 'bg-slate-500' : user.paymentStatus === 'overdue' ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
                          {user.paymentStatus === 'analyzing' ? 'EM ANÁLISE' : user.paymentStatus === 'pending' ? 'PENDENTE' : user.paymentStatus === 'overdue' ? 'VENCIDO' : 'EM DIA'}
                        </span>
                     </td>
                     <td className="py-6 px-8 text-right" onClick={(e) => e.stopPropagation()}>
                        {isAnalyzing ? (
                          <div className="flex justify-end gap-2">
                            <button disabled={isLoading} onClick={() => handleApprovePayment(user.id)} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded flex items-center gap-1 shadow-lg shadow-emerald-900/20 transition-all hover:scale-105 active:scale-95">
                              {isLoading ? '...' : '✓ Aprovar PIX'}
                            </button>
                            <button disabled={isLoading} onClick={() => handleRejectPayment(user.id)} className="bg-red-600/10 hover:bg-red-600 hover:text-white border border-red-600/20 text-red-500 text-xs font-bold px-3 py-1.5 rounded transition-all active:scale-95">✕</button>
                          </div>
                        ) : isConfirming ? (
                          <div className="flex justify-end items-center gap-3 animate-fade-in-right">
                             <button onClick={() => handleBlockClient(user.id, clientActionConfirm.action === 'BLOCK')} className="text-white text-xs bg-red-600 px-3 py-1 rounded">Confirmar</button>
                             <button onClick={() => setClientActionConfirm(null)} className="text-slate-400 text-xs">X</button>
                          </div>
                        ) : (
                          <button onClick={() => setClientActionConfirm({ id: user.id, action: user.isBlocked ? 'UNBLOCK' : 'BLOCK' })} className={`px-4 py-2 rounded-lg font-bold text-[10px] uppercase tracking-wider border transition-all duration-300 ${user.isBlocked ? 'text-emerald-500 border-emerald-500/30' : 'text-slate-400 border-slate-700 hover:text-red-400'}`}>
                            {user.isBlocked ? 'Desbloquear' : 'Bloquear'}
                          </button>
                        )}
                     </td>
                   </tr>
                 )
              })}
            </tbody>
          </table>
       </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in pb-12 text-slate-300">
      {renderDrawer()}
      <div className="relative">
        <div className="absolute -top-10 -left-10 w-64 h-64 bg-amber-500/5 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="flex flex-col md:flex-row justify-between items-end border-b border-white/5 pb-6">
          <div className="space-y-2"><h1 className="text-4xl font-bold text-white tracking-tight">Painel Administrativo</h1><span className="px-3 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-bold uppercase tracking-[0.2em]">Master Access</span></div>
        </div>
      </div>
      
      {renderExecutiveKPIs()}
      {currentView === ViewState.ADMIN_CLIENTS ? renderClientManagement() : null}
      
      {/* Logs Table (Keep existing component structure) */}
      <div className="mt-12 bg-[#0A0A0C] border border-white/5 rounded-xl overflow-hidden shadow-2xl relative">
       <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
         <div className="flex items-center gap-3"><span className="text-lg">📜</span><h3 className="text-sm font-bold text-white uppercase tracking-widest">Logs de Auditoria do Sistema</h3></div>
       </div>
       <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
         <table className="w-full text-left border-collapse">
           <thead className="sticky top-0 bg-[#0A0A0C] z-10">
             <tr className="text-[10px] uppercase tracking-wider text-slate-500 font-mono border-b border-white/5">
               <th className="p-3 pl-6">Timestamp</th><th className="p-3">Ação</th><th className="p-3">Alvo</th><th className="p-3">Detalhes</th><th className="p-3 text-right pr-6">Admin</th>
             </tr>
           </thead>
           <tbody className="text-xs font-mono">
             {auditLogs.map(log => (
               <tr key={log.id} className="hover:bg-white/[0.02] border-b border-white/[0.02] transition-colors">
                 <td className="p-3 pl-6 text-slate-400">{new Date(log.timestamp).toLocaleString('pt-BR')}</td>
                 <td className="p-3">
                   <span className={`px-2 py-0.5 rounded border text-[9px] font-bold ${log.action.includes('PIX') ? 'bg-emerald-900/20 text-emerald-400 border-emerald-500/20' : 'bg-blue-900/20 text-blue-400 border-blue-500/20'}`}>{log.action.replace(/_/g, ' ')}</span>
                 </td>
                 <td className="p-3 text-white font-bold">{log.targetName}</td>
                 <td className="p-3 text-slate-500 max-w-[300px] truncate">{log.details}</td>
                 <td className="p-3 text-right pr-6 text-amber-500/60">{log.admin}</td>
               </tr>
             ))}
           </tbody>
         </table>
       </div>
    </div>
    </div>
  );
};