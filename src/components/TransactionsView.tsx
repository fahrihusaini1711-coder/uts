import React, { useMemo, useState } from 'react';
import {
  ArrowRightLeft,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Paperclip,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from 'lucide-react';
import { Account, Category, Transaction, TransactionType } from '../types';
import { formatDateID, formatRupiah } from '../utils/format';
import { CategoryIcon } from '../utils/icons';
import { ConfirmModal } from './ConfirmModal';
import { ReceiptPreviewModal } from './ReceiptPreviewModal';

interface TransactionsViewProps {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  onAddTransaction: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
}

type SortOption = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  transactions,
  accounts,
  categories,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
  const [previewTx, setPreviewTx] = useState<Transaction | null>(null);

  const accountMap = useMemo(
    () => new Map(accounts.map((a) => [a.id, a])),
    [accounts]
  );
  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories]
  );

  const filteredAndSorted = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = transactions.filter((tx) => {
      if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
      if (categoryFilter !== 'all' && tx.categoryId !== categoryFilter) return false;
      if (
        accountFilter !== 'all' &&
        tx.accountId !== accountFilter &&
        tx.toAccountId !== accountFilter
      ) {
        return false;
      }
      if (dateFrom && tx.date < dateFrom) return false;
      if (dateTo && tx.date > dateTo) return false;
      if (q) {
        const catName = tx.categoryId ? categoryMap.get(tx.categoryId)?.name ?? '' : '';
        const srcName = accountMap.get(tx.accountId)?.name ?? '';
        const dstName = tx.toAccountId ? accountMap.get(tx.toAccountId)?.name ?? '' : '';
        const haystack = `${tx.note} ${catName} ${srcName} ${dstName}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    return list.sort((a, b) => {
      if (sortBy === 'date-desc') {
        if (a.date !== b.date) return b.date.localeCompare(a.date);
        return b.createdAt.localeCompare(a.createdAt);
      }
      if (sortBy === 'date-asc') {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.createdAt.localeCompare(b.createdAt);
      }
      if (sortBy === 'amount-desc') return b.amount - a.amount;
      return a.amount - b.amount;
    });
  }, [
    transactions,
    searchQuery,
    typeFilter,
    categoryFilter,
    accountFilter,
    dateFrom,
    dateTo,
    sortBy,
    categoryMap,
    accountMap,
  ]);

  // Summary of currently filtered records
  const filteredTotals = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const tx of filteredAndSorted) {
      if (tx.type === 'income') income += tx.amount;
      else if (tx.type === 'expense') expense += tx.amount;
    }
    return { income, expense, count: filteredAndSorted.length };
  }, [filteredAndSorted]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedRows = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredAndSorted.slice(start, start + pageSize);
  }, [filteredAndSorted, safePage, pageSize]);

  const hasActiveFilters =
    searchQuery !== '' ||
    typeFilter !== 'all' ||
    categoryFilter !== 'all' ||
    accountFilter !== 'all' ||
    dateFrom !== '' ||
    dateTo !== '';

  const resetFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setCategoryFilter('all');
    setAccountFilter('all');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-5">
      {/* Filter & Search Toolbar */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Type segmented tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-x-auto">
            {(
              [
                { id: 'all', label: 'Semua' },
                { id: 'income', label: 'Pemasukan' },
                { id: 'expense', label: 'Pengeluaran' },
                { id: 'transfer', label: 'Transfer' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setTypeFilter(tab.id);
                  setCurrentPage(1);
                }}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                  typeFilter === tab.id
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search input & primary action */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 lg:max-w-md justify-end">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Cari catatan, kategori, atau akun..."
                className="w-full pl-9 pr-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              />
            </div>
            <button
              type="button"
              onClick={onAddTransaction}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              Tambah Transaksi
            </button>
          </div>
        </div>

        {/* Advanced filters row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
          <div>
            <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
              Kategori
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            >
              <option value="all">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
              Akun / Dompet
            </label>
            <select
              value={accountFilter}
              onChange={(e) => {
                setAccountFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            >
              <option value="all">Semua Akun</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
              Dari Tanggal
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
              Sampai Tanggal
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
              Urutkan
            </label>
            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              >
                <option value="date-desc">Tanggal Terbaru</option>
                <option value="date-asc">Tanggal Terlama</option>
                <option value="amount-desc">Nominal Terbesar</option>
                <option value="amount-asc">Nominal Terkecil</option>
              </select>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  title="Reset filter"
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shrink-0"
                  aria-label="Reset semua filter"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Summary Strip */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400">
          <span>
            Menampilkan <strong className="text-slate-900 dark:text-slate-100 tabular-nums">{filteredTotals.count}</strong> transaksi
          </span>
          <div className="flex flex-wrap items-center gap-4 tabular-nums">
            <span>
              Total Masuk:{' '}
              <strong className="text-emerald-600 dark:text-emerald-400">
                {formatRupiah(filteredTotals.income)}
              </strong>
            </span>
            <span>
              Total Keluar:{' '}
              <strong className="text-rose-600 dark:text-rose-400">
                {formatRupiah(filteredTotals.expense)}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* Transactions Table / List */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
        {paginatedRows.length === 0 ? (
          <div className="py-14 px-6 text-center">
            <p className="text-base font-semibold text-slate-800 dark:text-slate-200">
              {transactions.length === 0
                ? 'Belum ada data transaksi'
                : 'Tidak ada transaksi yang sesuai filter'}
            </p>
            <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              {transactions.length === 0
                ? 'Mulai catat pemasukan, pengeluaran, atau transfer antar akun untuk memantau arus kas Anda.'
                : 'Coba ubah kata kunci pencarian, rentang tanggal, atau atur ulang filter yang aktif.'}
            </p>
            <div className="mt-5 flex items-center justify-center gap-3">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Reset Filter
                </button>
              )}
              <button
                type="button"
                onClick={onAddTransaction}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
              >
                <Plus className="w-4 h-4" />
                Tambah Transaksi
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <th className="py-3 px-5">Tanggal</th>
                    <th className="py-3 px-4">Keterangan & Kategori</th>
                    <th className="py-3 px-4">Akun / Dompet</th>
                    <th className="py-3 px-4">Jenis</th>
                    <th className="py-3 px-4 text-right">Jumlah</th>
                    <th className="py-3 px-5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                  {paginatedRows.map((tx) => {
                    const cat = tx.categoryId ? categoryMap.get(tx.categoryId) : undefined;
                    const srcAcc = accountMap.get(tx.accountId);
                    const dstAcc = tx.toAccountId ? accountMap.get(tx.toAccountId) : undefined;

                    return (
                      <tr
                        key={tx.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3 px-5 text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap tabular-nums">
                          {formatDateID(tx.date)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
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
                              <p className="font-medium text-slate-900 dark:text-slate-100 truncate max-w-xs">
                                {tx.note}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                {tx.type === 'transfer'
                                  ? 'Transfer Antar Akun'
                                  : cat?.name ?? 'Tanpa Kategori'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          {tx.type === 'transfer'
                            ? `${srcAcc?.name ?? '-'} → ${dstAcc?.name ?? '-'}`
                            : srcAcc?.name ?? '-'}
                        </td>
                        <td className="py-3 px-4 text-xs whitespace-nowrap">
                          <span
                            className={`font-medium ${
                              tx.type === 'income'
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : tx.type === 'expense'
                                ? 'text-rose-600 dark:text-rose-400'
                                : 'text-sky-600 dark:text-sky-400'
                            }`}
                          >
                            {tx.type === 'income'
                              ? 'Pemasukan'
                              : tx.type === 'expense'
                              ? 'Pengeluaran'
                              : 'Transfer'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap tabular-nums">
                          <span
                            className={`font-semibold ${
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
                        </td>
                        <td className="py-3 px-5 text-right whitespace-nowrap">
                          <div className="inline-flex items-center justify-end gap-1">
                            {tx.receiptImage && (
                              <button
                                type="button"
                                onClick={() => setPreviewTx(tx)}
                                title="Lihat lampiran struk"
                                className="p-1.5 rounded-lg text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/50 transition-colors"
                                aria-label="Lihat lampiran struk"
                              >
                                <Paperclip className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => onEditTransaction(tx)}
                              title="Edit transaksi"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              aria-label="Edit transaksi"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(tx)}
                              title="Hapus transaksi"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                              aria-label="Hapus transaksi"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Rows */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedRows.map((tx) => {
                const cat = tx.categoryId ? categoryMap.get(tx.categoryId) : undefined;
                const srcAcc = accountMap.get(tx.accountId);
                const dstAcc = tx.toAccountId ? accountMap.get(tx.toAccountId) : undefined;

                return (
                  <div key={tx.id} className="p-4 space-y-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                          style={{
                            backgroundColor:
                              tx.type === 'transfer'
                                ? 'rgba(2, 132, 199, 0.12)'
                                : `${cat?.color ?? '#64748B'}1A`,
                            color: tx.type === 'transfer' ? '#0284C7' : cat?.color ?? '#64748B',
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
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {formatDateID(tx.date)} ·{' '}
                            {tx.type === 'transfer'
                              ? `${srcAcc?.name ?? '-'} → ${dstAcc?.name ?? '-'}`
                              : `${cat?.name ?? 'Tanpa Kategori'} · ${srcAcc?.name ?? '-'}`}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`text-sm font-semibold tabular-nums shrink-0 ${
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

                    <div className="flex items-center justify-end gap-2 pt-1">
                      {tx.receiptImage && (
                        <button
                          type="button"
                          onClick={() => setPreviewTx(tx)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40"
                        >
                          <Paperclip className="w-3.5 h-3.5" />
                          Struk
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onEditTransaction(tx)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(tx)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Hapus
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Footer */}
            <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <span>Baris per halaman:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <span className="tabular-nums ml-2">
                  Halaman {safePage} dari {totalPages}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Sebelumnya
                </button>
                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Berikutnya
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Confirm Delete Dialog */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Hapus Transaksi"
        message={
          deleteTarget
            ? `Yakin ingin menghapus transaksi "${deleteTarget.note}" senilai ${formatRupiah(
                deleteTarget.amount
              )}? Saldo akun terkait akan otomatis disesuaikan.`
            : ''
        }
        confirmLabel="Hapus Transaksi"
        onConfirm={() => {
          if (deleteTarget) {
            onDeleteTransaction(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Receipt Preview Dialog */}
      <ReceiptPreviewModal
        isOpen={Boolean(previewTx)}
        imageUrl={previewTx?.receiptImage}
        fileName={previewTx?.receiptName}
        note={previewTx?.note}
        onClose={() => setPreviewTx(null)}
      />
    </div>
  );
};
