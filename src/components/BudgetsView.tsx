import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Gauge,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { Budget, Category, Transaction } from '../types';
import {
  formatMonthYearID,
  formatRupiah,
  getCurrentMonthKey,
  shiftMonthKey,
} from '../utils/format';
import { CategoryIcon } from '../utils/icons';
import { ConfirmModal } from './ConfirmModal';

interface BudgetsViewProps {
  budgets: Budget[];
  categories: Category[];
  transactions: Transaction[];
  onUpsertBudget: (payload: {
    id?: string;
    categoryId: string;
    month: string;
    limit: number;
  }) => void;
  onDeleteBudget: (id: string) => void;
}

export const BudgetsView: React.FC<BudgetsViewProps> = ({
  budgets,
  categories,
  transactions,
  onUpsertBudget,
  onDeleteBudget,
}) => {
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthKey());
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; catName: string } | null>(
    null
  );

  const [categoryId, setCategoryId] = useState('');
  const [limitInput, setLimitInput] = useState('');
  const [error, setError] = useState('');

  const expenseCategories = useMemo(
    () => categories.filter((c) => c.type === 'expense'),
    [categories]
  );
  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories]
  );

  // Calculate spent per expense category in selectedMonth
  const spentMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const tx of transactions) {
      if (tx.type === 'expense' && tx.date.startsWith(selectedMonth) && tx.categoryId) {
        map.set(tx.categoryId, (map.get(tx.categoryId) ?? 0) + tx.amount);
      }
    }
    return map;
  }, [transactions, selectedMonth]);

  const monthBudgets = useMemo(() => {
    return budgets
      .filter((b) => b.month === selectedMonth)
      .map((b) => {
        const cat = categoryMap.get(b.categoryId);
        const spent = spentMap.get(b.categoryId) ?? 0;
        const pct = b.limit > 0 ? Math.round((spent / b.limit) * 100) : 0;
        const remaining = b.limit - spent;
        return {
          ...b,
          cat,
          spent,
          pct,
          remaining,
        };
      })
      .sort((a, b) => b.pct - a.pct);
  }, [budgets, selectedMonth, categoryMap, spentMap]);

  const totals = useMemo(() => {
    let totalLimit = 0;
    let totalSpent = 0;
    for (const b of monthBudgets) {
      totalLimit += b.limit;
      totalSpent += b.spent;
    }
    return {
      totalLimit,
      totalSpent,
      pct: totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0,
    };
  }, [monthBudgets]);

  const openAdd = () => {
    const usedIds = new Set(monthBudgets.map((b) => b.categoryId));
    const available = expenseCategories.find((c) => !usedIds.has(c.id)) ?? expenseCategories[0];
    setEditingBudget(null);
    setCategoryId(available?.id ?? '');
    setLimitInput('');
    setError('');
    setModalOpen(true);
  };

  const openEdit = (b: Budget) => {
    setEditingBudget(b);
    setCategoryId(b.categoryId);
    setLimitInput(String(b.limit));
    setError('');
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!categoryId) {
      setError('Pilih kategori pengeluaran terlebih dahulu.');
      return;
    }
    const parsedLimit = Number(limitInput);
    if (!Number.isFinite(parsedLimit) || parsedLimit <= 0) {
      setError('Batas anggaran harus berupa angka positif lebih dari 0.');
      return;
    }

    onUpsertBudget({
      id: editingBudget?.id,
      categoryId,
      month: selectedMonth,
      limit: Math.round(parsedLimit),
    });
    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Month selector & summary */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedMonth((m) => shiftMonthKey(m, -1))}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              aria-label="Bulan sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => e.target.value && setSelectedMonth(e.target.value)}
              className="px-3 py-1.5 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
            />
            <button
              type="button"
              onClick={() => setSelectedMonth((m) => shiftMonthKey(m, 1))}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              aria-label="Bulan berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 pt-1 tabular-nums">
            Total Terpakai {formatMonthYearID(selectedMonth)}:{' '}
            <strong className="text-slate-900 dark:text-slate-100">
              {formatRupiah(totals.totalSpent)}
            </strong>{' '}
            dari batas{' '}
            <strong className="text-slate-900 dark:text-slate-100">
              {formatRupiah(totals.totalLimit)}
            </strong>{' '}
            ({totals.pct}%)
          </p>
        </div>

        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors whitespace-nowrap shrink-0 self-start lg:self-center"
        >
          <Plus className="w-4 h-4" />
          Atur Anggaran Kategori
        </button>
      </div>

      {/* Budgets List */}
      {monthBudgets.length === 0 ? (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 py-14 px-6 text-center">
          <Gauge className="w-10 h-10 mx-auto text-slate-400 mb-3" />
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
            Belum ada anggaran untuk {formatMonthYearID(selectedMonth)}
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Tetapkan batas pengeluaran bulanan per kategori agar keuangan tetap terkendali dan terhindar dari pemborosan.
          </p>
          <button
            type="button"
            onClick={openAdd}
            className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Plus className="w-4 h-4" />
            Buat Anggaran Pertama
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {monthBudgets.map((b) => {
            const isOver = b.pct > 100;
            const isWarning = !isOver && b.pct >= 80;
            const barWidth = Math.min(100, b.pct);

            return (
              <div
                key={b.id}
                className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: `${b.cat?.color ?? '#64748B'}1A`,
                        color: b.cat?.color ?? '#64748B',
                      }}
                    >
                      <CategoryIcon icon={b.cat?.icon ?? 'receipt'} className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {b.cat?.name ?? 'Kategori Dihapus'}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5 text-xs">
                        {isOver ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-rose-600 dark:text-rose-400">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Melebihi Batas ({b.pct}%)
                          </span>
                        ) : isWarning ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Mendekati Batas ({b.pct}%)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Aman ({b.pct}%)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEdit(b)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
                      aria-label="Edit anggaran"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setDeleteTarget({
                          id: b.id,
                          catName: b.cat?.name ?? 'Kategori',
                        })
                      }
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                      aria-label="Hapus anggaran"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isOver
                          ? 'bg-rose-500'
                          : isWarning
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>

                  <div className="mt-2.5 flex items-center justify-between text-xs tabular-nums">
                    <span className="text-slate-600 dark:text-slate-400">
                      Terpakai:{' '}
                      <strong className="text-slate-900 dark:text-slate-100">
                        {formatRupiah(b.spent)}
                      </strong>
                    </span>
                    <span className="text-slate-600 dark:text-slate-400">
                      Batas:{' '}
                      <strong className="text-slate-900 dark:text-slate-100">
                        {formatRupiah(b.limit)}
                      </strong>
                    </span>
                  </div>
                  <p
                    className={`mt-1 text-xs tabular-nums ${
                      b.remaining < 0
                        ? 'text-rose-600 dark:text-rose-400 font-medium'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {b.remaining >= 0
                      ? `Sisa anggaran: ${formatRupiah(b.remaining)}`
                      : `Kelebihan pengeluaran: ${formatRupiah(Math.abs(b.remaining))}`}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Budget Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/55 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="budget-modal-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h2
                id="budget-modal-title"
                className="text-base font-semibold text-slate-900 dark:text-slate-100"
              >
                {editingBudget ? 'Ubah Batas Anggaran' : 'Atur Anggaran Baru'}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                  Bulan Anggaran
                </label>
                <input
                  type="text"
                  disabled
                  value={formatMonthYearID(selectedMonth)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                  Kategori Pengeluaran <span className="text-rose-500">*</span>
                </label>
                <select
                  value={categoryId}
                  disabled={Boolean(editingBudget)}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 disabled:opacity-60"
                >
                  {expenseCategories.length === 0 && (
                    <option value="">Tidak ada kategori pengeluaran</option>
                  )}
                  {expenseCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                  Batas Maksimal (Rp) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={limitInput}
                  onChange={(e) => setLimitInput(e.target.value)}
                  placeholder="Contoh: 1500000"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
                {Number(limitInput) > 0 && (
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                    Preview: {formatRupiah(Number(limitInput))}
                  </p>
                )}
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs font-medium text-rose-700 dark:text-rose-300">
                  {error}
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Simpan Anggaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Hapus Anggaran"
        message={
          deleteTarget
            ? `Yakin ingin menghapus batas anggaran kategori "${deleteTarget.catName}" untuk bulan ${formatMonthYearID(
                selectedMonth
              )}?`
            : ''
        }
        confirmLabel="Hapus Anggaran"
        onConfirm={() => {
          if (deleteTarget) {
            onDeleteBudget(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
