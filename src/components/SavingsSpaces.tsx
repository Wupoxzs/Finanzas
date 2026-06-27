import { useState, useMemo, FormEvent } from 'react';
import { SavingsBank } from '../types';
import { ArrowLeftRight, TrendingUp, Landmark, ShieldCheck, HelpCircle } from 'lucide-react';

interface SavingsSpacesProps {
  banks: SavingsBank[];
  mainBalance: number;
  onTransfer: (bankId: string, amount: number, direction: 'deposit' | 'withdraw') => void;
}

export default function SavingsSpaces({ banks, mainBalance, onTransfer }: SavingsSpacesProps) {
  const [selectedBank, setSelectedBank] = useState<SavingsBank | null>(null);
  const [transferAmount, setTransferAmount] = useState<string>('');
  const [direction, setDirection] = useState<'deposit' | 'withdraw'>('deposit');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [showDecimalTicker, setShowDecimalTicker] = useState<boolean>(true);

  const openTransfer = (bank: SavingsBank, dir: 'deposit' | 'withdraw') => {
    setSelectedBank(bank);
    setDirection(dir);
    setTransferAmount('');
    setErrorMsg('');
  };

  const handleTransferSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedBank) return;

    const amount = parseFloat(transferAmount);
    if (isNaN(amount) || amount <= 0) {
      setErrorMsg('Por favor ingresa un monto válido.');
      return;
    }

    if (direction === 'deposit' && amount > mainBalance) {
      setErrorMsg(`Saldo insuficiente en Dinero Actual ($${mainBalance.toFixed(2)})`);
      return;
    }

    if (direction === 'withdraw' && amount > selectedBank.balance) {
      setErrorMsg(`Saldo insuficiente en ${selectedBank.name} ($${selectedBank.balance.toFixed(2)})`);
      return;
    }

    onTransfer(selectedBank.id, amount, direction);
    setSelectedBank(null);
  };

  const totalSavings = useMemo(() => {
    return banks.reduce((sum, b) => sum + b.balance, 0);
  }, [banks]);

  const totalAccrued = useMemo(() => {
    return banks.reduce((sum, b) => sum + b.accruedInterest, 0);
  }, [banks]);

  return (
    <div id="savings-spaces-component" className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-gray-900">Ahorros con Rendimiento (13% anual)</h2>
          <p className="text-xs text-gray-500 mt-1">
            Dinero invertido creciendo segundo a segundo. Protegido y disponible 24/7.
          </p>
        </div>
        
        {/* Visual Ticker control */}
        <button
          id="toggle-ticker-precision"
          onClick={() => setShowDecimalTicker(!showDecimalTicker)}
          className="text-xs font-medium text-gray-500 bg-gray-50 hover:bg-gray-100 border border-gray-100 px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 self-start"
        >
          <span className={`w-2 h-2 rounded-full ${showDecimalTicker ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
          {showDecimalTicker ? 'Ocultar micro-centavos' : 'Mostrar micro-centavos'}
        </button>
      </div>

      {/* Aggregate Savings Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-50/75 border border-gray-100 rounded-[32px] p-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest block">Total Ahorrado</span>
            <span className="text-2xl font-bold tracking-tight text-gray-900 mt-1 block">
              ${totalSavings.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center">
            <Landmark className="w-5 h-5 text-gray-700" />
          </div>
        </div>

        <div className="bg-emerald-50/30 border border-emerald-100/50 rounded-[32px] p-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-widest block flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> Interés Ganado (Total)
            </span>
            <span className="text-2xl font-bold font-mono tracking-tight text-emerald-700 mt-1 block">
              ${totalAccrued.toLocaleString('es-MX', { 
                minimumFractionDigits: showDecimalTicker ? 6 : 2, 
                maximumFractionDigits: showDecimalTicker ? 6 : 2 
              })}
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-100/40 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
          </div>
        </div>
      </div>

      {/* Interactive Bank Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {banks.map((b) => (
          <div
            key={b.id}
            id={`bank-card-${b.id}`}
            className="group relative overflow-hidden rounded-[32px] border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between min-h-[220px]"
          >
            {/* Soft decorative background tint matching the bank */}
            <div className={`absolute top-0 right-0 w-32 h-32 rounded-full filter blur-2xl opacity-5 pointer-events-none -mr-8 -mt-8 ${b.color}`} />

            {/* Top row */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl ${b.color} flex items-center justify-center text-white font-bold tracking-wider text-xs shadow-xs`}>
                  {b.logoName}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 tracking-tight text-sm">{b.name}</h3>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mt-0.5">
                    {b.annualYield}% Anual
                  </span>
                </div>
              </div>
            </div>

            {/* Middle row: Balance with real-time interest */}
            <div className="my-5">
              <span className="text-[10px] font-medium text-gray-400 block uppercase tracking-wider">Saldo en cuenta</span>
              <span className="text-2xl font-bold tracking-tight text-gray-900 block mt-1">
                ${b.balance.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>

              {/* Accrued interest details */}
              <div className="mt-3 flex items-center justify-between bg-gray-50 p-2 rounded-xl border border-gray-100">
                <span className="text-[10px] font-medium text-gray-400">Interés acumulado:</span>
                <span className="text-xs font-mono font-bold text-emerald-600">
                  +${b.accruedInterest.toLocaleString('es-MX', { 
                    minimumFractionDigits: showDecimalTicker ? 5 : 2, 
                    maximumFractionDigits: showDecimalTicker ? 5 : 2 
                  })}
                </span>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-50">
              <button
                id={`btn-deposit-${b.id}`}
                onClick={() => openTransfer(b, 'deposit')}
                className="py-2 px-3 text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all flex items-center justify-center gap-1.5 border border-gray-100/50"
              >
                Depositar
              </button>
              <button
                id={`btn-withdraw-${b.id}`}
                onClick={() => openTransfer(b, 'withdraw')}
                className="py-2 px-3 text-xs font-semibold text-black bg-white hover:bg-gray-50 rounded-xl transition-all flex items-center justify-center gap-1.5 border border-gray-200"
              >
                Retirar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Transfer Modal overlay */}
      {selectedBank && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-gray-100 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold tracking-tight text-gray-900 flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-gray-500" />
                {direction === 'deposit' ? 'Depositar a Ahorro' : 'Retirar de Ahorro'}
              </h3>
              <button
                onClick={() => setSelectedBank(null)}
                className="w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-500 flex items-center justify-center transition-all"
              >
                ×
              </button>
            </div>

            {/* Context Details */}
            <div className="bg-gray-50 p-4 rounded-2xl mb-4 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Espacio de Destino/Origen:</span>
                <span className="font-semibold text-gray-900">{selectedBank.name} (13% Yield)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Dinero Actual (Disponible):</span>
                <span className="font-semibold text-gray-900">${mainBalance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Ahorro en {selectedBank.logoName}:</span>
                <span className="font-semibold text-gray-900">${selectedBank.balance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <form onSubmit={handleTransferSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Monto a Transferir ($)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    required
                    autoFocus
                    className="w-full bg-gray-50 border border-gray-200 focus:border-black focus:ring-1 focus:ring-black rounded-2xl py-3 pl-8 pr-4 text-lg font-bold tracking-tight focus:outline-hidden"
                  />
                </div>
                {errorMsg && (
                  <p className="text-xs font-medium text-red-500 mt-2">
                    {errorMsg}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedBank(null)}
                  className="flex-1 py-3 text-xs font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-all border border-gray-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`flex-1 py-3 text-xs font-semibold text-white rounded-2xl transition-all shadow-xs ${
                    direction === 'deposit' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-black hover:bg-gray-900'
                  }`}
                >
                  Confirmar {direction === 'deposit' ? 'Depósito' : 'Retiro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
