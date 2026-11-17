import React, { useMemo, useState } from 'react';
import { Download, FileBarChart, Printer } from 'lucide-react';
import { Account, Category, Transaction } from '../types';
import {
  formatDateID,
  formatMonthYearID,
  formatRupiah,
  getCurrentMonthKey,
} from '../utils/format';

interface ReportsViewProps {
  businessName: string;
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  businessName,
  accounts,
  categories,
  transactions,
}) => {
  const [periodMode, setPeriodMode] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthKey());
  const [selectedYear, setSelectedYear] = useState<string>(
    getCurrentMonthKey().slice(0, 4)
  );

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories]
  );
  const accountMap = useMemo(
    () => new Map(accounts.map((a) => [a.id, a])),
    [accounts]
  );

  const availableYears = useMemo(() => {
    const years = new Set<string>([getCurrentMonthKey().slice(0, 4)]);
    transactions.forEach((tx) => years.add(tx.date.slice(0, 4)));
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [transactions]);

  const periodPrefix = periodMode === 'monthly' ? selectedMonth : selectedYear;
  const periodLabel =
    periodMode === 'monthly'
      ? formatMonthYearID(selectedMonth)
      : `Tahun ${selectedYear}`;

  const report = useMemo(() => {
    const periodStart =
      periodMode === 'monthly' ? `${selectedMonth}-01` : `${selectedYear}-01-01`;

    // Initial balance across all accounts
    const baseInitial = accounts.reduce((sum, a) => sum + a.initialBalance, 0);

    // Net cashflow before periodStart
    let deltaBeforePeriod = 0;
    const periodTxs: Transaction[] = [];

    for (const tx of transactions) {
      if (tx.date < periodStart) {
        if (tx.type === 'income') deltaBeforePeriod += tx.amount;
        else if (tx.type === 'expense') deltaBeforePeriod -= tx.amount;
      } else if (tx.date.startsWith(periodPrefix)) {
        periodTxs.push(tx);
      }
    }

    const openingBalance = baseInitial + deltaBeforePeriod;

    const incomeByCat = new Map<string, number>();
    const expenseByCat = new Map<string, number>();
    let totalIncome = 0;
    let totalExpense = 0;
    let totalTransfer = 0;
    let transferCount = 0;

    for (const tx of periodTxs) {
      if (tx.type === 'income') {
        totalIncome += tx.amount;
        const catId = tx.categoryId ?? 'uncategorized';
        incomeByCat.set(catId, (incomeByCat.get(catId) ?? 0) + tx.amount);
      } else if (tx.type === 'expense') {
        totalExpense += tx.amount;
        const catId = tx.categoryId ?? 'uncategorized';
        expenseByCat.set(catId, (expenseByCat.get(catId) ?? 0) + tx.amount);
      } else if (tx.type === 'transfer') {
        totalTransfer += tx.amount;
        transferCount += 1;
      }
    }

    const netProfit = totalIncome - totalExpense;
    const marginPct = totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(1) : '0.0';
    const closingBalance = openingBalance + netProfit;

    const incomeRows = Array.from(incomeByCat.entries())
      .map(([id, total]) => ({
        id,
        name: categoryMap.get(id)?.name ?? 'Pemasukan Lainnya',
        total,
        pct: totalIncome > 0 ? (total / totalIncome) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);

    const expenseRows = Array.from(expenseByCat.entries())
      .map(([id, total]) => ({
        id,
        name: categoryMap.get(id)?.name ?? 'Pengeluaran Lainnya',
        total,
        pct: totalExpense > 0 ? (total / totalExpense) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);

    return {
      periodTxs: periodTxs.sort((a, b) => b.date.localeCompare(a.date)),
      openingBalance,
      totalIncome,
      totalExpense,
      netProfit,
      marginPct,
      closingBalance,
      totalTransfer,
      transferCount,
      incomeRows,
      expenseRows,
    };
  }, [accounts, transactions, periodMode, selectedMonth, selectedYear, periodPrefix, categoryMap]);

  const handleExportCSV = () => {
    const escapeCSV = (val: string | number) => {
      const s = String(val).replace(/"/g, '""');
      return `"${s}"`;
    };

    const lines: string[] = [];
    lines.push([escapeCSV(`Laporan Keuangan - ${businessName}`), escapeCSV(periodLabel)].join(','));
    lines.push('');
    lines.push(['Ringkasan Laba Rugi & Arus Kas', 'Nominal (Rp)'].map(escapeCSV).join(','));
    lines.push(['Saldo Awal Periode', report.openingBalance].map(escapeCSV).join(','));
    lines.push(['Total Pemasukan', report.totalIncome].map(escapeCSV).join(','));
    lines.push(['Total Pengeluaran', report.totalExpense].map(escapeCSV).join(','));
    lines.push(['Laba / Rugi Bersih', report.netProfit].map(escapeCSV).join(','));
    lines.push(['Saldo Akhir Periode', report.closingBalance].map(escapeCSV).join(','));
    lines.push('');
    lines.push(
      ['Tanggal', 'Jenis', 'Kategori', 'Akun Sumber', 'Akun Tujuan', 'Keterangan', 'Jumlah (Rp)']
        .map(escapeCSV)
        .join(',')
    );

    for (const tx of report.periodTxs) {
      const jenis =
        tx.type === 'income' ? 'Pemasukan' : tx.type === 'expense' ? 'Pengeluaran' : 'Transfer';
      const kat = tx.categoryId ? categoryMap.get(tx.categoryId)?.name ?? '-' : '-';
      const src = accountMap.get(tx.accountId)?.name ?? '-';
      const dst = tx.toAccountId ? accountMap.get(tx.toAccountId)?.name ?? '-' : '-';
      lines.push(
        [tx.date, jenis, kat, src, dst, tx.note, tx.amount].map(escapeCSV).join(',')
      );
    }

    const csvContent = '\uFEFF' + lines.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `laporan-keuangan-${periodPrefix}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 print-full">
      {/* Controls Bar */}
      <div className="no-print rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setPeriodMode('monthly')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                periodMode === 'monthly'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Bulanan
            </button>
            <button
              type="button"
              onClick={() => setPeriodMode('yearly')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                periodMode === 'yearly'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Tahunan
            </button>
          </div>

          {periodMode === 'monthly' ? (
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => e.target.value && setSelectedMonth(e.target.value)}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
            />
          ) : (
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
            >
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  Tahun {y}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            Ekspor CSV
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-sky-600 hover:bg-sky-700 text-white transition-colors whitespace-nowrap"
          >
            <Printer className="w-4 h-4" />
            Cetak / PDF
          </button>
        </div>
      </div>

      {/* Print Header */}
      <div className="hidden print:block pb-4 border-b border-slate-300">
        <h1 className="text-xl font-bold text-slate-900">{businessName}</h1>
        <p className="text-sm text-slate-600">
          Laporan Laba Rugi & Arus Kas — Periode {periodLabel}
        </p>
      </div>

      {/* Empty state if no transactions in period */}
      {report.periodTxs.length === 0 ? (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 py-14 px-6 text-center">
          <FileBarChart className="w-10 h-10 mx-auto text-slate-400 mb-3" />
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
            Belum ada transaksi pada periode {periodLabel}
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Pilih bulan/tahun lain atau tambahkan transaksi baru untuk menghasilkan laporan laba rugi dan arus kas.
          </p>
        </div>
      ) : (
        <>
          {/* Two side-by-side financial statements */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Laporan Laba Rugi */}
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-5">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Laporan Laba Rugi
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Periode {periodLabel}
                </p>
              </div>

              {/* Pendapatan */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400 pb-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span>Pendapatan (Pemasukan)</span>
                  <span className="tabular-nums">{formatRupiah(report.totalIncome)}</span>
                </div>
                {report.incomeRows.length === 0 ? (
                  <p className="text-xs text-slate-400 py-1">Tidak ada pemasukan tercatat</p>
                ) : (
                  <div className="space-y-1.5">
                    {report.incomeRows.map((r) => (
                      <div
                        key={r.id}
                        className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300"
                      >
                        <span>
                          {r.name}{' '}
                          <span className="text-slate-400 dark:text-slate-500 tabular-nums">
                            ({r.pct.toFixed(0)}%)
                          </span>
                        </span>
                        <span className="font-medium tabular-nums">
                          {formatRupiah(r.total)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Beban / Pengeluaran */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-rose-600 dark:text-rose-400 pb-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span>Beban & Pengeluaran</span>
                  <span className="tabular-nums">{formatRupiah(report.totalExpense)}</span>
                </div>
                {report.expenseRows.length === 0 ? (
                  <p className="text-xs text-slate-400 py-1">Tidak ada pengeluaran tercatat</p>
                ) : (
                  <div className="space-y-1.5">
                    {report.expenseRows.map((r) => (
                      <div
                        key={r.id}
                        className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300"
                      >
                        <span>
                          {r.name}{' '}
                          <span className="text-slate-400 dark:text-slate-500 tabular-nums">
                            ({r.pct.toFixed(0)}%)
                          </span>
                        </span>
                        <span className="font-medium tabular-nums">
                          {formatRupiah(r.total)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Laba / Rugi Bersih */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 block">
                    {report.netProfit >= 0 ? 'Laba Bersih (Surplus)' : 'Rugi Bersih (Defisit)'}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                    Margin bersih: {report.marginPct}%
                  </span>
                </div>
                <span
                  className={`text-xl font-bold tabular-nums ${
                    report.netProfit >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {formatRupiah(report.netProfit, true)}
                </span>
              </div>
            </div>

            {/* Laporan Arus Kas */}
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-5">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Laporan Arus Kas
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Pergerakan likuiditas kas & bank periode {periodLabel}
                </p>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                <div className="py-3 flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">
                    Saldo Awal Periode
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                    {formatRupiah(report.openingBalance)}
                  </span>
                </div>
                <div className="py-3 flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">
                    Arus Kas Masuk (Operasional)
                  </span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    +{formatRupiah(report.totalIncome)}
                  </span>
                </div>
                <div className="py-3 flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">
                    Arus Kas Keluar (Operasional)
                  </span>
                  <span className="font-semibold text-rose-600 dark:text-rose-400 tabular-nums">
                    -{formatRupiah(report.totalExpense)}
                  </span>
                </div>
                <div className="py-3 flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">
                    Perubahan Kas Bersih
                  </span>
                  <span
                    className={`font-semibold tabular-nums ${
                      report.netProfit >= 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {formatRupiah(report.netProfit, true)}
                  </span>
                </div>
                <div className="py-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Mutasi Transfer Internal ({report.transferCount}x)</span>
                  <span className="tabular-nums">{formatRupiah(report.totalTransfer)}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Saldo Akhir Periode
                </span>
                <span className="text-xl font-bold text-sky-600 dark:text-sky-400 tabular-nums">
                  {formatRupiah(report.closingBalance)}
                </span>
              </div>
            </div>
          </div>

          {/* Transaction Ledger Table for Period */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Rincian Transaksi Periode ({report.periodTxs.length})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400">
                    <th className="py-2.5 px-5 font-semibold">Tanggal</th>
                    <th className="py-2.5 px-4 font-semibold">Keterangan</th>
                    <th className="py-2.5 px-4 font-semibold">Kategori</th>
                    <th className="py-2.5 px-4 font-semibold">Akun</th>
                    <th className="py-2.5 px-5 font-semibold text-right">Nominal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {report.periodTxs.map((tx) => {
                    const catName = tx.categoryId
                      ? categoryMap.get(tx.categoryId)?.name ?? '-'
                      : 'Transfer';
                    const srcName = accountMap.get(tx.accountId)?.name ?? '-';
                    const dstName = tx.toAccountId
                      ? accountMap.get(tx.toAccountId)?.name ?? '-'
                      : '';
                    return (
                      <tr key={tx.id}>
                        <td className="py-2.5 px-5 text-slate-500 dark:text-slate-400 whitespace-nowrap tabular-nums">
                          {formatDateID(tx.date)}
                        </td>
                        <td className="py-2.5 px-4 text-slate-900 dark:text-slate-100 font-medium">
                          {tx.note}
                        </td>
                        <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400">
                          {catName}
                        </td>
                        <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {tx.type === 'transfer' ? `${srcName} → ${dstName}` : srcName}
                        </td>
                        <td
                          className={`py-2.5 px-5 text-right font-semibold whitespace-nowrap tabular-nums ${
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
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
