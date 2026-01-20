import React, { useState, useEffect } from 'react';
import { Vehicle, StatMetric, VehicleStatus } from '../types';
import { MOCK_VEHICLES } from '../constants';
import { MockDB, UserWithBilling } from '../services/mockDatabase';
import { StatCard } from '../components/StatCard';
import { MapVisualization } from '../components/MapVisualization';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// --- MICRO-COMPONENT: TOAST NOTIFICATION ---
interface ToastProps {
  message: string;
  type: 'success' | 'info';
  onClose: () => void;
}
const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 right-6 z-[9999] animate-slide-in-up w-[90%] md:w-auto">
      <div className={`flex items-center gap-3 px-5 py-3 rounded-lg shadow-2xl border backdrop-blur-md ${type === 'success'
          ? 'bg-emerald-900/80 border-emerald-500/50 text-emerald-100'
          : 'bg-blue-900/80 border-blue-500/50 text-blue-100'
        }`}>
        <span className="text-xl">{type === 'success' ? '✅' : 'ℹ️'}</span>
        <span className="text-sm font-medium">{message}</span>
        <button onClick={onClose} className="ml-auto text-white/50 hover:text-white p-2">✕</button>
      </div>
    </div>
  );
};

const SkeletonCard = () => (
  <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 animate-pulse h-32">
    <div className="h-4 bg-slate-700 rounded w-1/2 mb-4"></div>
    <div className="h-8 bg-slate-700 rounded w-3/4"></div>
  </div>
);

const EmptyState = ({ message, subMessage }: { message: string, subMessage: string }) => (
  <div className="flex flex-col items-center justify-center h-full text-center p-8 text-slate-500 border-2 border-dashed border-slate-700 rounded-xl bg-slate-800/30 transition-all duration-500 hover:border-slate-600">
    <span className="text-4xl mb-3 opacity-50 grayscale hover:grayscale-0 transition-all duration-300">🚘</span>
    <h3 className="text-lg font-semibold text-slate-300">{message}</h3>
    <p className="text-sm">{subMessage}</p>
  </div>
);

// --- COMPONENTE: HEADER & ALERTS ---
interface OwnerHeaderProps {
  onLogout?: () => void;
  user: UserWithBilling | null;
}

const OwnerHeader: React.FC<OwnerHeaderProps> = ({ onLogout, user }) => {
  const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  const userName = user ? user.name.split(' ')[0] : 'Cliente';

  const isDueSoon = user?.paymentStatus === 'due';
  const isOverdue = user?.paymentStatus === 'overdue';

  return (
    <div className="flex flex-col gap-4 mb-2">
      {/* Alertas com animação de entrada */}
      {isDueSoon && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex items-start gap-3 animate-fade-in-down">
          <span className="text-amber-500 text-lg">⚠️</span>
          <div>
            <h4 className="text-amber-400 font-bold text-sm">Atenção ao vencimento</h4>
            <p className="text-amber-200/80 text-xs mt-0.5">
              Sua fatura vence em breve ({new Date(user.dueDate).toLocaleDateString('pt-BR')}).
              Mantenha seu plano ativo.
            </p>
          </div>
        </div>
      )}

      {isOverdue && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-3 animate-fade-in-down">
          <span className="text-red-500 text-lg">🛑</span>
          <div>
            <h4 className="text-red-400 font-bold text-sm">Serviço Temporariamente Pausado</h4>
            <p className="text-red-200/80 text-xs mt-0.5">
              Pendência na fatura identificada. Regularize para acesso total.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 md:h-14 md:w-14 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-lg font-bold text-white shadow-lg border-2 border-slate-800 ring-2 ring-slate-700/50 transition-transform duration-300 hover:scale-105">
            {userName.charAt(0)}
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              Olá, {userName} <span className="text-2xl animate-wave origin-bottom-right inline-block">👋</span>
            </h1>
            <p className="text-xs md:text-sm text-slate-400 font-medium capitalize flex flex-wrap items-center gap-2">
              <span className="hidden md:inline">{today}</span>
              {user?.paymentStatus === 'ok' && (
                <span className="text-emerald-400 text-xs bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                  ✓ Ativa
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Mobile: Hidden Config Button to save space, Logout is in Header */}
        <div className="hidden md:flex items-center gap-3">
          <button className="text-xs font-medium text-slate-400 hover:text-white transition-all duration-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-500 px-3 py-2 rounded-lg flex items-center gap-2 active:scale-95">
            ⚙️ Configurações
          </button>
        </div>
      </div>
    </div>
  );
};

const WelcomeBanner = ({ onDismiss }: { onDismiss: () => void }) => (
  <div className="bg-gradient-to-r from-indigo-900/50 to-blue-900/50 border border-indigo-500/30 rounded-xl p-6 mb-6 relative overflow-hidden animate-slide-in-down shadow-lg group">
    <div className="absolute top-0 right-0 p-4 opacity-10 transition-transform duration-700 group-hover:scale-110 group-hover:rotate-12">
      <span className="text-6xl">🚀</span>
    </div>
    <div className="relative z-10 pr-8">
      <h3 className="text-xl font-bold text-white mb-2">Bem-vindo ao NeoRastro!</h3>
      <p className="text-slate-300 text-sm leading-relaxed max-w-2xl mb-4">
        Ficamos felizes em ter você a bordo. Seu ambiente de monitoramento profissional já está configurado.
      </p>
      <button
        onClick={onDismiss}
        className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-3 md:py-2 rounded-lg transition-all duration-200 shadow-lg shadow-indigo-900/20 hover:shadow-indigo-500/30 active:scale-95 w-full md:w-auto"
      >
        Começar a usar
      </button>
    </div>
    <button onClick={onDismiss} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors p-2">✕</button>
  </div>
);

const TipsWidget = ({ onDismiss }: { onDismiss: () => void }) => (
  <div className="bg-slate-800 rounded-xl border border-slate-700 p-5 shadow-lg relative animate-fade-in transition-all hover:border-slate-600">
    <button onClick={onDismiss} className="absolute top-3 right-3 text-slate-500 hover:text-white text-xs transition-colors p-2">✕</button>
    <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
      <span className="text-blue-400">💡</span> Dicas Rápidas
    </h3>
    <ul className="space-y-3">
      <li className="flex gap-3 text-xs text-slate-400 items-start group">
        <span className="bg-slate-700 text-white w-5 h-5 rounded flex items-center justify-center font-bold shrink-0 mt-0.5 group-hover:bg-blue-600 transition-colors">1</span>
        <span>No mapa, <strong>toque no veículo</strong> para ver detalhes.</span>
      </li>
      <li className="flex gap-3 text-xs text-slate-400 items-start group">
        <span className="bg-slate-700 text-white w-5 h-5 rounded flex items-center justify-center font-bold shrink-0 mt-0.5 group-hover:bg-blue-600 transition-colors">2</span>
        <span>Use o botão <strong>"Trajeto"</strong> para ver histórico.</span>
      </li>
    </ul>
  </div>
);

// --- COMPONENTE: PAYMENT BLOCKER OVERLAY (REFINED) ---
const PaymentBlocker = ({ user }: { user: UserWithBilling }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const isAnalyzing = user.paymentStatus === 'analyzing';

  const handleInformPayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      MockDB.requestPaymentAnalysis(user.id);
      setIsProcessing(false);
      window.location.reload();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-[#0B1121] border border-slate-800 rounded-2xl shadow-2xl p-8 text-center relative overflow-hidden animate-zoom-in">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-emerald-500 to-blue-500"></div>

        <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-700 shadow-inner">
          <span className="text-4xl animate-pulse-slow">
            {isAnalyzing ? '🕵️‍♂️' : '👋'}
          </span>
        </div>

        <h2 className="text-2xl font-bold text-white mb-3 tracking-tight">
          {isAnalyzing ? 'Estamos conferindo...' : 'Vamos ativar sua conta?'}
        </h2>

        <div className="text-slate-400 text-sm mb-8 leading-relaxed space-y-2">
          {isAnalyzing ? (
            <>
              <p>Recebemos sua solicitação de análise.</p>
              <p>Nosso time financeiro já está com seu comprovante. Em instantes, seu acesso completo será liberado.</p>
            </>
          ) : (
            <>
              <p>Falta pouco para você monitorar sua frota.</p>
              <p>Para liberar o acesso aos mapas e relatórios, finalize o pagamento do seu plano via PIX.</p>
            </>
          )}
        </div>

        {!isAnalyzing && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 mb-8 text-left transition-all hover:bg-slate-800">
            <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1">Chave PIX (CNPJ)</p>
            <div className="flex justify-between items-center">
              <code className="text-white font-mono bg-black/20 px-2 py-0.5 rounded">00.000.000/0001-99</code>
              <span className="text-emerald-400 font-bold">R$ {user.monthlyFee.toFixed(2)}</span>
            </div>
          </div>
        )}

        {isAnalyzing ? (
          <button disabled className="w-full bg-slate-800 text-slate-400 font-bold py-3 rounded-xl border border-slate-700 cursor-not-allowed opacity-50">
            Aguardando validação...
          </button>
        ) : (
          <button
            onClick={handleInformPayment}
            disabled={isProcessing}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-900/20 transition-all duration-300 flex items-center justify-center gap-2 active:scale-95"
          >
            {isProcessing ? 'Enviando...' : 'Já realizei o pagamento'}
          </button>
        )}
      </div>
    </div>
  );
};

interface DashboardProps {
  onLogout?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUser, setCurrentUser] = useState<UserWithBilling | null>(null);

  // UX State
  const [showWelcome, setShowWelcome] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [toast, setToast] = useState<{ msg: string, type: 'success' | 'info' } | null>(null);

  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId) || null;
  const filteredVehicles = vehicles.filter(v =>
    v.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.model.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const initData = async () => {
      await new Promise(resolve => setTimeout(resolve, 1200));
      const user = MockDB.getCurrentUserSession();
      setCurrentUser(user);

      if (user) {
        if (!user.preferences?.hasSeenWelcome) setShowWelcome(true);
        if (!user.preferences?.hasDismissedTips) setShowTips(true);
        const allVehicles = MOCK_VEHICLES;
        setVehicles(allVehicles);
        if (allVehicles.length > 0) setSelectedVehicleId(allVehicles[0].id);
      }
      setIsLoading(false);
    };
    initData();
  }, []);

  const handleDismissWelcome = () => {
    setShowWelcome(false);
    if (currentUser) {
      MockDB.updateUserPreferences(currentUser.id, { hasSeenWelcome: true });
      setToast({ msg: 'Ambiente preparado para você!', type: 'success' });
    }
  };

  const handleDismissTips = () => {
    setShowTips(false);
    if (currentUser) MockDB.updateUserPreferences(currentUser.id, { hasDismissedTips: true });
  };

  useEffect(() => {
    if (isLoading || !currentUser || currentUser.isBlocked) return;
    const interval = setInterval(() => {
      setVehicles(prev => prev.map(v => {
        if (v.status === VehicleStatus.MOVING || v.status === VehicleStatus.ONLINE) {
          return {
            ...v,
            lastPosition: {
              ...v.lastPosition,
              lat: v.lastPosition.lat + (Math.random() - 0.5) * 0.001,
              lng: v.lastPosition.lng + (Math.random() - 0.5) * 0.001,
              speed: Math.max(0, Math.min(120, v.lastPosition.speed + (Math.random() * 10 - 5))),
              voltage: 13.5 + (Math.random() * 0.5)
            }
          };
        }
        return v;
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, [isLoading, currentUser]);

  const handleVehicleClick = (id: string) => {
    setSelectedVehicleId(id);
    // On mobile, scroll to top to see map when vehicle is clicked from list
    if (window.innerWidth < 768) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const metrics: StatMetric[] = [
    { label: 'Meus Veículos', value: `${vehicles.length}`, trend: 'Total Cadastrado', trendUp: true },
    { label: 'Em Atividade', value: vehicles.filter(v => v.status === VehicleStatus.MOVING).length.toString(), trend: 'Rodando agora', trendUp: true },
    { label: 'Consumo Médio', value: '8.4 km/L', trend: '-2.1% Economia', trendUp: false },
    { label: 'Alertas', value: '0', trend: 'Tudo normal', trendUp: true },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-full bg-slate-800"></div>
          <div className="space-y-2">
            <div className="w-48 h-6 bg-slate-800 rounded"></div>
            <div className="w-32 h-4 bg-slate-800 rounded"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4"><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
      </div>
    );
  }

  if (currentUser && (currentUser.paymentStatus === 'pending' || currentUser.paymentStatus === 'analyzing')) {
    return (
      <>
        <PaymentBlocker user={currentUser} />
        <div className="blur-sm opacity-20 pointer-events-none h-screen overflow-hidden">
          <OwnerHeader onLogout={onLogout} user={currentUser} />
        </div>
      </>
    );
  }

  if (vehicles.length === 0) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center space-y-4">
        <OwnerHeader onLogout={onLogout} user={currentUser} />
        <EmptyState message="Vamos conectar sua frota?" subMessage="Seu painel está pronto. Cadastre seu primeiro veículo para começar o monitoramento." />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <OwnerHeader onLogout={onLogout} user={currentUser} />
      {showWelcome && <WelcomeBanner onDismiss={handleDismissWelcome} />}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, i) => <StatCard key={i} {...m} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* MAPA & CHART SECTION */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-800 rounded-xl p-1 border border-slate-700 shadow-xl overflow-hidden group transition-all duration-300 hover:shadow-blue-900/10 hover:border-slate-600">
            <div className="px-4 py-3 bg-slate-800 border-b border-slate-700/50 flex justify-between items-center">
              <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wide flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                Localização
              </h2>
              {selectedVehicle && (
                <div className="flex items-center gap-2 animate-fade-in">
                  <span className="hidden md:inline text-xs text-slate-400">Visualizando:</span>
                  <span className="text-xs font-bold text-white bg-slate-700 px-2 py-1 rounded border border-slate-600">
                    {selectedVehicle.plate}
                  </span>
                </div>
              )}
            </div>
            {/* Mapa Height Responsivo: 400px mobile / 600px desktop */}
            <div className="h-[400px] md:h-[600px] relative">
              {/* <MapVisualization vehicles={vehicles} selectedVehicleId={selectedVehicleId} /> */}
              <div style={{ color: "white", padding: 20 }}>
                Dashboard carregado sem mapa ✅
              </div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl p-5 border border-slate-700 shadow-lg min-h-[250px] transition-all duration-300 hover:border-slate-600">
            {selectedVehicle ? (
              <div className="h-full flex flex-col">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-2">
                  <div>
                    <h3 className="text-white font-medium text-lg flex items-center gap-2">
                      Histórico
                      <span className="text-xs font-normal text-slate-500 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-700">{selectedVehicle.model}</span>
                    </h3>
                    <p className="text-sm text-slate-400">Velocidade (km/h)</p>
                  </div>
                  <div className="flex gap-3 text-xs font-medium w-full md:w-auto">
                    <div className={`px-3 py-2 md:py-1.5 rounded-md border flex items-center gap-2 transition-colors duration-300 w-full md:w-auto justify-center ${selectedVehicle.lastPosition.ignition ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-slate-700 border-slate-600 text-slate-400'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${selectedVehicle.lastPosition.ignition ? 'bg-emerald-400' : 'bg-slate-500'}`}></span>
                      {selectedVehicle.lastPosition.ignition ? 'IGNIÇÃO LIGADA' : 'DESLIGADO'}
                    </div>
                  </div>
                </div>
                <div className="flex-1 w-full min-h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={selectedVehicle.history.map(h => ({ ...h, timestamp: h.timestamp.split('T')[1].substring(0, 5) }))}>
                      <defs>
                        <linearGradient id="colorSpeed" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                      <XAxis dataKey="timestamp" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                      <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} dx={-10} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} itemStyle={{ color: '#60a5fa' }} cursor={{ stroke: '#475569', strokeWidth: 1 }} />
                      <Area type="monotone" dataKey="speed" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorSpeed)" animationDuration={1000} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <EmptyState message="Nenhum veículo selecionado" subMessage="Selecione um item da lista para ver os detalhes." />
            )}
          </div>
        </div>

        {/* SIDEBAR RIGHT (VEHICLE LIST) */}
        <div className="flex flex-col gap-6 lg:sticky lg:top-24">
          {showTips && <TipsWidget onDismiss={handleDismissTips} />}

          <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-xl flex flex-col h-[500px] lg:h-[700px] transition-all hover:border-slate-600">
            <div className="p-5 border-b border-slate-700 bg-slate-800 rounded-t-xl z-10">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-bold text-white tracking-tight">Meus Veículos</h2>
                <span className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded-full">{filteredVehicles.length}</span>
              </div>
              <div className="relative group/search">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por placa ou modelo..."
                  className="w-full bg-slate-900/50 border border-slate-600 rounded-lg pl-10 pr-4 py-3 md:py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-500 group-hover/search:bg-slate-900/80"
                />
                <span className="absolute left-3 top-3 md:top-2.5 text-slate-500 text-sm group-hover/search:text-white transition-colors">🔍</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
              {filteredVehicles.map(v => {
                const isSelected = selectedVehicleId === v.id;
                return (
                  <button
                    key={v.id}
                    onClick={() => handleVehicleClick(v.id)}
                    className={`w-full text-left p-4 rounded-lg border transition-all duration-200 group relative overflow-hidden ${isSelected ? 'bg-slate-750 border-l-4 border-l-blue-500 border-y-slate-700 border-r-slate-700 shadow-md ring-1 ring-black/20' : 'bg-slate-800 border-transparent hover:bg-slate-700/50 hover:translate-x-1'
                      }`}
                  >
                    {isSelected && <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent pointer-events-none"></div>}
                    <div className="flex justify-between items-start mb-1 relative z-10">
                      <span className={`font-bold text-lg tracking-tight block font-mono ${isSelected ? 'text-white' : 'text-slate-200 group-hover:text-white'}`}>{v.plate}</span>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border shadow-sm ${v.status === VehicleStatus.MOVING ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                          v.status === VehicleStatus.ONLINE ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            'bg-slate-700/50 text-slate-400 border-slate-600'
                        }`}>{v.status}</span>
                    </div>
                    <div className="mb-3 relative z-10">
                      <span className="text-xs text-slate-400 font-medium">{v.model}</span>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-slate-700/50 relative z-10">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center justify-center w-5 h-5 rounded bg-slate-700/50 text-slate-400 text-xs">🚀</span>
                        <span className={`text-sm font-mono font-medium ${v.lastPosition.speed > 0 ? 'text-blue-300' : 'text-slate-500'}`}>{Math.round(v.lastPosition.speed)} km/h</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};