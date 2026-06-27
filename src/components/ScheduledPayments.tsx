import { useState, FormEvent } from 'react';
import { ScheduledPayment } from '../types';
import { CATEGORIES } from '../data/initialData';
import { CalendarClock, Check, Plus, AlertCircle, Trash2, X } from 'lucide-react';

interface ScheduledPaymentsProps {
  payments: ScheduledPayment[];
  onPayBill: (id: string) => void;
  onAddPayment: (payment: Omit<ScheduledPayment, 'id' | 'isPaid'>) => void;
  onRemovePayment: (id: string) => void;
}

export default function ScheduledPayments({ payments, onPayBill, onAddPayment, onRemovePayment }: ScheduledPaymentsProps) {
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  
  // New Payment State
  const [title, setTitle] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [category, setCategory] = useState<string>(CATEGORIES.expense[0]);
  const [recurring, setRecurring] = useState<'monthly' | 'once'>('monthly');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0 || !title.trim() || !dueDate) return;

    onAddPayment({
      title: title.trim(),
      amount: numAmount,
      dueDate,
      category,
      recurring
    });

    // Reset Form
    setTitle('');
    setAmount('');
    setDueDate('');
    setShowAddModal(false);
  };

  // Sort upcoming payments by due date
  const sortedPayments = [...payments].sort((a, b) => {
    if (a.isPaid && !b.isPaid) return 1;
    if (!a.isPaid && b.isPaid) return -1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  // Calculate some handy metrics
  const pendingAmount = payments
    .filter(p => !p.isPaid)
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div id="scheduled-payments-container" className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm space-y-6">
      {/* Header and Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold tracking-tight text-gray-900">Pagos Programados</h3>
          <p className="text-xs text-gray-500">Facturas y suscripciones con fechas límites.</p>
        </div>

        <button
          id="btn-schedule-payment"
          onClick={() => setShowAddModal(true)}
          className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold px-4 py-2.5 rounded-full flex items-center gap-1.5 transition-all duration-200"
        >
          <Plus className="w-4 h-4" /> Programar
        </button>
      </div>

      {/* Pending Summary Banner */}
      {pendingAmount > 0 ? (
        <div className="bg-amber-50/50 border border-amber-100/50 rounded-2xl p-4 flex items-center gap-3">
          <CalendarClock className="w-5 h-5 text-amber-600 shrink-0" />
          <div className="text-xs">
            <span className="font-semibold text-amber-800 block">Compromisos de Pago Pendientes</span>
            <span className="text-gray-500 mt-0.5 block">
              Tienes un total de <strong className="text-amber-800">${pendingAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong> por pagar próximamente.
            </span>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50/30 border border-emerald-100/50 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <p className="text-xs font-semibold text-emerald-800">¡Todo al día! No tienes pagos programados pendientes.</p>
        </div>
      )}

      {/* List */}
      <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
        {sortedPayments.length === 0 ? (
          <div className="text-center py-12 bg-gray-50/50 rounded-2xl border border-dashed border-gray-100">
            <span className="text-xs text-gray-400">No hay pagos programados configurados.</span>
          </div>
        ) : (
          sortedPayments.map((p) => {
            const isOverdue = !p.isPaid && new Date(p.dueDate).getTime() < new Date().setHours(0,0,0,0);
            return (
              <div
                key={p.id}
                id={`scheduled-item-${p.id}`}
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                  p.isPaid
                    ? 'bg-gray-50/40 border-gray-100/60 opacity-60'
                    : isOverdue
                    ? 'bg-rose-50/30 border-rose-100/80'
                    : 'bg-white border-gray-100 hover:border-gray-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Status Circle */}
                  <button
                    id={`btn-toggle-paid-${p.id}`}
                    onClick={() => !p.isPaid && onPayBill(p.id)}
                    disabled={p.isPaid}
                    className={`w-5 h-5 rounded-full border flex items-center justify-center mt-0.5 shrink-0 transition-all ${
                      p.isPaid
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : isOverdue
                        ? 'border-rose-400 hover:bg-rose-50'
                        : 'border-gray-300 hover:border-black'
                    }`}
                  >
                    {p.isPaid && <Check className="w-3.5 h-3.5" />}
                  </button>

                  <div>
                    <h4 className={`text-sm font-semibold tracking-tight ${p.isPaid ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                      {p.title}
                    </h4>
                    
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-[9px] font-semibold text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded-md border border-gray-100">
                        {p.category}
                      </span>
                      <span className="text-[9px] text-gray-400 font-medium">
                        {p.recurring === 'monthly' ? 'Mensual' : 'Pago Único'}
                      </span>
                      <span className={`text-[9px] font-mono font-semibold flex items-center gap-0.5 ${
                        p.isPaid
                          ? 'text-gray-400'
                          : isOverdue
                          ? 'text-rose-500'
                          : 'text-gray-500'
                      }`}>
                        Vence: {p.dueDate} {isOverdue && '(Vencido)'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className={`text-sm font-bold tracking-tight block ${p.isPaid ? 'text-gray-400' : 'text-gray-950'}`}>
                      ${p.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* Remove Payment Icon */}
                  <button
                    id={`btn-remove-scheduled-${p.id}`}
                    onClick={() => onRemovePayment(p.id)}
                    className="p-1 text-gray-300 hover:text-red-500 rounded-lg hover:bg-gray-50 transition-all shrink-0"
                    title="Eliminar de la agenda"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Scheduled Payment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-gray-100 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold tracking-tight text-gray-900">Programar Nuevo Pago</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-500 flex items-center justify-center transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Concepto / Servicio
                </label>
                <input
                  type="text"
                  placeholder="Ej. Renta de departamento, Seguro médico..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  autoFocus
                  className="w-full bg-gray-50 border border-gray-200 focus:border-black focus:ring-1 focus:ring-black rounded-2xl py-2.5 px-4 text-sm focus:outline-hidden font-medium"
                />
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Monto Estimado ($)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    className="w-full bg-gray-50 border border-gray-200 focus:border-black focus:ring-1 focus:ring-black rounded-2xl py-2.5 pl-8 pr-4 text-sm font-bold focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Due Date & Periodicity */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Fecha de Vencimiento
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                    className="w-full bg-gray-50 border border-gray-200 focus:border-black focus:ring-1 focus:ring-black rounded-2xl py-2 px-3 text-xs focus:outline-hidden font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Periodicidad
                  </label>
                  <select
                    value={recurring}
                    onChange={(e) => setRecurring(e.target.value as any)}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-black focus:ring-1 focus:ring-black rounded-2xl py-2 px-3 text-xs focus:outline-hidden font-medium"
                  >
                    <option value="monthly">Mensual</option>
                    <option value="once">Pago Único</option>
                  </select>
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Categoría</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 focus:border-black focus:ring-1 focus:ring-black rounded-2xl py-2.5 px-4 text-sm focus:outline-hidden font-medium"
                >
                  {CATEGORIES.expense.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Connected Note */}
              <p className="text-[10px] text-gray-400 leading-relaxed bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                💡 <span className="font-semibold">Control de agenda:</span> Al llegar la fecha o dar clic en el checkbox, se descontará de tu saldo actual y quedará registrado como gasto automáticamente.
              </p>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 text-xs font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-all border border-gray-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 text-xs font-semibold text-white bg-black hover:bg-gray-900 rounded-2xl transition-all shadow-xs"
                >
                  Agendar Pago
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
