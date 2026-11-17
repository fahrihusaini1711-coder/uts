import React, { useState } from 'react';
import {
  Banknote,
  Building2,
  Edit2,
  Plus,
  Smartphone,
  Trash2,
  Wallet,
  X,
} from 'lucide-react';
import { Account, AccountType } from '../types';
import { ComputedAccount } from '../hooks/useFinanceStore';
import { formatRupiah } from '../utils/format';
import { CATEGORY_COLOR_OPTIONS } from '../utils/icons';
import { ConfirmModal } from './ConfirmModal';

interface AccountsViewProps {
  accounts: ComputedAccount[];
  totalBalance: number;
  onAddAccount: (payload: Omit<Account, 'id'>) => void;
  onUpdateAccount: (id: string, payload: Omit<Account, 'id'>) => void;
  onDeleteAccount: (id: string) => void;
}

export const AccountsView: React.FC<AccountsViewProps> = ({
  accounts,
  totalBalance,
  onAddAccount,
  onUpdateAccount,
  onDeleteAccount,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ComputedAccount | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ComputedAccount | null>(null);

  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('bank');
  const [initialBalance, setInitialBalance] = useState('0');
  const [color, setColor] = useState('#059669');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const openAdd = () => {
    setEditing(null);
    setName('');
    setType('bank');
    setInitialBalance('0');
    setColor('#059669');
    setNotes('');
    setError('');
    setModalOpen(true);
  };

  const openEdit = (acc: ComputedAccount) => {
    setEditing(acc);
    setName(acc.name);
    setType(acc.type);
    setInitialBalance(String(acc.initialBalance));
    setColor(acc.color);
    setNotes(acc.notes ?? '');
    setError('');
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmed = name.trim();
    if (!trimmed) {
      setError('Nama akun atau dompet wajib diisi.');
      return;
    }

    const parsedBal = Number(initialBalance);
    if (!Number.isFinite(parsedBal) || parsedBal < 0) {
      setError('Saldo awal harus berupa angka valid (minimal 0).');
      return;
    }

    const payload: Omit<Account, 'id'> = {
      name: trimmed,
      type,
      initialBalance: Math.round(parsedBal),
      color,
      notes: notes.trim() || undefined,
    };

    if (editing) {
      onUpdateAccount(editing.id, payload);
    } else {
      onAddAccount(payload);
    }
    setModalOpen(false);
  };

  const renderTypeIcon = (t: AccountType) => {
    if (t === 'cash') return <Banknote className="w-5 h-5" />;
    if (t === 'ewallet') return <Smartphone className="w-5 h-5" />;
    return <Building2 className="w-5 h-5" />;
  };

  const getTypeLabel = (t: AccountType) => {
    if (t === 'cash') return 'Kas Tunai';
    if (t === 'ewallet') return 'E-Wallet / QRIS';
    return 'Rekening Bank';
  };

  return (
    <div className="space-y-6">
      {/* Header Summary Bar */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Total Saldo Seluruh Akun ({accounts.length} dompet)
          </span>
          <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums">
            {formatRupiah(totalBalance)}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Saldo akhir terhitung otomatis dari saldo awal ditambah pemasukan, dikurangi pengeluaran & transfer.
          </p>
        </div>

        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors whitespace-nowrap shrink-0 self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          Tambah Akun / Dompet
        </button>
      </div>

      {/* Accounts Grid */}
      {accounts.length === 0 ? (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 py-14 px-6 text-center">
          <Wallet className="w-10 h-10 mx-auto text-slate-400 mb-3" />
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
            Belum ada akun atau dompet
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Tambahkan akun seperti Kas Tunai, Bank BCA, atau E-Wallet agar setiap transaksi terlacak rapi.
          </p>
          <button
            type="button"
            onClick={openAdd}
            className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
          >
            <Plus className="w-4 h-4" />
            Buat Akun Pertama
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {accounts.map((acc) => (
            <div
              key={acc.id}
              className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: `${acc.color}1A`,
                        color: acc.color,
                      }}
                    >
                      {renderTypeIcon(acc.type)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {acc.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {getTypeLabel(acc.type)} · {acc.transactionCount} transaksi
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEdit(acc)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      aria-label={`Edit ${acc.name}`}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(acc)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                      aria-label={`Hapus ${acc.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-5">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Saldo Saat Ini
                  </span>
                  <p
                    className={`mt-1 text-2xl font-bold tracking-tight tabular-nums ${
                      acc.currentBalance >= 0
                        ? 'text-slate-900 dark:text-slate-100'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {formatRupiah(acc.currentBalance)}
                  </p>
                  {acc.notes && (
                    <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                      {acc.notes}
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2 text-xs tabular-nums">
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block">Saldo Awal</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {formatRupiah(acc.initialBalance)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block">Dana Masuk</span>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">
                    +{formatRupiah(acc.totalInflow)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block">Dana Keluar</span>
                  <span className="font-medium text-rose-600 dark:text-rose-400">
                    -{formatRupiah(acc.totalOutflow)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Account Form Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/55 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="account-modal-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h2
                id="account-modal-title"
                className="text-base font-semibold text-slate-900 dark:text-slate-100"
              >
                {editing ? 'Edit Akun / Dompet' : 'Tambah Akun / Dompet'}
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
                  Nama Akun <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Bank BCA, Kas Tunai, OVO"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                    Jenis Akun
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as AccountType)}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  >
                    <option value="cash">Kas Tunai</option>
                    <option value="bank">Rekening Bank</option>
                    <option value="ewallet">E-Wallet / QRIS</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                    Saldo Awal (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={initialBalance}
                    onChange={(e) => setInitialBalance(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                  Warna Label
                </label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_COLOR_OPTIONS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-lg transition-transform ${
                        color === c ? 'ring-2 ring-offset-2 ring-slate-900 dark:ring-white scale-110' : ''
                      }`}
                      style={{ backgroundColor: c }}
                      aria-label={`Pilih warna ${c}`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                  Catatan (Opsional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Rekening khusus operasional toko"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
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
                  {editing ? 'Simpan' : 'Tambah Akun'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Hapus Akun / Dompet"
        message={
          deleteTarget
            ? deleteTarget.transactionCount > 0
              ? `Akun "${deleteTarget.name}" memiliki ${deleteTarget.transactionCount} transaksi terkait. Menghapus akun ini tidak menghapus riwayat transaksi, namun nama akun tidak lagi tampil pada transaksi tersebut. Lanjutkan?`
              : `Yakin ingin menghapus akun "${deleteTarget.name}"?`
            : ''
        }
        confirmLabel="Hapus Akun"
        onConfirm={() => {
          if (deleteTarget) {
            onDeleteAccount(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
