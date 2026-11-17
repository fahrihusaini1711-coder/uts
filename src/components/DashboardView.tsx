import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowRight,
  ArrowRightLeft,
  ArrowUpRight,
  BarChart3,
  LineChart as LineChartIcon,
  Plus,
  Wallet,
} from 'lucide-react';
import { Budget, Category, NavSection, Transaction } from '../types';
import { ComputedAccount } from '../hooks/useFinanceStore';
import {
  formatCompactRupiah,
  formatDateID,
  formatMonthShortID,
  formatMonthYearID,
  formatRupiah,
  getCurrentMonthKey,
  getLastNMonthKeys,
  shiftMonthKey,
} from '../utils/format';
import { CategoryIcon } from '../utils/icons';

interface DashboardViewProps {
  totalBalance: number;
  accounts: ComputedAccount[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  onAddTransaction: () => void;
  onNavigate: (section: NavSection) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  totalBalance,
  accounts,
  categories,
  transactions,
  budgets,
  onAddTransaction,
  onNavigate,
}) => {
  const [chartMode, setChartMode] = useState<'bar' | 'line'>('bar');
  const [hoveredMonthIdx, setHoveredMonthIdx] = useState<number | null>(null);
  const [hoveredCatId, setHoveredCatId] = useState<string | null>(null);

  const currentMonth = getCurrentMonthKey();
  const prevMonth = shiftMonthKey(currentMonth, -1);

  const accountMap = useMemo(
    () => new Map(accounts.map((a) => [a.id, a])),
    [accounts]
  );
  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories]
  );

  // Current month & previous month KPIs
  const kpi = useMemo(() => {
    let curIncome = 0;
    let curExpense = 0;
    let prevIncome = 0;
    let prevExpense = 0;

    for (const tx of transactions) {
      const m = tx.date.slice(0, 7);
      if (m === currentMonth) {
        if (tx.type === 'income') curIncome += tx.amount;
        else if (tx.type === 'expense') curExpense += tx.amount;
      } else if (m === prevMonth) {
        if (tx.type === 'income') prevIncome += tx.amount;
        else if (tx.type === 'expense') prevExpense += tx.amount;
      }
    }

    const curNet = curIncome - curExpense;
    const prevNet = prevIncome - prevExpense;

    const incomeDiffPct =
      prevIncome > 0 ? Math.round(((curIncome - prevIncome) / prevIncome) * 100) : null;
    const expenseDiffPct =
      prevExpense > 0 ? Math.round(((curExpense - prevExpense) / prevExpense) * 100) : null;

    return {
      curIncome,
      curExpense,
      curNet,
      prevNet,
      incomeDiffPct,
      expenseDiffPct,
    };
  }, [transactions, currentMonth, prevMonth]);

  // Last 6 months data
  const sixMonthsData = useMemo(() => {
    const keys = getLastNMonthKeys(6, currentMonth);
    return keys.map((key) => {
      let income = 0;
      let expense = 0;
      for (const tx of transactions) {
        if (tx.date.startsWith(key)) {
          if (tx.type === 'income') income += tx.amount;
          else if (tx.type === 'expense') expense += tx.amount;
        }
      }
      return {
        key,
        label: formatMonthShortID(key),
        fullLabel: formatMonthYearID(key),
        income,
        expense,
        net: income - expense,
      };
    });
  }, [transactions, currentMonth]);

  const maxChartVal = useMemo(() => {
    const peak = sixMonthsData.reduce(
      (max, d) => Math.max(max, d.income, d.expense),
      0
    );
    return peak > 0 ? peak * 1.15 : 1_000_000;
  }, [sixMonthsData]);

  // Expense per category (current month)
  const categoryBreakdown = useMemo(() => {
    const totals = new Map<string, number>();
    let grandTotal = 0;

    for (const tx of transactions) {
      if (tx.type === 'expense' && tx.date.startsWith(currentMonth) && tx.categoryId) {
        totals.set(tx.categoryId, (totals.get(tx.categoryId) ?? 0) + tx.amount);
        grandTotal += tx.amount;
      }
    }

    const items = Array.from(totals.entries())
      .map(([catId, total]) => {
        const cat = categoryMap.get(catId);
        return {
          id: catId,
          name: cat?.name ?? 'Kategori Lain',
          color: cat?.color ?? '#64748B',
          icon: cat?.icon ?? 'receipt',
          total,
          percent: grandTotal > 0 ? (total / grandTotal) * 100 : 0,
        };
      })
      .sort((a, b) => b.total - a.total);

    return { items, grandTotal };
  }, [transactions, currentMonth, categoryMap]);

  // Budget alerts for current month (>= 80%)
  const budgetAlerts = useMemo(() => {
    const spentByCat = new Map<string, number>();
    for (const tx of transactions) {
      if (tx.type === 'expense' && tx.date.startsWith(currentMonth) && tx.categoryId) {
        spentByCat.set(tx.categoryId, (spentByCat.get(tx.categoryId) ?? 0) + tx.amount);
      }
    }

    return budgets
      .filter((b) => b.month === currentMonth && b.limit > 0)
      .map((b) => {
        const spent = spentByCat.get(b.categoryId) ?? 0;
        const pct = Math.round((spent / b.limit) * 100);
        const cat = categoryMap.get(b.categoryId);
        return {
          id: b.id,
          categoryName: cat?.name ?? 'Kategori',
          spent,
          limit: b.limit,
          pct,
        };
      })
      .filter((item) => item.pct >= 80)
      .sort((a, b) => b.pct - a.pct);
  }, [budgets, transactions, currentMonth, categoryMap]);

  // 5 latest transactions
  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => {
        if (a.date !== b.date) return b.date.localeCompare(a.date);
        return b.createdAt.localeCompare(a.createdAt);
      })
      .slice(0, 5);
  }, [transactions]);

  // SVG Donut geometry
  const donutSegments = useMemo(() => {
    const radius = 64;
    const circumference = 2 * Math.PI * radius;
    let offset = 0;

    return categoryBreakdown.items.map((item) => {
      const length = (item.percent / 100) * circumference;
      const seg = {
        ...item,
        radius,
        circumference,
        strokeDasharray: `${length} ${circumference - length}`,
        strokeDashoffset: -offset,
      };
      offset += length;
      return seg;
    });
  }, [categoryBreakdown.items]);

  const hoveredMonth = hoveredMonthIdx !== null ? sixMonthsData[hoveredMonthIdx] : null;
  const hoveredCategory = hoveredCatId
    ? categoryBreakdown.items.find((i) => i.id === hoveredCatId)
    : null;

  return (
    <div className="space-y-6">
      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Total Saldo */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Total Saldo Bersih
            </span>
            <Wallet className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          </div>
          <p className="mt-2.5 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums">
            {formatRupiah(totalBalance)}
          </p>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            Akumulasi dari {accounts.length} akun aktif
          </p>
        </div>

        {/* Pemasukan Bulan Ini */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Pemasukan Bulan Ini
            </span>
            <ArrowDownLeft className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="mt-2.5 text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 tabular-nums">
            {formatRupiah(kpi.curIncome)}
          </p>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            {formatMonthYearID(currentMonth)}
            {kpi.incomeDiffPct !== null && (
              <span>
                {' '}
                · {kpi.incomeDiffPct >= 0 ? `+${kpi.incomeDiffPct}%` : `${kpi.incomeDiffPct}%`} vs
                bulan lalu
              </span>
            )}
          </p>
        </div>

        {/* Pengeluaran Bulan Ini */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Pengeluaran Bulan Ini
            </span>
            <ArrowUpRight className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </div>
          <p className="mt-2.5 text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400 tabular-nums">
            {formatRupiah(kpi.curExpense)}
          </p>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            {formatMonthYearID(currentMonth)}
            {kpi.expenseDiffPct !== null && (
              <span>
                {' '}
                · {kpi.expenseDiffPct >= 0 ? `+${kpi.expenseDiffPct}%` : `${kpi.expenseDiffPct}%`} vs
                bulan lalu
              </span>
            )}
          </p>
        </div>

        {/* Selisih (Laba / Rugi) */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Selisih (Laba / Rugi)
            </span>
            <span
              className={`text-xs font-semibold ${
                kpi.curNet >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {kpi.curNet >= 0 ? 'Surplus' : 'Defisit'}
            </span>
          </div>
          <p
            className={`mt-2.5 text-2xl font-bold tracking-tight tabular-nums ${
              kpi.curNet >= 0
                ? 'text-slate-900 dark:text-slate-100'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {formatRupiah(kpi.curNet, true)}
          </p>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            Bulan lalu: {formatRupiah(kpi.prevNet, true)}
          </p>
        </div>
      </div>

      {/* Budget Alert Banner if any category >= 80% */}
      {budgetAlerts.length > 0 && (
        <div className="rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/70 px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
            <div className="text-xs text-amber-900 dark:text-amber-200">
              <span className="font-semibold">Peringatan Anggaran:</span>{' '}
              {budgetAlerts
                .slice(0, 3)
                .map((b) => `${b.categoryName} (${b.pct}%)`)
                .join(' · ')}
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('budgets')}
            className="text-xs font-semibold text-amber-800 dark:text-amber-300 hover:underline whitespace-nowrap shrink-0 self-start sm:self-center"
          >
            Kelola Anggaran →
          </button>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* 6 Months Income vs Expense Chart */}
        <div className="lg:col-span-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Pemasukan vs Pengeluaran
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Perbandingan arus kas 6 bulan terakhir
                </p>
              </div>
              <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => setChartMode('bar')}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    chartMode === 'bar'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  Batang
                </button>
                <button
                  type="button"
                  onClick={() => setChartMode('line')}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    chartMode === 'line'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <LineChartIcon className="w-3.5 h-3.5" />
                  Garis
                </button>
              </div>
            </div>

            {/* Interactive Hover Readout */}
            <div className="mt-4 min-h-7 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-4">
                <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 inline-block" />
                  Pemasukan
                </span>
                <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-xs bg-rose-500 inline-block" />
                  Pengeluaran
                </span>
              </div>
              {hoveredMonth ? (
                <div className="text-slate-700 dark:text-slate-200 tabular-nums font-medium">
                  {hoveredMonth.fullLabel}: Masuk{' '}
                  <span className="text-emerald-600 dark:text-emerald-400">
                    {formatRupiah(hoveredMonth.income)}
                  </span>{' '}
                  · Keluar{' '}
                  <span className="text-rose-600 dark:text-rose-400">
                    {formatRupiah(hoveredMonth.expense)}
                  </span>
                </div>
              ) : (
                <span className="text-slate-400 dark:text-slate-500">
                  Arahkan kursor ke bulan untuk detail nominal
                </span>
              )}
            </div>
          </div>

          {/* Chart SVG */}
          <div className="mt-4 w-full">
            {transactions.length === 0 ? (
              <div className="h-56 flex flex-col items-center justify-center text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-4">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Belum ada data grafik
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Catat transaksi pemasukan dan pengeluaran untuk melihat tren 6 bulan.
                </p>
              </div>
            ) : (
              <div className="relative h-60 w-full select-none">
                <svg
                  viewBox="0 0 600 220"
                  className="w-full h-full overflow-visible"
                  role="img"
                  aria-label="Grafik pemasukan dan pengeluaran 6 bulan terakhir"
                >
                  {/* Horizontal Gridlines & Y-Axis labels */}
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                    const y = 180 - ratio * 155;
                    const val = Math.round(maxChartVal * ratio);
                    return (
                      <g key={idx}>
                        <line
                          x1="76"
                          y1={y}
                          x2="588"
                          y2={y}
                          stroke="currentColor"
                          className="text-slate-100 dark:text-slate-800"
                          strokeWidth="1"
                        />
                        <text
                          x="68"
                          y={y + 4}
                          textAnchor="end"
                          className="fill-slate-400 dark:fill-slate-500 text-[10px] tabular-nums"
                        >
                          {formatCompactRupiah(val)}
                        </text>
                      </g>
                    );
                  })}

                  {chartMode === 'bar' ? (
                    sixMonthsData.map((d, idx) => {
                      const groupWidth = (588 - 76) / 6;
                      const cx = 76 + groupWidth * idx + groupWidth / 2;
                      const barW = 16;
                      const incH = (d.income / maxChartVal) * 155;
                      const expH = (d.expense / maxChartVal) * 155;
                      const isHovered = hoveredMonthIdx === idx;

                      return (
                        <g
                          key={d.key}
                          onMouseEnter={() => setHoveredMonthIdx(idx)}
                          onMouseLeave={() => setHoveredMonthIdx(null)}
                          className="cursor-pointer"
                        >
                          <rect
                            x={cx - groupWidth / 2 + 4}
                            y="15"
                            width={groupWidth - 8}
                            height="175"
                            rx="8"
                            className={`transition-opacity ${
                              isHovered
                                ? 'fill-slate-100/80 dark:fill-slate-800/60 opacity-100'
                                : 'opacity-0'
                            }`}
                          />
                          <rect
                            x={cx - barW - 2}
                            y={180 - incH}
                            width={barW}
                            height={Math.max(incH, d.income > 0 ? 3 : 0)}
                            rx="4"
                            className="fill-emerald-500 transition-all duration-200"
                          />
                          <rect
                            x={cx + 2}
                            y={180 - expH}
                            width={barW}
                            height={Math.max(expH, d.expense > 0 ? 3 : 0)}
                            rx="4"
                            className="fill-rose-500 transition-all duration-200"
                          />
                          <text
                            x={cx}
                            y="204"
                            textAnchor="middle"
                            className={`text-[11px] font-medium ${
                              isHovered
                                ? 'fill-slate-900 dark:fill-slate-100'
                                : 'fill-slate-500 dark:fill-slate-400'
                            }`}
                          >
                            {d.label}
                          </text>
                        </g>
                      );
                    })
                  ) : (
                    <>
                      {/* Income Line */}
                      <polyline
                        fill="none"
                        stroke="#10B981"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={sixMonthsData
                          .map((d, idx) => {
                            const groupWidth = (588 - 76) / 6;
                            const cx = 76 + groupWidth * idx + groupWidth / 2;
                            const y = 180 - (d.income / maxChartVal) * 155;
                            return `${cx},${y}`;
                          })
                          .join(' ')}
                      />
                      {/* Expense Line */}
                      <polyline
                        fill="none"
                        stroke="#F43F5E"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={sixMonthsData
                          .map((d, idx) => {
                            const groupWidth = (588 - 76) / 6;
                            const cx = 76 + groupWidth * idx + groupWidth / 2;
                            const y = 180 - (d.expense / maxChartVal) * 155;
                            return `${cx},${y}`;
                          })
                          .join(' ')}
                      />
                      {/* Points & Hit Zones */}
                      {sixMonthsData.map((d, idx) => {
                        const groupWidth = (588 - 76) / 6;
                        const cx = 76 + groupWidth * idx + groupWidth / 2;
                        const incY = 180 - (d.income / maxChartVal) * 155;
                        const expY = 180 - (d.expense / maxChartVal) * 155;
                        const isHovered = hoveredMonthIdx === idx;

                        return (
                          <g
                            key={d.key}
                            onMouseEnter={() => setHoveredMonthIdx(idx)}
                            onMouseLeave={() => setHoveredMonthIdx(null)}
                            className="cursor-pointer"
                          >
                            <rect
                              x={cx - groupWidth / 2 + 4}
                              y="15"
                              width={groupWidth - 8}
                              height="175"
                              rx="8"
                              className={
                                isHovered
                                  ? 'fill-slate-100/70 dark:fill-slate-800/50'
                                  : 'fill-transparent'
                              }
                            />
                            <circle
                              cx={cx}
                              cy={incY}
                              r={isHovered ? 5.5 : 4}
                              className="fill-emerald-500 stroke-white dark:stroke-slate-900"
                              strokeWidth="2"
                            />
                            <circle
                              cx={cx}
                              cy={expY}
                              r={isHovered ? 5.5 : 4}
                              className="fill-rose-500 stroke-white dark:stroke-slate-900"
                              strokeWidth="2"
                            />
                            <text
                              x={cx}
                              y="204"
                              textAnchor="middle"
                              className={`text-[11px] font-medium ${
                                isHovered
                                  ? 'fill-slate-900 dark:fill-slate-100'
                                  : 'fill-slate-500 dark:fill-slate-400'
                              }`}
                            >
                              {d.label}
                            </text>
                          </g>
                        );
                      })}
                    </>
                  )}
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Donut Chart: Pengeluaran per Kategori */}
        <div className="lg:col-span-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Pengeluaran per Kategori
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Distribusi pengeluaran {formatMonthYearID(currentMonth)}
            </p>
          </div>

          {categoryBreakdown.items.length === 0 ? (
            <div className="my-auto py-10 flex flex-col items-center justify-center text-center">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Belum ada pengeluaran bulan ini
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                Tambahkan transaksi pengeluaran untuk melihat komposisi kategori.
              </p>
            </div>
          ) : (
            <div className="mt-4 flex flex-col sm:flex-row lg:flex-col xl:flex-row items-center gap-6 my-auto">
              {/* SVG Donut */}
              <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
                <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
                  <circle
                    cx="80"
                    cy="80"
                    r="64"
                    fill="none"
                    strokeWidth="22"
                    className="stroke-slate-100 dark:stroke-slate-800"
                  />
                  {donutSegments.map((seg) => (
                    <circle
                      key={seg.id}
                      cx="80"
                      cy="80"
                      r={seg.radius}
                      fill="none"
                      stroke={seg.color}
                      strokeWidth={hoveredCatId === seg.id ? 26 : 22}
                      strokeDasharray={seg.strokeDasharray}
                      strokeDashoffset={seg.strokeDashoffset}
                      onMouseEnter={() => setHoveredCatId(seg.id)}
                      onMouseLeave={() => setHoveredCatId(null)}
                      className="cursor-pointer transition-all duration-150"
                    />
                  ))}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 pointer-events-none">
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate max-w-full">
                    {hoveredCategory ? hoveredCategory.name : 'Total Keluar'}
                  </span>
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100 tabular-nums mt-0.5">
                    {formatCompactRupiah(
                      hoveredCategory ? hoveredCategory.total : categoryBreakdown.grandTotal
                    )}
                  </span>
                  {hoveredCategory && (
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 tabular-nums">
                      {hoveredCategory.percent.toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>

              {/* Legend List */}
              <div className="w-full space-y-2.5 max-h-48 overflow-y-auto pr-1">
                {categoryBreakdown.items.map((item) => (
                  <div
                    key={item.id}
                    onMouseEnter={() => setHoveredCatId(item.id)}
                    onMouseLeave={() => setHoveredCatId(null)}
                    className={`flex items-center justify-between gap-2 text-xs rounded-lg px-2 py-1 transition-colors cursor-default ${
                      hoveredCatId === item.id ? 'bg-slate-100 dark:bg-slate-800' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-xs shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-slate-700 dark:text-slate-200 font-medium truncate">
                        {item.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 tabular-nums">
                      <span className="text-slate-900 dark:text-slate-100 font-semibold">
                        {formatCompactRupiah(item.total)}
                      </span>
                      <span className="text-slate-400 dark:text-slate-500 w-10 text-right">
                        {item.percent.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Grid: 5 Recent Transactions + Account Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* 5 Transaksi Terbaru */}
        <div className="lg:col-span-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                5 Transaksi Terbaru
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Aktivitas keuangan terakhir yang tercatat
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('transactions')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 whitespace-nowrap shrink-0"
            >
              Lihat Semua
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentTransactions.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Belum ada transaksi tercatat
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Mulai catat pemasukan, pengeluaran, atau transfer antar akun Anda.
              </p>
              <button
                type="button"
                onClick={onAddTransaction}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
              >
                <Plus className="w-4 h-4" />
                Catat Transaksi Pertama
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentTransactions.map((tx) => {
                const cat = tx.categoryId ? categoryMap.get(tx.categoryId) : undefined;
                const srcAcc = accountMap.get(tx.accountId);
                const dstAcc = tx.toAccountId ? accountMap.get(tx.toAccountId) : undefined;

                return (
                  <div
                    key={tx.id}
                    className="px-6 py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor:
                            tx.type === 'transfer'
                              ? 'rgba(2, 132, 199, 0.12)'
                              : `${cat?.color ?? '#64748B'}1A`,
                          color:
                            tx.type === 'transfer' ? '#0284C7' : cat?.color ?? '#64748B',
                        }}
                      >
                        {tx.type === 'transfer' ? (
                          <ArrowRightLeft className="w-4 h-4" />
                        ) : (
                          <CategoryIcon icon={cat?.icon ?? 'receipt'} className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                          {tx.note}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {formatDateID(tx.date)} ·{' '}
                          {tx.type === 'transfer'
                            ? `Transfer: ${srcAcc?.name ?? '-'} → ${dstAcc?.name ?? '-'}`
                            : `${cat?.name ?? 'Tanpa Kategori'} · ${srcAcc?.name ?? '-'}`}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`text-sm font-semibold tabular-nums ${
                          tx.type === 'income'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : tx.type === 'expense'
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-sky-600 dark:text-sky-400'
                        }`}
                      >
                        {tx.type === 'income'
                          ? `+${formatRupiah(tx.amount)}`
                          : tx.type === 'expense'
                          ? `-${formatRupiah(tx.amount)}`
                          : formatRupiah(tx.amount)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Saldo per Akun Ringkas */}
        <div className="lg:col-span-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Saldo Akun & Dompet
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Posisi dana terkini
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('accounts')}
              className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline whitespace-nowrap shrink-0"
            >
              Kelola
            </button>
          </div>

          {accounts.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Belum ada akun
              </p>
              <button
                type="button"
                onClick={() => onNavigate('accounts')}
                className="mt-3 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                + Tambah Akun / Dompet
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {accounts.map((acc) => (
                <div
                  key={acc.id}
                  className="px-6 py-3.5 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: acc.color }}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                        {acc.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {acc.type === 'cash'
                          ? 'Kas Tunai'
                          : acc.type === 'bank'
                          ? 'Rekening Bank'
                          : 'E-Wallet'}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-sm font-semibold tabular-nums shrink-0 ${
                      acc.currentBalance >= 0
                        ? 'text-slate-900 dark:text-slate-100'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {formatRupiah(acc.currentBalance)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
