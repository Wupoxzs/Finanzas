import { useState, useMemo, FormEvent } from 'react';
import { SavingsBank } from '../types';
import { ArrowLeftRight, TrendingUp, Landmark, ShieldCheck, HelpCircle, Plus, Edit2, Trash2 } from 'lucide-react';

interface SavingsSpacesProps {
  banks: SavingsBank[];
  mainBalance: number;
  onTransfer: (bankId: string, amount: number, direction: 'deposit' | 'withdraw', isExternal?: boolean) => void;
  onAddBank?: (name: string, yieldRate: number, color: string, logo: string) => void;
  onEditBank?: (id: string, name: string, yieldRate: number) => void;
  onDeleteBank?: (id: string) => void;
}

export default function SavingsSpaces({
  banks,
  mainBalance,
  onTransfer,
  onAddBank,
  onEditBank,
  onDeleteBank
}: SavingsSpacesProps) {
  const [selectedBank, setSelectedBank] = useState<SavingsBank | null>(null);
  const [transferAmount, setTransferAmount] = useState<string>('');
  const [direction, setDirection] = useState<'deposit' | 'withdraw'>('deposit');
  const [depositSource, setDepositSource] = useState<'external' | 'internal'>('external');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [showDecimalTicker, setShowDecimalTicker] = useState<boolean>(true);

  // Add Bank Modal States
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>('');
  const [newYield, setNewYield] = useState<string>('13.0');
  const [newColor, setNewColor] = useState<string>('bg-[#612F74]');
  const [newLogo, setNewLogo] = useState<string>('');
  const [addErrorMsg, setAddErrorMsg] = useState<string>('');

  // Edit Bank Modal States
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [editingBank, setEditingBank] = useState<SavingsBank | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editYield, setEditYield] = useState<string>('');
  const [editErrorMsg, setEditErrorMsg] = useState<string>('');

  const openTransfer = (bank: SavingsBank, dir: 'deposit' | 'withdraw') => {
    setSelectedBank(bank);
    setDirection(dir);
    setTransferAmount('');
    setErrorMsg('');
    setDepositSource('external');
  };

  const handleTransferSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedBank) return;

    const amount = parseFloat(transferAmount);
    if (isNaN(amount) || amount <= 0) {
      setErrorMsg('Por favor ingresa un monto válido.');
      return;
    }

    if (direction === 'deposit') {
      if (depositSource === 'internal' && amount > mainBalance) {
        setErrorMsg(`Saldo insuficiente en Dinero Actual ($${mainBalance.toFixed(2)})`);
        return;
      }
    } else {
      if (amount > selectedBank.balance) {
        setErrorMsg(`Saldo insuficiente en ${selectedBank.name} ($${selectedBank.balance.toFixed(2)})`);
        return;
      }
    }

    onTransfer(selectedBank.id, amount, direction, direction === 'deposit' ? (depositSource === 'external') : false);
    setSelectedBank(null);
  };

  const handleAddSubmit = (e: FormEvent) => {
    e.preventDefault();
    setAddErrorMsg('');
    if (!onAddBank || !newName.trim()) return;

    const rate = parseFloat(newYield);
    if (isNaN(rate) || rate < 0) {
      setAddErrorMsg('Por favor ingresa un rendimiento válido (0 o mayor).');
      return;
    }

    const finalLogo = newLogo.trim() || newName.trim().slice(0, 2);
    onAddBank(newName.trim(), rate, newColor, finalLogo);
    
    // Reset states
    setShowAddModal(false);
    setNewName('');
    setNewYield('13.0');
    setNewColor('bg-[#612F74]');
    setNewLogo('');
  };

  const handleEditSubmit = (e: FormEvent) => {
    e.preventDefault();
    setEditErrorMsg('');
    if (!onEditBank || !editingBank || !editName.trim()) return;

    const rate = parseFloat(editYield);
    if (isNaN(rate) || rate < 0) {
      setEditErrorMsg('Por favor ingresa un rendimiento válido (0 o mayor).');
      return;
    }

    onEditBank(editingBank.id, editName.trim(), rate);
    setShowEditModal(false);
    setEditingBank(null);
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
          <h2 className="text-xl font-bold tracking-tight text-gray-900">Ahorros con Rendimiento Personalizable</h2>
          <p className="text-xs text-gray-500 mt-1">
            Dinero invertido creciendo segundo a segundo. Configura tus tasas manuales y bancos favoritos.
          </p>
        </div>
        
        {/* Actions row */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {onAddBank && (
            <button
              id="btn-trigger-add-bank"
              onClick={() => setShowAddModal(true)}
              className="text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 border border-slate-900 px-3 py-1.5 rounded-full transition-all flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Nuevo Espacio
            </button>
          )}

          <button
            id="toggle-ticker-precision"
            onClick={() => setShowDecimalTicker(!showDecimalTicker)}
            className="text-xs font-medium text-gray-500 bg-gray-50 hover:bg-gray-100 border border-gray-100 px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5"
          >
            <span className={`w-2 h-2 rounded-full ${showDecimalTicker ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
            {showDecimalTicker ? 'Ocultar decimales' : 'Ver decimales'}
          </button>
        </div>
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
            className="group relative overflow-hidden rounded-[32px] border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between min-h-[230px]"
          >
            {/* Soft decorative background tint matching the bank */}
            <div className={`absolute top-0 right-0 w-32 h-32 rounded-full filter blur-2xl opacity-5 pointer-events-none -mr-8 -mt-8 ${b.color}`} />

            {/* Top row */}
            <div className="flex items-start justify-between relative z-10">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl ${b.color} flex items-center justify-center text-white font-extrabold tracking-wider text-xs shadow-xs shrink-0`}>
                  {b.logoName}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 tracking-tight text-sm leading-tight">{b.name}</h3>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full mt-1 border border-emerald-100/30">
                    {b.annualYield}% Anual
                  </span>
                </div>
              </div>

              {/* Edit/Delete actions */}
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setEditingBank(b);
                    setEditName(b.name);
                    setEditYield(b.annualYield.toString());
                    setShowEditModal(true);
                  }}
                  title="Editar Cuenta"
                  className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                {onDeleteBank && (
                  <button
                    type="button"
                    onClick={() => onDeleteBank(b.id)}
                    title="Eliminar Cuenta (Transfiere saldo a disponible)"
                    className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Middle row: Balance with real-time interest */}
            <div className="my-5 relative z-10">
              <span className="text-[10px] font-medium text-gray-400 block uppercase tracking-wider">Saldo en cuenta</span>
              <span className="text-2xl font-extrabold tracking-tight text-gray-900 block mt-1">
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
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-50 relative z-10">
              <button
                id={`btn-deposit-${b.id}`}
                onClick={() => openTransfer(b, 'deposit')}
                className="py-2 px-3 text-xs font-bold text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all flex items-center justify-center gap-1.5 border border-gray-100/50 cursor-pointer"
              >
                Depositar
              </button>
              <button
                id={`btn-withdraw-${b.id}`}
                onClick={() => openTransfer(b, 'withdraw')}
                className="py-2 px-3 text-xs font-bold text-black bg-white hover:bg-gray-50 rounded-xl transition-all flex items-center justify-center gap-1.5 border border-gray-200 cursor-pointer"
              >
                Retirar
              </button>
            </div>
          </div>
        ))}

        {/* Create Space Placeholder / Trigger */}
        {banks.length === 0 ? (
          <div className="col-span-full bg-white border border-dashed border-gray-200 rounded-[32px] p-12 text-center flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-slate-50 border border-gray-100 flex items-center justify-center">
              <Landmark className="w-6 h-6 text-gray-400" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900">No tienes espacios de ahorro creados</h4>
              <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">Crea tus propias cuentas para recibir rendimientos anuales personalizados segundo a segundo.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-xs font-bold text-white rounded-full transition-all"
            >
              + Crear Primer Espacio de Ahorro
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="rounded-[32px] border border-dashed border-gray-200 bg-gray-50/10 hover:bg-gray-50/50 p-6 transition-all flex flex-col items-center justify-center text-center gap-2 min-h-[230px] cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
              <Plus className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-gray-900">Crear Espacio</span>
            <span className="text-[10px] text-gray-400 max-w-[155px]">Establece tu propio rendimiento manual</span>
          </button>
        )}
      </div>

      {/* Transfer Modal overlay */}
      {selectedBank && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-gray-100 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold tracking-tight text-gray-900 flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-gray-500" />
                {direction === 'deposit' ? 'Depositar a Ahorro' : 'Retirar de Ahorro'}
              </h3>
              <button
                onClick={() => setSelectedBank(null)}
                className="w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-500 flex items-center justify-center transition-all"
              >
                ✕
              </button>
            </div>

            {/* Context Details */}
            <div className="bg-gray-50 p-4 rounded-2xl mb-4 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Espacio de Destino/Origen:</span>
                <span className="font-semibold text-gray-900">{selectedBank.name} ({selectedBank.annualYield}% Yield)</span>
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
              {direction === 'deposit' && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Origen del dinero
                  </label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-gray-50 rounded-2xl border border-gray-100">
                    <button
                      type="button"
                      onClick={() => {
                        setDepositSource('external');
                        setErrorMsg('');
                      }}
                      className={`py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                        depositSource === 'external'
                          ? 'bg-white text-emerald-700 shadow-xs border border-emerald-50/50'
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      Dinero Externo
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDepositSource('internal');
                        setErrorMsg('');
                      }}
                      className={`py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                        depositSource === 'internal'
                          ? 'bg-white text-gray-900 shadow-xs border border-gray-100'
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      Dinero Guardado
                    </button>
                  </div>

                  {depositSource === 'external' ? (
                    <div className="text-[11px] font-semibold text-amber-600 bg-amber-50/70 border border-amber-100 p-3 rounded-2xl leading-relaxed">
                      ⚠️ Aviso: Estás agregando dinero no contabilizado en tus finanzas principales. Este monto se sumará al ahorro pero no se descontará de tu "Dinero Actual".
                    </div>
                  ) : (
                    <div className="text-[11px] font-medium text-gray-500 bg-slate-50/50 border border-gray-100 p-2.5 rounded-2xl leading-relaxed">
                      Este depósito se descontará de tu saldo disponible actual (<strong>${mainBalance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong>).
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Monto a {direction === 'deposit' ? 'Depositar' : 'Retirar'} ($)
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

      {/* Modal: Agregar Cuenta de Ahorro */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[32px] max-w-md w-full p-6 sm:p-8 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Nuevo Espacio de Ahorro</h3>
                <p className="text-xs text-gray-400 mt-1">Crea una cuenta con rendimiento personalizado.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-900 flex items-center justify-center transition-all"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Nombre de la Institución
                </label>
                <input
                  type="text"
                  placeholder="Ej. Nu México, Cetes Directo, Finsus"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 text-sm font-semibold text-gray-900 focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Rendimiento Anual (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="13.0"
                    value={newYield}
                    onChange={(e) => setNewYield(e.target.value)}
                    required
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 text-sm font-mono font-bold text-emerald-700 focus:bg-white focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Siglas/Logotipo (2 letras)
                  </label>
                  <input
                    type="text"
                    maxLength={2}
                    placeholder="Ej. NU, CE, MP"
                    value={newLogo}
                    onChange={(e) => setNewLogo(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 text-sm font-bold text-gray-800 placeholder-gray-300 focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Color Selection */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Tema Visual (Color)
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {[
                    { val: 'bg-[#612F74]', name: 'Nu' },
                    { val: 'bg-[#009EE3]', name: 'MP' },
                    { val: 'bg-[#003824]', name: 'Klar' },
                    { val: 'bg-slate-900', name: 'Apple' },
                    { val: 'bg-amber-600', name: 'Cetes' },
                    { val: 'bg-indigo-700', name: 'Finsus' },
                  ].map((colorObj) => (
                    <button
                      key={colorObj.val}
                      type="button"
                      onClick={() => setNewColor(colorObj.val)}
                      className={`w-10 h-10 rounded-xl border transition-all ${colorObj.val} ${
                        newColor === colorObj.val
                          ? 'ring-2 ring-offset-2 ring-black border-transparent'
                          : 'border-transparent hover:scale-105'
                      }`}
                      title={colorObj.name}
                    />
                  ))}
                </div>
              </div>

              {addErrorMsg && (
                <p className="text-xs font-semibold text-rose-500 mt-2 bg-rose-50 border border-rose-100 p-2.5 rounded-xl">
                  {addErrorMsg}
                </p>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setAddErrorMsg('');
                  }}
                  className="flex-1 py-3 text-xs font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-100 rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 text-xs font-bold text-white bg-slate-900 hover:bg-slate-850 rounded-xl transition-all shadow-md shadow-slate-900/10"
                >
                  Crear Cuenta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Editar Cuenta de Ahorro */}
      {showEditModal && editingBank && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[32px] max-w-md w-full p-6 sm:p-8 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Editar Cuenta</h3>
                <p className="text-xs text-gray-400 mt-1">Modifica los parámetros de rendimiento.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingBank(null);
                }}
                className="w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-900 flex items-center justify-center transition-all"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Nombre de la Institución
                </label>
                <input
                  type="text"
                  placeholder="Ej. Nu México"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 text-sm font-semibold text-gray-900 focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Rendimiento Anual (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="13.0"
                  value={editYield}
                  onChange={(e) => setEditYield(e.target.value)}
                  required
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 text-sm font-mono font-bold text-emerald-700 focus:bg-white focus:outline-hidden"
                />
              </div>

              {editErrorMsg && (
                <p className="text-xs font-semibold text-rose-500 mt-2 bg-rose-50 border border-rose-100 p-2.5 rounded-xl">
                  {editErrorMsg}
                </p>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingBank(null);
                    setEditErrorMsg('');
                  }}
                  className="flex-1 py-3 text-xs font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-100 rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 text-xs font-bold text-white bg-slate-900 hover:bg-slate-850 rounded-xl transition-all"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
