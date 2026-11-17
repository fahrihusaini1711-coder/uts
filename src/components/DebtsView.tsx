import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Edit2,
  HandCoins,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { DebtRecord } from '../types';
import { formatDateID, formatRupiah, toDateInputValue } from '../utils/format';
import { ConfirmModal } from './ConfirmModal';

interface DebtsViewProps {
  debts: DebtRecord[];
  onAddDebt: (payload: Omit<DebtRecord, 'id'>) => void;
  onUpdateDebt: (id: string, payload: Omit<DebtRecord, 'id'>) => void;
  onToggleStatus: (id: string) => void;
  onDeleteDebt: (id: string) => void;
}

export const DebtsView: React.FC<DebtsViewProps> = ({
  debts,
  onAddDebt,
  onUpdateDebt,
  onToggleStatus,
  onDeleteDebt,
}) => {
  const [typeFilter, setTypeFilter] = useState<'all' | 'receivable' | 'debt'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unpaid' | 'paid'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<DebtRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DebtRecord | null>(null);

  const [type, setType] = useState<'debt' | 'receivable'>('receivable');
  const [personName, setPersonName] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [date, setDate] = useState(toDateInputValue(new Date()));
  const [dueDate, setDueDate] = useState(toDateInputValue(new Date()));
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const todayStr = toDateInputValue(new Date());

  const summary = useMemo(() => {
    let unpaidReceivable = 0;
    let unpaidDebt = 0;
    let overdueCount = 0;

    for (const d of debts) {
      if (d.status === 'unpaid') {
        if (d.type === 'receivable') unpaidReceivable += d.amount;
        else unpaidDebt += d.amount;
        if (d.dueDate && d.dueDate < todayStr) overdueCount += 1;
      }
    }
    return { unpaidReceivable, unpaidDebt, overdueCount };
  }, [debts, todayStr]);

  const filtered = useMemo(() => {
    return debts
      .filter((d) => {
        if (typeFilter !== 'all' && d.type !== typeFilter) return false;
        if (statusFilter !== 'all' && d.status !== statusFilter) return false;
        return true;
      })
      .sort((a, b) => {
        if (a.status !== b.status) return a.status === 'unpaid' ? -1 : 1;
        return a.dueDate.localeCompare(b.dueDate);
      });
  }, [debts, typeFilter, statusFilter]);

  const openAdd = () => {
    setEditing(null);
    setType('receivable');
    setPersonName('');
    setAmountInput('');
    setDate(todayStr);
    setDueDate(todayStr);
    setNote('');
    setError('');
    setModalOpen(true);
  };

  const openEdit = (d: DebtRecord) => {
    setEditing(d);
    setType(d.type);
    setPersonName(d.personName);
    setAmountInput(String(d.amount));
    setDate(d.date);
    setDueDate(d.dueDate);
    setNote(d.note);
    setError('');
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!personName.trim()) {
      setError('Nama pihak / pelanggan / supplier wajib diisi.');
      return;
    }
    const parsedAmount = Number(amountInput);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError('Nominal harus berupa angka positif lebih dari 0.');
      return;
    }
    if (!date || !dueDate) {
      setError('Tanggal catat dan tanggal jatuh tempo wajib diisi.');
      return;
    }

    const payload: Omit<DebtRecord, 'id'> = {
      type,
      personName: personName.trim(),
      amount: Math.round(parsedAmount),
      date,
      dueDate,
      note: note.trim() || '-',
      status: editing ? editing.status : 'unpaid',
      paidAt: editing?.paidAt,
    };

    if (editing) {
      onUpdateDebt(editing.id, payload);
    } else {
      onAddDebt(payload);
    }
    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Total Piutang (Belum Lunas)
          </span>
          <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
            {formatRupiah(summary.unpaidReceivable)}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Tagihan yang harus diterima dari pihak lain
          </p>
        </div>

        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Total Hutang (Belum Lunas)
          </span>
          <p className="mt-2 text-2xl font-bold text-rose-600 dark:text-rose-400 tabular-nums">
            {formatRupiah(summary.unpaidDebt)}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Kewajiban yang harus dibayar ke supplier/pihak lain
          </p>
        </div>

        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Melewati Jatuh Tempo
          </span>
          <p
            className={`mt-2 text-2xl font-bold tabular-nums ${
              summary.overdueCount > 0
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-slate-900 dark:text-slate-100'
            }`}
          >
            {summary.overdueCount} Catatan
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Status belum lunas dengan tanggal tempo terlewat
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
            {(
              [
                { id: 'all', label: 'Semua' },
                { id: 'receivable', label: 'Piutang' },
                { id: 'debt', label: 'Hutang' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTypeFilter(t.id)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  typeFilter === t.id
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'unpaid' | 'paid')}
            className="px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200"
          >
            <option value="all">Semua Status</option>
            <option value="unpaid">Belum Lunas</option>
            <option value="paid">Sudah Lunas</option>
          </select>
        </div>

        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors whitespace-nowrap shrink-0 self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          Catat Hutang / Piutang
        </button>
      </div>

      {/* List */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-14 px-6 text-center">
            <HandCoins className="w-10 h-10 mx-auto text-slate-400 mb-3" />
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
              Belum ada catatan hutang atau piutang
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Catat daftar piutang pelanggan atau hutang supplier lengkap dengan tanggal jatuh tempo dan status pelunasan.
            </p>
            <button
              type="button"
              onClick={openAdd}
              className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Plus className="w-4 h-4" />
              Tambah Catatan
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map((item) => {
              const isOverdue = item.status === 'unpaid' && item.dueDate < todayStr;
              return (
                <div
                  key={item.id}
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span
                        className={`font-semibold ${
                          item.type === 'receivable'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {item.type === 'receivable' ? 'Piutang' : 'Hutang'}
                      </span>
                      <span className="text-slate-300 dark:text-slate-700">·</span>
                      <span className="text-slate-500 dark:text-slate-400 tabular-nums">
                        Dicatat {formatDateID(item.date)}
                      </span>
                      <span className="text-slate-300 dark:text-slate-700">·</span>
                      {item.status === 'paid' ? (
                        <span className="inline-flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Lunas{item.paidAt ? ` (${formatDateID(item.paidAt)})` : ''}
                        </span>
                      ) : isOverdue ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-rose-600 dark:text-rose-400">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Terlewat Tempo ({formatDateID(item.dueDate)})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-medium text-amber-600 dark:text-amber-400">
                          <Clock className="w-3.5 h-3.5" />
                          Jatuh Tempo {formatDateID(item.dueDate)}
                        </span>
                      )}
                    </div>

                    <h3
                      className={`text-base font-semibold truncate ${
                        item.status === 'paid'
                          ? 'text-slate-400 dark:text-slate-500 line-through'
                          : 'text-slate-900 dark:text-slate-100'
                      }`}
                    >
                      {item.personName}
                    </h3>
                    {item.note && item.note !== '-' && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {item.note}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between md:justify-end gap-4 shrink-0">
                    <span
                      className={`text-lg font-bold tabular-nums ${
                        item.status === 'paid'
                          ? 'text-slate-400 dark:text-slate-500'
                          : item.type === 'receivable'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {formatRupiah(item.amount)}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onToggleStatus(item.id)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap ${
                          item.status === 'paid'
                            ? 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                            : 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
                        }`}
                      >
                        {item.status === 'paid' ? 'Tandai Belum Lunas' : 'Tandai Lunas'}
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit(item)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
                        aria-label="Edit catatan"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(item)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                        aria-label="Hapus catatan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/55 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="debt-modal-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h2
                id="debt-modal-title"
                className="text-base font-semibold text-slate-900 dark:text-slate-100"
              >
                {editing ? 'Edit Catatan Hutang / Piutang' : 'Catat Hutang / Piutang'}
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
                  Jenis Catatan
                </label>
                <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
                  <button
                    type="button"
                    onClick={() => setType('receivable')}
                    className={`py-2 text-xs font-semibold rounded-lg transition-colors ${
                      type === 'receivable'
                        ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Piutang (Tagihan Masuk)
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('debt')}
                    className={`py-2 text-xs font-semibold rounded-lg transition-colors ${
                      type === 'debt'
                        ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Hutang (Kewajiban Bayar)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                  Nama Pihak / Kontak <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  placeholder="Contoh: Toko Sinar Abadi / Budi Santoso"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                  Jumlah (Rp) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  placeholder="Contoh: 750000"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                    Tanggal Catat <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                    Jatuh Tempo <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                  Catatan (Opsional)
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Contoh: Termin pelunasan faktur #102"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                />
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
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Hapus Catatan Hutang / Piutang"
        message={
          deleteTarget
            ? `Yakin ingin menghapus catatan ${
                deleteTarget.type === 'receivable' ? 'piutang' : 'hutang'
              } atas nama "${deleteTarget.personName}" senilai ${formatRupiah(
                deleteTarget.amount
              )}?`
            : ''
        }
        confirmLabel="Hapus Catatan"
        onConfirm={() => {
          if (deleteTarget) {
            onDeleteDebt(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
