import { useState, useMemo, FormEvent } from 'react';
import { Transaction } from '../types';
import { CATEGORIES } from '../data/initialData';
import { Plus, ArrowDownLeft, ArrowUpRight, Filter, ShoppingBag, DollarSign, Calendar, X } from 'lucide-react';

interface TransactionsSectionProps {
  transactions: Transaction[];
  onAddTransaction: (transaction: Omit<Transaction, 'id' | 'date'>) => void;
}

export default function TransactionsSection({ transactions, onAddTransaction }: TransactionsSectionProps) {
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // Form State
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<string>(CATEGORIES.expense[0]);
  const [amount, setAmount] = useState<string>('');

  const handleTypeChange = (newType: 'income' | 'expense') => {
    setType(newType);
    setCategory(newType === 'income' ? CATEGORIES.income[0] : CATEGORIES.expense[0]);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    onAddTransaction({
      type,
      amount: numAmount,
      category,
      description: description.trim() || (type === 'income' ? 'Ingreso General' : 'Gasto General')
    });

    // Reset Form
    setDescription('');
    setAmount('');
    setShowAddModal(false);
  };

  const filteredTransactions = useMemo(() => {
    // Sort by date descending
    const sorted = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (filterType === 'all') return sorted;
    return sorted.filter(t => t.type === filterType);
  }, [transactions, filterType]);

  return (
    <div id="transactions-section-container" className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm space-y-6">
      {/* Header and Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold tracking-tight text-gray-900">Transacciones Recientes</h3>
          <p className="text-xs text-gray-500">Historial conectado a tu Dinero Actual.</p>
        </div>

        <button
          id="btn-add-transaction"
          onClick={() => {
            handleTypeChange('expense');
            setShowAddModal(true);
          }}
          className="bg-black hover:bg-gray-900 text-white text-xs font-semibold px-4 py-2.5 rounded-full flex items-center gap-1.5 shadow-sm transition-all duration-200"
        >
          <Plus className="w-4 h-4" /> Registrar
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div className="flex bg-gray-100/70 p-0.5 rounded-full text-xs">
          <button
            id="filter-all"
            onClick={() => setFilterType('all')}
            className={`px-3.5 py-1.5 rounded-full font-medium transition-all ${
              filterType === 'all' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Todos
          </button>
          <button
            id="filter-income"
            onClick={() => setFilterType('income')}
            className={`px-3.5 py-1.5 rounded-full font-medium transition-all ${
              filterType === 'income' ? 'bg-white text-emerald-600 shadow-xs' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Ingresos
          </button>
          <button
            id="filter-expense"
            onClick={() => setFilterType('expense')}
            className={`px-3.5 py-1.5 rounded-full font-medium transition-all ${
              filterType === 'expense' ? 'bg-white text-red-600 shadow-xs' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Gastos
          </button>
        </div>

        <div className="text-[10px] font-mono text-gray-400 font-medium">
          {filteredTransactions.length} registros
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12 bg-gray-50/50 rounded-2xl border border-dashed border-gray-100">
            <span className="text-xs text-gray-400">No hay transacciones registradas en este apartado.</span>
          </div>
        ) : (
          filteredTransactions.map((t) => {
            const isIncome = t.type === 'income';
            return (
              <div
                key={t.id}
                id={`transaction-item-${t.id}`}
                className="flex items-center justify-between p-3.5 hover:bg-gray-50/80 rounded-2xl transition-all border border-gray-50/30 group"
              >
                <div className="flex items-center gap-3">
                  {/* Icon Indicator */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    isIncome ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50/70 text-red-500'
                  }`}>
                    {isIncome ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 tracking-tight">{t.description}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-md">
                        {t.category}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono">
                        {new Date(t.date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`text-sm font-bold tracking-tight block ${
                    isIncome ? 'text-emerald-600' : 'text-gray-900'
                  }`}>
                    {isIncome ? '+' : '-'}${t.amount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Elegant Add Transaction Dialog Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-gray-100 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold tracking-tight text-gray-900">Registrar Operación</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-500 flex items-center justify-center transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Selector: Ingreso / Gasto */}
            <div className="grid grid-cols-2 bg-gray-100 p-1 rounded-2xl mb-5">
              <button
                type="button"
                onClick={() => handleTypeChange('expense')}
                className={`py-2.5 text-xs font-semibold rounded-xl transition-all ${
                  type === 'expense'
                    ? 'bg-white text-red-600 shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Gasto (Sustraer)
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('income')}
                className={`py-2.5 text-xs font-semibold rounded-xl transition-all ${
                  type === 'income'
                    ? 'bg-white text-emerald-600 shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Ingreso (Sumar)
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Amount */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Monto ($)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-lg">$</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    autoFocus
                    className="w-full bg-gray-50 border border-gray-200 focus:border-black focus:ring-1 focus:ring-black rounded-2xl py-3.5 pl-8 pr-4 text-xl font-bold tracking-tight focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Concepto / Descripción</label>
                <input
                  type="text"
                  placeholder="Ej. Starbucks, Uber, Nómina..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 focus:border-black focus:ring-1 focus:ring-black rounded-2xl py-2.5 px-4 text-sm focus:outline-hidden font-medium"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Categoría</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 focus:border-black focus:ring-1 focus:ring-black rounded-2xl py-2.5 px-4 text-sm focus:outline-hidden font-medium appearance-none"
                >
                  {(type === 'income' ? CATEGORIES.income : CATEGORIES.expense).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Connected Note */}
              <p className="text-[11px] text-gray-400 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100">
                ⚠️ <span className="font-semibold text-gray-500">Nota de conexión:</span> Esta transacción modificará tu{' '}
                <span className="font-semibold text-gray-600">Dinero Actual</span> y la gráfica patrimonial en tiempo real, sin afectar a tus cuentas de ahorro blindadas.
              </p>

              {/* Submit / Cancel Buttons */}
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
                  className={`flex-1 py-3 text-xs font-semibold text-white rounded-2xl transition-all shadow-xs ${
                    type === 'income' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-black hover:bg-gray-900'
                  }`}
                >
                  Registrar {type === 'income' ? 'Ingreso' : 'Gasto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
