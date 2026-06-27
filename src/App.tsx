import { useState, useEffect, useMemo, useRef } from 'react';
import { Transaction, SavingsBank, ScheduledPayment } from './types';
import {
  INITIAL_MAIN_BALANCE,
  INITIAL_SAVINGS_BANKS,
  INITIAL_TRANSACTIONS,
  INITIAL_SCHEDULED_PAYMENTS
} from './data/initialData';
import FinanceChart from './components/FinanceChart';
import SavingsSpaces from './components/SavingsSpaces';
import TransactionsSection from './components/TransactionsSection';
import ScheduledPayments from './components/ScheduledPayments';
import { Landmark, TrendingUp, HelpCircle, RefreshCw, Sparkles, Clock, Calendar, Sliders, Plus, Minus } from 'lucide-react';

export default function App() {
  // --- States ---
  // Clean start logic for version v3
  useEffect(() => {
    const isV3 = localStorage.getItem('finanzas_v3');
    if (!isV3) {
      localStorage.clear();
      localStorage.setItem('finanzas_v3', 'true');
      setMainBalance(0);
      setBanks(INITIAL_SAVINGS_BANKS);
      setTransactions([]);
      setPayments([]);
      saveStateImmediate(0, INITIAL_SAVINGS_BANKS, [], []);
    }
  }, []);

  const [mainBalance, setMainBalance] = useState<number>(() => {
    const isV3 = localStorage.getItem('finanzas_v3');
    if (!isV3) return 0;
    const saved = localStorage.getItem('finanzas_main_balance');
    return saved !== null ? parseFloat(saved) : INITIAL_MAIN_BALANCE;
  });

  const [banks, setBanks] = useState<SavingsBank[]>(() => {
    const isV3 = localStorage.getItem('finanzas_v3');
    if (!isV3) return INITIAL_SAVINGS_BANKS;
    const saved = localStorage.getItem('finanzas_savings_banks');
    return saved !== null ? JSON.parse(saved) : INITIAL_SAVINGS_BANKS;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const isV3 = localStorage.getItem('finanzas_v3');
    if (!isV3) return INITIAL_TRANSACTIONS;
    const saved = localStorage.getItem('finanzas_transactions');
    return saved !== null ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  const [payments, setPayments] = useState<ScheduledPayment[]>(() => {
    const isV3 = localStorage.getItem('finanzas_v3');
    if (!isV3) return INITIAL_SCHEDULED_PAYMENTS;
    const saved = localStorage.getItem('finanzas_scheduled_payments');
    return saved !== null ? JSON.parse(saved) : INITIAL_SCHEDULED_PAYMENTS;
  });

  // Time & Greeting State
  const [currentTime, setCurrentTime] = useState<string>('');
  const [greeting, setGreeting] = useState<string>('Hola');

  // Sparkle notification feedback for simulated day advance
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // New States for Adjusting Dinero Actual Manually
  const [showAdjustBalanceModal, setShowAdjustBalanceModal] = useState<boolean>(false);
  const [adjustAmount, setAdjustAmount] = useState<string>('');
  const [adjustType, setAdjustType] = useState<'add' | 'subtract' | 'set'>('add');

  // --- Refs for saving throttling ---
  const banksRef = useRef<SavingsBank[]>(banks);
  banksRef.current = banks;

  // --- Real-time Yield Loop (Ticks every 100ms) ---
  useEffect(() => {
    // Annual rate: 13.0% = 0.13
    // Ticks per year: 365 days * 24 hrs * 60 mins * 60 secs * 10 ticks/sec = 315,360,000 ticks/year
    const TICKS_PER_YEAR = 365 * 24 * 60 * 60 * 10;
    const RATE_PER_TICK = 0.13 / TICKS_PER_YEAR;

    const interval = setInterval(() => {
      setBanks((prevBanks) => {
        return prevBanks.map((bank) => {
          const interest = bank.balance * RATE_PER_TICK;
          return {
            ...bank,
            balance: bank.balance + interest,
            accruedInterest: bank.accruedInterest + interest
          };
        });
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // --- Periodic Local Storage Save (Every 5 seconds for ticking balances) ---
  useEffect(() => {
    const saveInterval = setInterval(() => {
      localStorage.setItem('finanzas_savings_banks', JSON.stringify(banksRef.current));
    }, 5000);

    return () => clearInterval(saveInterval);
  }, []);

  // --- Real-time clock and greetings ---
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      
      const hour = now.getHours();
      if (hour >= 6 && hour < 12) {
        setGreeting('Buenos días');
      } else if (hour >= 12 && hour < 19) {
        setGreeting('Buenas tardes');
      } else {
        setGreeting('Buenas noches');
      }
    };
    
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // --- Trigger toast feedback ---
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg(null);
    }, 4000);
  };

  // --- Save helpers for major events ---
  const saveStateImmediate = (
    newMain: number,
    newBanks: SavingsBank[],
    newTrans: Transaction[],
    newPayments: ScheduledPayment[]
  ) => {
    localStorage.setItem('finanzas_main_balance', newMain.toString());
    localStorage.setItem('finanzas_savings_banks', JSON.stringify(newBanks));
    localStorage.setItem('finanzas_transactions', JSON.stringify(newTrans));
    localStorage.setItem('finanzas_scheduled_payments', JSON.stringify(newPayments));
  };

  // --- Core Handlers ---

  // 1. Add normal Transaction (income or expense)
  const handleAddTransaction = (newT: Omit<Transaction, 'id' | 'date'>) => {
    const t: Transaction = {
      ...newT,
      id: 't_' + Date.now(),
      date: new Date().toISOString()
    };

    const updatedTrans = [t, ...transactions];
    let updatedBalance = mainBalance;

    if (t.type === 'income') {
      updatedBalance += t.amount;
    } else {
      updatedBalance -= t.amount;
    }

    setTransactions(updatedTrans);
    setMainBalance(updatedBalance);
    saveStateImmediate(updatedBalance, banks, updatedTrans, payments);
    showToast(`Registrado: ${t.description} por $${t.amount.toFixed(2)}`);
  };

  // 2. Transfer between Main Balance and Savings accounts
  const handleTransfer = (bankId: string, amount: number, direction: 'deposit' | 'withdraw') => {
    let updatedBalance = mainBalance;
    const updatedBanks = banks.map((b) => {
      if (b.id === bankId) {
        if (direction === 'deposit') {
          updatedBalance -= amount;
          return { ...b, balance: b.balance + amount };
        } else {
          updatedBalance += amount;
          return { ...b, balance: b.balance - amount };
        }
      }
      return b;
    });

    const transferDescription = direction === 'deposit'
      ? `Traspaso a Ahorro ${banks.find(x => x.id === bankId)?.logoName}`
      : `Retiro de Ahorro ${banks.find(x => x.id === bankId)?.logoName}`;

    const t: Transaction = {
      id: 't_trans_' + Date.now(),
      type: direction === 'deposit' ? 'expense' : 'income',
      amount: amount,
      category: 'Rendimientos',
      description: transferDescription,
      date: new Date().toISOString()
    };

    const updatedTrans = [t, ...transactions];

    setMainBalance(updatedBalance);
    setBanks(updatedBanks);
    setTransactions(updatedTrans);
    saveStateImmediate(updatedBalance, updatedBanks, updatedTrans, payments);
    showToast(`${direction === 'deposit' ? 'Guardado' : 'Retirado'} con éxito: $${amount.toFixed(2)}`);
  };

  // 3. Pay scheduled bill
  const handlePayBill = (paymentId: string) => {
    const bill = payments.find(p => p.id === paymentId);
    if (!bill || bill.isPaid) return;

    // Deduct from Main Balance
    const updatedBalance = mainBalance - bill.amount;
    
    // Mark payment as paid
    const updatedPayments = payments.map(p => {
      if (p.id === paymentId) {
        return { ...p, isPaid: true };
      }
      return p;
    });

    // Register transaction record
    const t: Transaction = {
      id: 't_bill_' + Date.now(),
      type: 'expense',
      amount: bill.amount,
      category: bill.category,
      description: `Pago: ${bill.title}`,
      date: new Date().toISOString()
    };

    const updatedTrans = [t, ...transactions];

    setMainBalance(updatedBalance);
    setPayments(updatedPayments);
    setTransactions(updatedTrans);
    saveStateImmediate(updatedBalance, banks, updatedTrans, updatedPayments);
    showToast(`Factura pagada: ${bill.title} ($${bill.amount.toFixed(2)})`);
  };

  // 4. Add new scheduled payment
  const handleAddPayment = (newP: Omit<ScheduledPayment, 'id' | 'isPaid'>) => {
    const p: ScheduledPayment = {
      ...newP,
      id: 's_' + Date.now(),
      isPaid: false
    };

    const updatedPayments = [p, ...payments];
    setPayments(updatedPayments);
    saveStateImmediate(mainBalance, banks, transactions, updatedPayments);
    showToast(`Agendado: ${p.title} vences el ${p.dueDate}`);
  };

  // 5. Remove scheduled payment
  const handleRemovePayment = (id: string) => {
    const p = payments.find(x => x.id === id);
    const updatedPayments = payments.filter(p => p.id !== id);
    setPayments(updatedPayments);
    saveStateImmediate(mainBalance, banks, transactions, updatedPayments);
    if (p) showToast(`Eliminado de la agenda: ${p.title}`);
  };

  // 6. Hard reset to defaults
  const handleResetData = () => {
    if (window.confirm('¿Estás seguro de que quieres restablecer todas tus finanzas a los valores por defecto? Se borrarán tus transacciones personalizadas.')) {
      setMainBalance(INITIAL_MAIN_BALANCE);
      setBanks(INITIAL_SAVINGS_BANKS);
      setTransactions(INITIAL_TRANSACTIONS);
      setPayments(INITIAL_SCHEDULED_PAYMENTS);
      saveStateImmediate(INITIAL_MAIN_BALANCE, INITIAL_SAVINGS_BANKS, INITIAL_TRANSACTIONS, INITIAL_SCHEDULED_PAYMENTS);
      showToast('Finanzas restablecidas con éxito.');
    }
  };

  // 6b. Adjust main balance manually
  const handleAdjustMainBalance = (amount: number, type: 'add' | 'subtract' | 'set') => {
    let updatedBalance = mainBalance;
    let description = '';
    let transType: 'income' | 'expense' = 'income';

    if (type === 'add') {
      updatedBalance += amount;
      description = 'Ajuste manual: Ingreso de fondos';
      transType = 'income';
    } else if (type === 'subtract') {
      updatedBalance = Math.max(0, updatedBalance - amount);
      description = 'Ajuste manual: Retiro de fondos';
      transType = 'expense';
    } else if (type === 'set') {
      const difference = amount - updatedBalance;
      updatedBalance = amount;
      if (difference !== 0) {
        description = `Ajuste manual: Establecer saldo a $${amount.toFixed(2)}`;
        transType = difference > 0 ? 'income' : 'expense';
        amount = Math.abs(difference);
      }
    }

    setMainBalance(updatedBalance);

    if (description) {
      const t: Transaction = {
        id: 't_adj_' + Date.now(),
        type: transType,
        amount: amount,
        category: transType === 'income' ? 'Otros Ingresos' : 'Otros Gastos',
        description: description,
        date: new Date().toISOString()
      };
      const updatedTrans = [t, ...transactions];
      setTransactions(updatedTrans);
      saveStateImmediate(updatedBalance, banks, updatedTrans, payments);
    } else {
      saveStateImmediate(updatedBalance, banks, transactions, payments);
    }

    showToast(`Dinero actual ajustado a $${updatedBalance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`);
    setShowAdjustBalanceModal(false);
    setAdjustAmount('');
  };

  // 7. Simulated time travel: Simulate 10 days of compound interest + automatic overdue bills
  const handleSimulate10Days = () => {
    // Interest calculation:
    // Annual rate: 13.0% = 0.13
    // Daily rate = 0.13 / 365
    // For 10 days, the multiplier is (1 + 0.13/365)^10
    const compoundMultiplier = Math.pow(1 + 0.13 / 365, 10);
    
    let totalSimulatedYieldAccrued = 0;

    const updatedBanks = banks.map((bank) => {
      const originalBalance = bank.balance;
      const newBalance = originalBalance * compoundMultiplier;
      const gained = newBalance - originalBalance;
      totalSimulatedYieldAccrued += gained;

      return {
        ...bank,
        balance: newBalance,
        accruedInterest: bank.accruedInterest + gained
      };
    });

    // Also register an income transaction for this major yield event
    const yieldTransaction: Transaction = {
      id: 't_yield_sim_' + Date.now(),
      type: 'income',
      amount: totalSimulatedYieldAccrued,
      category: 'Rendimientos',
      description: 'Rendimiento 13% (10 días simulados)',
      date: new Date().toISOString()
    };

    const updatedTrans = [yieldTransaction, ...transactions];

    setBanks(updatedBanks);
    setTransactions(updatedTrans);
    saveStateImmediate(mainBalance, updatedBanks, updatedTrans, payments);
    showToast(`⚡ ¡Simulación completada! Generaste $${totalSimulatedYieldAccrued.toFixed(4)} en interés en 10 días.`);
  };

  // --- Derivations ---
  const totalSavingsValue = useMemo(() => {
    return banks.reduce((sum, b) => sum + b.balance, 0);
  }, [banks]);

  const netWorthValue = mainBalance + totalSavingsValue;

  return (
    <div id="app-root-viewport" className="min-h-screen pb-16 bg-[#f5f5f7]">
      {/* Dynamic Toast Feedback Notification */}
      {toastMsg && (
        <div id="toast-notification" className="fixed top-6 right-6 z-50 bg-gray-950 text-white text-xs font-semibold px-4 py-3.5 rounded-2xl shadow-xl flex items-center gap-2 border border-gray-800 animate-in fade-in slide-in-from-top-4 duration-300">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Modern High-End Top Navigation Panel */}
      <header id="app-top-header" className="sticky top-0 bg-[#f5f5f7]/80 backdrop-blur-md border-b border-gray-200/50 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center">
              <span className="text-white text-xs font-bold font-mono"></span>
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-gray-950">Billetera</h1>
              <p className="text-[10px] font-medium text-gray-400 font-mono">FINANZAS INTELIGENTES</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Live Clock Badge */}
            {currentTime && (
              <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-gray-100 shadow-2xs">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-xs font-mono font-bold text-gray-700">{currentTime}</span>
              </div>
            )}

            {/* Apple reset button */}
            <button
              id="btn-reset-everything"
              onClick={handleResetData}
              title="Restablecer todos los datos"
              className="p-2 text-gray-400 hover:text-gray-900 rounded-full hover:bg-white transition-all border border-transparent hover:border-gray-100"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* Welcome Section & Main Action Area */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-950">{greeting}, Alejandro</h2>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          {/* Time Machine & Action controls */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              id="btn-simulate-time-travel"
              onClick={handleSimulate10Days}
              className="px-4 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 text-xs font-bold rounded-full transition-all border border-amber-200 flex items-center gap-2 shadow-2xs"
            >
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              Simular Rendimiento de 10 Días (+13% Compuesto)
            </button>
          </div>
        </div>

        {/* Hero Balance Cards & Main Action Block */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* AVAILABLE CASH - DINERO ACTUAL (Gasto e Ingreso directos) */}
          <div id="main-balance-hero-card" className="bg-slate-900 text-white rounded-[32px] p-8 shadow-sm flex flex-col justify-between min-h-[200px] relative overflow-hidden md:col-span-1">
            <div className="absolute top-0 right-0 w-36 h-36 rounded-full filter blur-2xl bg-white/5 pointer-events-none -mr-8 -mt-8" />
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">Dinero Actual</span>
              <span className="text-4xl font-bold tracking-tighter block mt-1.5">
                ${mainBalance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </span>
              <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                *Tus gastos de consumo se descuentan automáticamente de este saldo disponible sin tocar tus ahorros.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 block animate-pulse" />
                <span className="text-xs font-medium text-slate-300">Conectado</span>
              </div>
              <button
                id="btn-adjust-main-balance"
                onClick={() => setShowAdjustBalanceModal(true)}
                className="px-3 py-1 bg-white/10 hover:bg-white/25 active:scale-95 text-[11px] text-white rounded-full transition-all flex items-center gap-1 font-semibold border border-white/10"
              >
                <Sliders className="w-3 h-3 text-slate-300" /> Ajustar Dinero
              </button>
            </div>
          </div>

          {/* TOTAL SAVED (IN BANCOS 13%) */}
          <div id="savings-balance-hero-card" className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm flex flex-col justify-between min-h-[200px] md:col-span-1">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block">Ahorro Blindado (13% Yield)</span>
              <span className="text-4xl font-bold tracking-tighter text-slate-900 block mt-1.5">
                ${totalSavingsValue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </span>
              <p className="text-[10px] text-gray-400 mt-2 leading-relaxed">
                Dinero apartado y distribuido en cuentas Nu, Mercado Pago y Klar con rendimientos garantizados.
              </p>
            </div>

            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                <TrendingUp className="w-3 h-3" /> Promedio 13% anual
              </span>
              <span className="text-[10px] font-mono font-semibold text-gray-400">3 Cuentas Activas</span>
            </div>
          </div>

          {/* NET WORTH - PATRIMONIO TOTAL */}
          <div id="networth-hero-card" className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm flex flex-col justify-between min-h-[200px] md:col-span-1">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block">Patrimonio Neto</span>
              <span className="text-4xl font-bold tracking-tighter text-slate-900 block mt-1.5">
                ${netWorthValue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </span>
              <p className="text-[10px] text-gray-400 mt-2 leading-relaxed">
                Suma total de tu capital disponible y tus fondos bajo rendimiento anual.
              </p>
            </div>

            <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-gray-600">
              <span>Distribución de Fondos</span>
              <span className="font-mono text-[10px] bg-slate-100 px-2 py-0.5 rounded-md">{((totalSavingsValue / (netWorthValue || 1)) * 100).toFixed(0)}% Ahorros</span>
            </div>
          </div>

        </div>

        {/* Main Section Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Area: Accounts and Charts (Span 2) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Visual Analytics */}
            <FinanceChart
              transactions={transactions}
              banks={banks}
              mainBalance={mainBalance}
            />

            {/* Savings Cuentas */}
            <SavingsSpaces
              banks={banks}
              mainBalance={mainBalance}
              onTransfer={handleTransfer}
            />

          </div>

          {/* Right Area: Agenda & History (Span 1) */}
          <div className="lg:col-span-1 space-y-8">
            
            {/* Calendar Scheduled Payments */}
            <ScheduledPayments
              payments={payments}
              onPayBill={handlePayBill}
              onAddPayment={handleAddPayment}
              onRemovePayment={handleRemovePayment}
            />

            {/* Incomes & Expenses List */}
            <TransactionsSection
              transactions={transactions}
              onAddTransaction={handleAddTransaction}
            />

          </div>

        </div>

      </main>

      {/* Modal: Ajustar Dinero Actual Manualmente */}
      {showAdjustBalanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-[32px] max-w-md w-full p-8 border border-gray-100 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Ajustar Dinero Actual</h3>
                <p className="text-xs text-gray-400 mt-1">Modifica tu saldo disponible de forma rápida.</p>
              </div>
              <button
                onClick={() => {
                  setShowAdjustBalanceModal(false);
                  setAdjustAmount('');
                }}
                className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Current State Indicator */}
            <div className="bg-slate-50 rounded-2xl p-4 mb-6 flex justify-between items-center border border-slate-100">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Saldo Disponible Actual:</span>
              <span className="text-lg font-bold text-slate-900">
                ${mainBalance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const amt = parseFloat(adjustAmount);
                if (isNaN(amt) || amt < 0) {
                  alert('Por favor introduce un monto numérico válido y mayor a 0');
                  return;
                }
                handleAdjustMainBalance(amt, adjustType);
              }}
              className="space-y-6"
            >
              {/* Adjustment Mode Options */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">
                  Tipo de Ajuste
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType('add')}
                    className={`py-3 px-2 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1.5 ${
                      adjustType === 'add'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs'
                        : 'bg-white border-gray-100 hover:bg-gray-50 text-gray-600'
                    }`}
                  >
                    <span className="p-1 rounded-full bg-emerald-100 text-emerald-700">
                      <Plus className="w-3.5 h-3.5" />
                    </span>
                    Agregar
                  </button>

                  <button
                    type="button"
                    onClick={() => setAdjustType('subtract')}
                    className={`py-3 px-2 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1.5 ${
                      adjustType === 'subtract'
                        ? 'bg-rose-50 border-rose-500 text-rose-800 shadow-xs'
                        : 'bg-white border-gray-100 hover:bg-gray-50 text-gray-600'
                    }`}
                  >
                    <span className="p-1 rounded-full bg-rose-100 text-rose-700">
                      <Minus className="w-3.5 h-3.5" />
                    </span>
                    Quitar
                  </button>

                  <button
                    type="button"
                    onClick={() => setAdjustType('set')}
                    className={`py-3 px-2 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1.5 ${
                      adjustType === 'set'
                        ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                        : 'bg-white border-gray-100 hover:bg-gray-50 text-gray-600'
                    }`}
                  >
                    <span className={`p-1 rounded-full ${adjustType === 'set' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'}`}>
                      <Sliders className="w-3.5 h-3.5" />
                    </span>
                    Fijar Saldo
                  </button>
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">
                  Monto ($ MXN)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    required
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-black/5 focus:bg-white transition-all text-sm font-semibold"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAdjustBalanceModal(false);
                    setAdjustAmount('');
                  }}
                  className="flex-1 py-3 border border-gray-100 hover:bg-gray-50 text-xs font-bold text-gray-600 rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-slate-900 hover:bg-slate-850 active:scale-[0.98] text-xs font-bold text-white rounded-xl transition-all shadow-md shadow-slate-900/10"
                >
                  Confirmar Ajuste
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
