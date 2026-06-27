import { useState, useMemo } from 'react';
import { Transaction, SavingsBank } from '../types';

interface FinanceChartProps {
  transactions: Transaction[];
  banks: SavingsBank[];
  mainBalance: number;
}

export default function FinanceChart({ transactions, banks, mainBalance }: FinanceChartProps) {
  const [activeTab, setActiveTab] = useState<'networth' | 'distribution'>('networth');

  // Total balance calculation
  const totalSavings = useMemo(() => banks.reduce((sum, b) => sum + b.balance, 0), [banks]);
  const netWorth = mainBalance + totalSavings;

  // Let's construct a beautiful 7-day historical trend
  // We can calculate this by rewinding the transactions backward from today
  const historicalData = useMemo(() => {
    const days = 7;
    const points = [];
    const now = new Date();
    
    let currentNW = netWorth;
    let currentMain = mainBalance;
    let currentSavings = totalSavings;

    // Create daily points from today backwards
    for (let i = 0; i < days; i++) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      const dateStr = date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });

      // If we are on day 0, it's our current net worth
      if (i === 0) {
        points.unshift({
          dateStr,
          total: currentNW,
          savings: currentSavings,
          available: currentMain
        });
        continue;
      }

      // Filter transactions that occurred after/on the start of this rewound day (relative to previous day)
      const prevDayStart = new Date(now);
      prevDayStart.setDate(now.getDate() - i + 1);
      
      const dayTransactions = transactions.filter(t => {
        const tDate = new Date(t.date);
        const dayAfterDate = new Date(date);
        dayAfterDate.setDate(dayAfterDate.getDate() + 1);
        return tDate >= date && tDate < dayAfterDate;
      });

      // Rewind transactions of this day
      for (const t of dayTransactions) {
        if (t.type === 'income') {
          currentMain -= t.amount;
        } else {
          currentMain += t.amount;
        }
      }

      currentNW = currentMain + currentSavings;

      points.unshift({
        dateStr,
        total: Math.max(0, currentNW),
        savings: Math.max(0, currentSavings),
        available: Math.max(0, currentMain)
      });
    }

    return points;
  }, [transactions, banks, mainBalance, netWorth, totalSavings]);

  // Compute SVG Path coordinates for the Net Worth Line
  const svgCoords = useMemo(() => {
    const width = 500;
    const height = 160;
    const padding = 20;

    if (historicalData.length === 0) return { linePath: '', areaPath: '', points: [] };

    const totals = historicalData.map(d => d.total);
    const minVal = Math.min(...totals) * 0.95; // 5% breathing room below
    const maxVal = Math.max(...totals) * 1.05; // 5% breathing room above
    const valRange = maxVal - minVal || 1;

    const points = historicalData.map((d, index) => {
      const x = padding + (index / (historicalData.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((d.total - minVal) / valRange) * (height - 2 * padding);
      return { x, y, data: d };
    });

    // Build cubic bezier curve path
    let linePath = '';
    if (points.length > 0) {
      linePath = `M ${points[0].x} ${points[0].y}`;
      for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i];
        const p1 = points[i + 1];
        const cpX1 = p0.x + (p1.x - p0.x) / 3;
        const cpY1 = p0.y;
        const cpX2 = p0.x + 2 * (p1.x - p0.x) / 3;
        const cpY2 = p1.y;
        linePath += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
      }
    }

    const areaPath = points.length > 0
      ? `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`
      : '';

    return { linePath, areaPath, points };
  }, [historicalData]);

  // Distribution calculations
  const distributionData = useMemo(() => {
    const total = netWorth || 1;
    const parts = [
      { name: 'Dinero Actual', amount: mainBalance, color: '#1d1d1f', pct: (mainBalance / total) * 100 },
      ...banks.map(b => {
        let hexColor = '#612F74'; // Nu
        if (b.id === 'mercadopago') hexColor = '#009EE3';
        if (b.id === 'klar') hexColor = '#003824';
        return {
          name: b.name,
          amount: b.balance,
          color: hexColor,
          pct: (b.balance / total) * 100
        };
      })
    ];
    return parts.sort((a, b) => b.amount - a.amount);
  }, [banks, mainBalance, netWorth]);

  return (
    <div id="finance-chart-container" className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm transition-all duration-300">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Análisis Patrimonial</h3>
          <p className="text-xl font-semibold tracking-tight text-gray-900 mt-1">
            ${netWorth.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex bg-gray-100/80 p-0.5 rounded-full text-xs">
          <button
            id="chart-tab-networth"
            onClick={() => setActiveTab('networth')}
            className={`px-3.5 py-1.5 rounded-full font-medium transition-all duration-200 ${
              activeTab === 'networth'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Tendencia 7D
          </button>
          <button
            id="chart-tab-distribution"
            onClick={() => setActiveTab('distribution')}
            className={`px-3.5 py-1.5 rounded-full font-medium transition-all duration-200 ${
              activeTab === 'distribution'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Distribución
          </button>
        </div>
      </div>

      {activeTab === 'networth' ? (
        <div className="relative">
          {/* SVG Line Chart */}
          <div className="w-full overflow-hidden">
            <svg
              viewBox="0 0 500 160"
              className="w-full h-auto overflow-visible"
              style={{ maxHeight: '160px' }}
            >
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#000000" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="#000000" stopOpacity="0.00" />
                </linearGradient>
                <linearGradient id="lineColor" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#9e9e9e" />
                  <stop offset="50%" stopColor="#2c2c2e" />
                  <stop offset="100%" stopColor="#000000" />
                </linearGradient>
              </defs>

              {/* Gridlines */}
              <line x1="20" y1="20" x2="480" y2="20" stroke="#f4f4f5" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="20" y1="80" x2="480" y2="80" stroke="#f4f4f5" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="20" y1="140" x2="480" y2="140" stroke="#e4e4e7" strokeWidth="1" />

              {/* Gradient Area under the curve */}
              {svgCoords.areaPath && (
                <path d={svgCoords.areaPath} fill="url(#chartGradient)" />
              )}

              {/* Curve Line */}
              {svgCoords.linePath && (
                <path
                  d={svgCoords.linePath}
                  fill="none"
                  stroke="url(#lineColor)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Data points */}
              {svgCoords.points.map((p, idx) => {
                const isLast = idx === svgCoords.points.length - 1;
                return (
                  <g key={idx} className="group cursor-pointer">
                    {/* Glowing outer circle on hover or for last element */}
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={isLast ? "6" : "4"}
                      className={`transition-all duration-200 fill-white stroke-2 ${
                        isLast ? 'stroke-black shadow-lg scale-110' : 'stroke-gray-300 group-hover:stroke-black group-hover:r-5'
                      }`}
                    />
                    {isLast && (
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r="2"
                        className="fill-black"
                      />
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* X Axis Labels */}
          <div className="flex justify-between items-center px-4 mt-2">
            {historicalData.map((d, idx) => (
              <span key={idx} className="text-[10px] font-mono text-gray-400 font-medium">
                {d.dateStr}
              </span>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-center gap-6 text-[11px] text-gray-500 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-black"></span>
              Patrimonio Total
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-gray-400"></span>
              Tendencia de Ahorro
            </span>
          </div>
        </div>
      ) : (
        <div className="space-y-4 pt-2">
          {/* Horizontal multi-segment bar */}
          <div className="h-4 w-full bg-gray-100 rounded-full flex overflow-hidden">
            {distributionData.map((d, idx) => (
              d.pct > 0 ? (
                <div
                  key={idx}
                  style={{
                    width: `${d.pct}%`,
                    backgroundColor: d.color
                  }}
                  title={`${d.name}: ${d.pct.toFixed(1)}%`}
                  className="h-full transition-all duration-500 hover:opacity-90 cursor-help"
                />
              ) : null
            ))}
          </div>

          {/* List distribution parts with amounts */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            {distributionData.map((d, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-gray-50/50 border border-gray-100">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full block shrink-0"
                    style={{ backgroundColor: d.color }}
                  />
                  <span className="text-xs font-medium text-gray-600 truncate max-w-[100px] sm:max-w-none">
                    {d.name}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold text-gray-900 block">
                    ${d.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[10px] font-mono text-gray-400 block font-medium">
                    {d.pct.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
