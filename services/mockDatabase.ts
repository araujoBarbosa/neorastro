import { User, Vehicle, VehicleStatus, UserRole, PaymentStatus, PaymentMethod } from '../types';
import { MOCK_VEHICLES } from '../constants';

const DB_KEY_USERS = 'neorastro_db_users';
const DB_KEY_VEHICLES = 'neorastro_db_vehicles';
const DB_KEY_LOGS = 'neorastro_db_audit_logs';
const DB_KEY_MESSAGES = 'neorastro_db_messages';

// --- Billing Types & Constants ---
export type PlanType = 'BASIC' | 'PRO' | 'ENTERPRISE';
export type ExtendedPaymentStatus = PaymentStatus | 'pending' | 'analyzing';

export const PLANS = {
  BASIC: { name: 'Plano Básico', price: 49.90, limit: 1, stripePriceId: 'price_basic_123' },
  PRO: { name: 'Plano Profissional', price: 99.90, limit: 5, stripePriceId: 'price_pro_456' },
  ENTERPRISE: { name: 'Plano Empresarial', price: 199.90, limit: 999, stripePriceId: 'price_ent_789' }
};

export interface UserPreferences {
  hasSeenWelcome: boolean;
  hasDismissedTips: boolean;
}

export interface UserWithBilling extends Omit<User, 'paymentStatus'> {
  plan: PlanType;
  monthlyFee: number;
  dueDate: string; // ISO Date
  paymentStatus: ExtendedPaymentStatus; 
  preferences: UserPreferences;
}

export interface SystemMessage {
  id: string;
  userId: string;
  channel: 'WHATSAPP' | 'EMAIL';
  type: 'WELCOME' | 'PAYMENT_REMINDER' | 'PAYMENT_CONFIRMED' | 'PAYMENT_FAILED' | 'ACCOUNT_BLOCKED' | 'PAYMENT_ANALYSIS' | 'SUBSCRIPTION_CREATED';
  title: string;
  body: string;
  status: 'SENT' | 'READ';
  timestamp: string;
}

export interface AuditLog {
  id: string;
  action: string;
  admin: string;
  targetId: string;
  targetName: string;
  details: string;
  timestamp: string;
}

// --- Initial Data Seeds ---
const INITIAL_ADMIN: UserWithBilling = {
  id: 'admin-01',
  name: 'Administrador Geral',
  email: 'admin@neorastro.com',
  role: 'ADMIN',
  createdAt: new Date().toISOString(),
  paymentStatus: 'ok',
  paymentMethod: 'PIX',
  isBlocked: false,
  plan: 'ENTERPRISE',
  monthlyFee: 0,
  dueDate: new Date(new Date().getFullYear() + 1, 0, 1).toISOString(),
  preferences: { hasSeenWelcome: true, hasDismissedTips: true }
};

const INITIAL_CLIENT: UserWithBilling = {
  id: 'client-01',
  name: 'Jadson Cliente',
  email: 'jadson@empresa.com',
  role: 'CLIENT',
  whatsapp: '(11) 99999-9999',
  createdAt: new Date().toISOString(),
  paymentStatus: 'ok', 
  paymentMethod: 'PIX',
  isBlocked: false,
  plan: 'PRO',
  monthlyFee: 99.90,
  dueDate: new Date(new Date().getTime() + (2 * 24 * 60 * 60 * 1000)).toISOString(),
  preferences: { hasSeenWelcome: false, hasDismissedTips: false }
};

const INITIAL_VEHICLES = MOCK_VEHICLES.map(v => ({
  ...v,
  ownerId: 'client-01'
}));

// --- Database Logic ---

export const MockDB = {
  init: () => {
    if (!localStorage.getItem(DB_KEY_USERS)) {
      localStorage.setItem(DB_KEY_USERS, JSON.stringify([INITIAL_ADMIN, INITIAL_CLIENT]));
    }
    if (!localStorage.getItem(DB_KEY_VEHICLES)) {
      localStorage.setItem(DB_KEY_VEHICLES, JSON.stringify(INITIAL_VEHICLES));
    }
    if (!localStorage.getItem(DB_KEY_LOGS)) {
      localStorage.setItem(DB_KEY_LOGS, JSON.stringify([]));
    }
    if (!localStorage.getItem(DB_KEY_MESSAGES)) {
      localStorage.setItem(DB_KEY_MESSAGES, JSON.stringify([]));
    }
    MockDB.runBillingRoutine();
  },

  getCurrentUserSession: (): UserWithBilling | null => {
    const role = localStorage.getItem('neorastro_role');
    if (role === 'ADMIN') return INITIAL_ADMIN;
    const sessionEmail = localStorage.getItem('neorastro_user_email');
    const users = MockDB.getUsers();
    if (sessionEmail) {
      return users.find(u => u.email === sessionEmail) || users.find(u => u.role === 'CLIENT') || null;
    }
    return users.find(u => u.role === 'CLIENT') || null;
  },

  updateUserPreferences: (userId: string, prefs: Partial<UserPreferences>) => {
    const users = MockDB.getUsers();
    const updated = users.map(u => {
      if (u.id === userId) {
        return { ...u, preferences: { ...u.preferences, ...prefs } };
      }
      return u;
    });
    localStorage.setItem(DB_KEY_USERS, JSON.stringify(updated));
  },

  // --- AUTOMATED MESSAGING ENGINE ---
  sendSystemMessage: (userId: string, type: SystemMessage['type'], vars: Record<string, string> = {}) => {
    const messages = JSON.parse(localStorage.getItem(DB_KEY_MESSAGES) || '[]');
    const user = MockDB.getUsers().find(u => u.id === userId);
    if (!user) return;

    let title = '';
    let body = '';
    let channel: SystemMessage['channel'] = 'WHATSAPP'; // Default premium feel

    const userName = user.name.split(' ')[0];

    switch (type) {
      case 'WELCOME':
        title = 'Bem-vindo ao NeoRastro';
        body = `Olá ${userName} 👋! Seu cadastro foi realizado com sucesso. Aguardamos a ativação do seu plano para liberar o acesso total.`;
        break;
      case 'SUBSCRIPTION_CREATED':
        title = 'Assinatura Iniciada';
        body = `Olá ${userName}, recebemos sua inscrição no ${vars.planName}. Assim que a operadora confirmar o pagamento, seu acesso será liberado automaticamente.`;
        break;
      case 'PAYMENT_ANALYSIS':
        title = 'Pagamento em Análise';
        body = `Recebemos seu comprovante, ${userName}. Nosso time financeiro já está validando. Em instantes você receberá a confirmação.`;
        break;
      case 'PAYMENT_CONFIRMED':
        title = 'Acesso Liberado 🚀';
        body = `Tudo certo! Seu pagamento do ${vars.planName || 'plano'} foi confirmado. Acesse o painel agora e cadastre seus veículos.`;
        channel = 'EMAIL';
        break;
      case 'PAYMENT_FAILED':
        title = 'Falha no Pagamento';
        body = `Olá ${userName}, não conseguimos processar a renovação da sua assinatura. Por favor, atualize seu cartão para evitar interrupção.`;
        break;
      case 'ACCOUNT_BLOCKED':
        title = 'Serviço Pausado';
        body = `Identificamos uma pendência na fatura. O acesso ao monitoramento foi temporariamente pausado até a regularização.`;
        break;
    }

    const newMessage: SystemMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      userId,
      channel,
      type,
      title,
      body,
      status: 'SENT',
      timestamp: new Date().toISOString()
    };

    messages.unshift(newMessage);
    localStorage.setItem(DB_KEY_MESSAGES, JSON.stringify(messages));
    
    // Log do disparo
    MockDB.createLog(
      'DISPARO_MENSAGEM', 
      userId, 
      user.name, 
      `Enviado via ${channel}: ${title}`
    );
  },

  getMessagesByUser: (userId: string): SystemMessage[] => {
    const msgs = JSON.parse(localStorage.getItem(DB_KEY_MESSAGES) || '[]');
    return msgs.filter((m: SystemMessage) => m.userId === userId);
  },

  runBillingRoutine: () => {
    const rawUsers = JSON.parse(localStorage.getItem(DB_KEY_USERS) || '[]');
    let hasUpdates = false;

    const updatedUsers = rawUsers.map((user: UserWithBilling) => {
      if (user.role === 'ADMIN') return user;
      if (!user.preferences) {
        user.preferences = { hasSeenWelcome: false, hasDismissedTips: false };
        hasUpdates = true;
      }
      if (user.paymentStatus === 'pending' || user.paymentStatus === 'analyzing') {
         if (!user.isBlocked) {
           hasUpdates = true;
           return { ...user, isBlocked: true };
         }
         return user;
      }

      const today = new Date();
      const dueDate = new Date(user.dueDate);
      const diffTime = dueDate.setHours(0,0,0,0) - today.setHours(0,0,0,0);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let newStatus: ExtendedPaymentStatus = 'ok';
      let shouldBlock = user.isBlocked;

      if (diffDays < 0) {
        newStatus = 'overdue';
        if (!user.isBlocked) {
          shouldBlock = true;
          MockDB.sendSystemMessage(user.id, 'ACCOUNT_BLOCKED');
          MockDB.createLog('BLOQUEIO_AUTOMATICO_INADIMPLENCIA', user.id, user.name, `Fatura vencida há ${Math.abs(diffDays)} dias.`);
        }
      } else if (diffDays <= 3) {
        newStatus = 'due';
      } else {
        newStatus = 'ok';
      }

      if (newStatus !== user.paymentStatus || shouldBlock !== user.isBlocked) {
        hasUpdates = true;
        return { ...user, paymentStatus: newStatus, isBlocked: shouldBlock };
      }
      return user;
    });

    if (hasUpdates) {
      localStorage.setItem(DB_KEY_USERS, JSON.stringify(updatedUsers));
    }
  },

  getUsers: (): UserWithBilling[] => {
    MockDB.runBillingRoutine();
    return JSON.parse(localStorage.getItem(DB_KEY_USERS) || '[]');
  },

  getVehicles: (): Vehicle[] => JSON.parse(localStorage.getItem(DB_KEY_VEHICLES) || '[]'),
  getLogs: (): AuditLog[] => JSON.parse(localStorage.getItem(DB_KEY_LOGS) || '[]').sort((a: AuditLog, b: AuditLog) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
  getMRR: (): number => MockDB.getUsers().filter(u => u.role === 'CLIENT' && !u.isBlocked).reduce((acc, curr) => acc + (curr.monthlyFee || 0), 0),

  createLog: (action: string, targetId: string, targetName: string, details: string) => {
    const logs = MockDB.getLogs();
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      action,
      admin: 'sistema@neorastro.com',
      targetId,
      targetName,
      details,
      timestamp: new Date().toISOString()
    };
    logs.unshift(newLog); 
    localStorage.setItem(DB_KEY_LOGS, JSON.stringify(logs));
    return newLog;
  },

  // --- PIX / MANUAL FLOW ---
  requestPaymentAnalysis: (userId: string) => {
    const users = MockDB.getUsers();
    let updated = false;
    const newUsers = users.map(u => {
      if (u.id === userId) {
        updated = true;
        return { ...u, paymentStatus: 'analyzing' as ExtendedPaymentStatus };
      }
      return u;
    });
    
    if (updated) {
      localStorage.setItem(DB_KEY_USERS, JSON.stringify(newUsers));
      MockDB.createLog('CLIENTE_SOLICITOU_CONFIRMACAO', userId, 'Cliente', 'Solicitação de análise PIX.');
      MockDB.sendSystemMessage(userId, 'PAYMENT_ANALYSIS');
    }
  },

  approvePayment: (userId: string) => {
    const users = MockDB.getUsers();
    let updatedUser: UserWithBilling | null = null;
    
    const newUsers = users.map(u => {
      if (u.id === userId) {
        const nextMonth = new Date();
        nextMonth.setDate(nextMonth.getDate() + 30);
        updatedUser = { ...u, paymentStatus: 'ok', isBlocked: false, dueDate: nextMonth.toISOString() };
        return updatedUser;
      }
      return u;
    });

    localStorage.setItem(DB_KEY_USERS, JSON.stringify(newUsers));
    if (updatedUser) {
      MockDB.createLog('PAGAMENTO_CONFIRMADO_PIX', userId, updatedUser.name, 'Acesso liberado manualmente.');
      MockDB.sendSystemMessage(userId, 'PAYMENT_CONFIRMED', { planName: PLANS[(updatedUser as UserWithBilling).plan].name });
    }
  },

  rejectPayment: (userId: string) => {
    const users = MockDB.getUsers();
    let userName = '';
    const newUsers = users.map(u => {
      if (u.id === userId) {
        userName = u.name;
        return { ...u, paymentStatus: 'pending' as ExtendedPaymentStatus };
      }
      return u;
    });

    localStorage.setItem(DB_KEY_USERS, JSON.stringify(newUsers));
    if (userName) {
      MockDB.createLog('PAGAMENTO_RECUSADO_PIX', userId, userName, 'Comprovante rejeitado.');
      MockDB.sendSystemMessage(userId, 'PAYMENT_FAILED');
    }
  },

  // --- STRIPE AUTOMATION SIMULATION ---
  // In a real scenario, these would be calls to the Backend API
  simulateStripeSubscription: (userId: string) => {
    const users = MockDB.getUsers();
    const updated = users.map(u => {
      if (u.id === userId) {
        const nextMonth = new Date();
        nextMonth.setDate(nextMonth.getDate() + 30);
        
        return { 
          ...u, 
          paymentStatus: 'ok' as ExtendedPaymentStatus, 
          isBlocked: false, 
          dueDate: nextMonth.toISOString(),
          paymentMethod: 'STRIPE' as PaymentMethod,
          stripeCustomerId: `cus_${Math.random().toString(36).substr(2,8)}`,
          stripeSubscriptionId: `sub_${Math.random().toString(36).substr(2,8)}`
        };
      }
      return u;
    });

    localStorage.setItem(DB_KEY_USERS, JSON.stringify(updated));
    const user = updated.find(u => u.id === userId);
    
    if (user) {
      MockDB.createLog('WEBHOOK_STRIPE', userId, user.name, 'invoice.paid: Assinatura ativada automaticamente.');
      MockDB.sendSystemMessage(userId, 'PAYMENT_CONFIRMED', { planName: PLANS[user.plan].name });
    }
  },

  createUser: (name: string, email: string, whatsapp: string, plan: PlanType, paymentMethod: PaymentMethod = 'PIX'): UserWithBilling => {
    const users = MockDB.getUsers();
    const existing = users.find(u => u.email === email);
    if (existing) return existing;

    const today = new Date();
    const newUser: UserWithBilling = {
      id: `user-${Date.now()}`,
      name,
      email,
      whatsapp,
      role: 'CLIENT',
      createdAt: new Date().toISOString(),
      paymentStatus: 'pending',
      paymentMethod,
      isBlocked: true,
      plan: plan,
      monthlyFee: PLANS[plan].price,
      dueDate: today.toISOString(),
      preferences: { hasSeenWelcome: false, hasDismissedTips: false }
    };

    users.push(newUser);
    localStorage.setItem(DB_KEY_USERS, JSON.stringify(users));
    localStorage.setItem('neorastro_user_email', email);

    MockDB.createVehicleForUser(newUser.id);
    MockDB.createLog('CADASTRO_CLIENTE', newUser.id, newUser.name, `Plano ${PLANS[plan].name} selecionado via ${paymentMethod}.`);
    
    // Dispara mensagem de boas vindas
    MockDB.sendSystemMessage(newUser.id, 'WELCOME');
    
    if (paymentMethod === 'STRIPE') {
       MockDB.sendSystemMessage(newUser.id, 'SUBSCRIPTION_CREATED', { planName: PLANS[plan].name });
    }

    return newUser;
  },

  createVehicleForUser: (userId: string) => {
    const vehicles = MockDB.getVehicles();
    const plate = `NEW-${Math.floor(Math.random() * 9000) + 1000}`;
    const newVehicle: Vehicle = {
      id: `v-${Date.now()}`,
      ownerId: userId,
      name: 'Veículo Novo',
      plate: plate,
      model: 'Volkswagen Delivery',
      driver: 'A Definir',
      status: VehicleStatus.IDLE,
      lastPosition: {
        lat: -23.5505 + (Math.random() * 0.05),
        lng: -46.6333 + (Math.random() * 0.05),
        speed: 0,
        ignition: false,
        voltage: 12.6,
        timestamp: new Date().toISOString()
      },
      history: []
    };
    vehicles.push(newVehicle);
    localStorage.setItem(DB_KEY_VEHICLES, JSON.stringify(vehicles));
  },

  registerVehicle: (ownerId: string, plate: string, model: string, type: string) => {
    const vehicles = MockDB.getVehicles();
    if (vehicles.find(v => v.plate === plate)) throw new Error("Placa já cadastrada.");
    const newVehicle: Vehicle = {
      id: `v-${Date.now()}`,
      ownerId: ownerId,
      name: `${type} - ${model}`,
      plate: plate.toUpperCase(),
      model: model,
      driver: 'Não atribuído',
      status: VehicleStatus.OFFLINE,
      lastPosition: {
        lat: -23.5505 + (Math.random() * 0.02),
        lng: -46.6333 + (Math.random() * 0.02),
        speed: 0,
        ignition: false,
        voltage: 12.0,
        timestamp: new Date().toISOString()
      },
      history: []
    };
    vehicles.push(newVehicle);
    localStorage.setItem(DB_KEY_VEHICLES, JSON.stringify(vehicles));
    MockDB.createLog('CADASTRO_VEICULO', newVehicle.id, newVehicle.plate, `Veículo ${model} cadastrado manualmente.`);
    return newVehicle;
  },

  toggleLock: (vehicleId: string, lock: boolean) => {
    const vehicles = MockDB.getVehicles();
    let vehicleName = '';
    const updated = vehicles.map(v => {
      if (v.id === vehicleId) {
        vehicleName = v.plate;
        return { ...v, status: lock ? VehicleStatus.OFFLINE : VehicleStatus.IDLE };
      }
      return v;
    });
    localStorage.setItem(DB_KEY_VEHICLES, JSON.stringify(updated));
    if (vehicleName) MockDB.createLog(lock ? 'BLOQUEIO_VEICULO' : 'DESBLOQUEIO_VEICULO', vehicleId, vehicleName, lock ? 'Comando manual.' : 'Comando manual.');
  },

  toggleClientBlock: (userId: string, shouldBlock: boolean) => {
    const users = MockDB.getUsers();
    let userName = '';
    const updated = users.map(u => {
      if (u.id === userId) {
        userName = u.name;
        // Ao bloquear/desbloquear manualmente, pode ser útil mandar msg, mas deixarei manual aqui por enquanto
        return { ...u, isBlocked: shouldBlock };
      }
      return u;
    });
    localStorage.setItem(DB_KEY_USERS, JSON.stringify(updated));
    if (userName) MockDB.createLog(shouldBlock ? 'BLOQUEIO_CLIENTE' : 'DESBLOQUEIO_CLIENTE', userId, userName, shouldBlock ? 'Bloqueio administrativo manual.' : 'Desbloqueio administrativo manual.');
  }
};

MockDB.init();