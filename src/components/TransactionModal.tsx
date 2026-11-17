import React, { useEffect, useState } from 'react';
import { ArrowRightLeft, ImagePlus, Trash2, X } from 'lucide-react';
import { Account, Category, Transaction, TransactionType } from '../types';
import { formatRupiah, toDateInputValue } from '../utils/format';

interface TransactionModalProps {
  isOpen: boolean;
  editingTransaction: Transaction | null;
  accounts: Account[];
  categories: Category[];
  onSave: (payload: Omit<Transaction, 'id' | 'createdAt'>, existingId?: string) => void;
  onClose: () => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  editingTransaction,
  accounts,
  categories,
  onSave,
  onClose,
}) => {
  const [type, setType] = useState<TransactionType>('expense');
  const [date, setDate] = useState<string>(toDateInputValue(new Date()));
  const [amountInput, setAmountInput] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [accountId, setAccountId] = useState<string>('');
  const [toAccountId, setToAccountId] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [receiptImage, setReceiptImage] = useState<string | undefined>(undefined);
  const [receiptName, setReceiptName] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;
    setError('');

    if (editingTransaction) {
      setType(editingTransaction.type);
      setDate(editingTransaction.date);
      setAmountInput(String(editingTransaction.amount));
      setCategoryId(editingTransaction.categoryId ?? '');
      setAccountId(editingTransaction.accountId);
      setToAccountId(editingTransaction.toAccountId ?? '');
      setNote(editingTransaction.note);
      setReceiptImage(editingTransaction.receiptImage);
      setReceiptName(editingTransaction.receiptName);
    } else {
      const defaultType: TransactionType = 'expense';
      const filteredCats = categories.filter((c) => c.type === defaultType);
      setType(defaultType);
      setDate(toDateInputValue(new Date()));
      setAmountInput('');
      setCategoryId(filteredCats[0]?.id ?? '');
      setAccountId(accounts[0]?.id ?? '');
      setToAccountId(accounts[1]?.id ?? accounts[0]?.id ?? '');
      setNote('');
      setReceiptImage(undefined);
      setReceiptName(undefined);
    }
  }, [isOpen, editingTransaction, accounts, categories]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredCategories = categories.filter(
    (c) => c.type === (type === 'income' ? 'income' : 'expense')
  );

  const handleTypeChange = (nextType: TransactionType) => {
    setType(nextType);
    setError('');
    if (nextType !== 'transfer') {
      const validCat = categories.find((c) => c.id === categoryId && c.type === nextType);
      if (!validCat) {
        const firstMatch = categories.find((c) => c.type === nextType);
        setCategoryId(firstMatch?.id ?? '');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1_500_000) {
      setError('Ukuran lampiran struk maksimal 1,5 MB agar penyimpanan lokal tetap optimal.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setReceiptImage(reader.result);
        setReceiptName(file.name);
        setError('');
      }
    };
    reader.readAsDataURL(file);
  };

  const numericAmount = Number(amountInput.replace(/[^\d.]/g, ''));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (accounts.length === 0) {
      setError('Tambahkan minimal 1 akun/dompet terlebih dahulu sebelum mencatat transaksi.');
      return;
    }
    if (!date) {
      setError('Tanggal transaksi wajib diisi.');
      return;
    }
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError('Jumlah nominal harus berupa angka positif lebih dari 0.');
      return;
    }
    if (!accountId) {
      setError('Pilih akun atau dompet sumber transaksi.');
      return;
    }

    if (type === 'transfer') {
      if (accounts.length < 2) {
        setError('Transfer antar akun membutuhkan minimal 2 akun yang berbeda.');
        return;
      }
      if (!toAccountId) {
        setError('Pilih akun tujuan transfer.');
        return;
      }
      if (accountId === toAccountId) {
        setError('Akun asal dan akun tujuan transfer tidak boleh sama.');
        return;
      }
    } else {
      if (!categoryId) {
        setError('Pilih kategori transaksi terlebih dahulu.');
        return;
      }
    }

    onSave(
      {
        type,
        date,
        amount: Math.round(numericAmount),
        categoryId: type === 'transfer' ? undefined : categoryId,
        accountId,
        toAccountId: type === 'transfer' ? toAccountId : undefined,
        note: note.trim() || (type === 'transfer' ? 'Transfer antar akun' : 'Transaksi keuangan'),
        receiptImage,
        receiptName,
      },
      editingTransaction?.id
    );
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/55 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tx-modal-title"
    >
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2 id="tx-modal-title" className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {editingTransaction ? 'Edit Transaksi' : 'Tambah Transaksi Baru'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Tutup form transaksi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Type Switcher */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
              Jenis Transaksi
            </label>
            <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80">
              <button
                type="button"
                onClick={() => handleTypeChange('expense')}
                className={`py-2 px-3 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  type === 'expense'
                    ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Pengeluaran
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('income')}
                className={`py-2 px-3 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  type === 'income'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Pemasukan
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('transfer')}
                className={`py-2 px-3 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  type === 'transfer'
                    ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Transfer
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Date */}
            <div>
              <label
                htmlFor="tx-date"
                className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5"
              >
                Tanggal <span className="text-rose-500">*</span>
              </label>
              <input
                id="tx-date"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              />
            </div>

            {/* Amount */}
            <div>
              <label
                htmlFor="tx-amount"
                className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5"
              >
                Jumlah (Rp) <span className="text-rose-500">*</span>
              </label>
              <input
                id="tx-amount"
                type="number"
                min="1"
                step="1"
                placeholder="Contoh: 250000"
                required
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              />
              {numericAmount > 0 && (
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                  Preview: {formatRupiah(numericAmount)}
                </p>
              )}
            </div>
          </div>

          {/* Account(s) & Category */}
          {type === 'transfer' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
              <div>
                <label
                  htmlFor="tx-from-acc"
                  className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5"
                >
                  Dari Akun <span className="text-rose-500">*</span>
                </label>
                <select
                  id="tx-from-acc"
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
                >
                  {accounts.length === 0 && <option value="">Belum ada akun</option>}
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="tx-to-acc"
                  className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5 text-sky-500" />
                  Ke Akun Tujuan <span className="text-rose-500">*</span>
                </label>
                <select
                  id="tx-to-acc"
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
                >
                  {accounts.length === 0 && <option value="">Belum ada akun</option>}
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="tx-category"
                  className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5"
                >
                  Kategori <span className="text-rose-500">*</span>
                </label>
                <select
                  id="tx-category"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                >
                  {filteredCategories.length === 0 && (
                    <option value="">Tidak ada kategori</option>
                  )}
                  {filteredCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="tx-account"
                  className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5"
                >
                  Akun / Dompet <span className="text-rose-500">*</span>
                </label>
                <select
                  id="tx-account"
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                >
                  {accounts.length === 0 && <option value="">Belum ada akun</option>}
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Note */}
          <div>
            <label
              htmlFor="tx-note"
              className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5"
            >
              Catatan / Keterangan
            </label>
            <input
              id="tx-note"
              type="text"
              placeholder="Contoh: Pembelian stok kemasan kardus"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
            />
          </div>

          {/* Optional Receipt Attachment */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
              Lampiran Struk (Opsional)
            </label>
            {receiptImage ? (
              <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950">
                <div className="flex items-center gap-3 min-w-0">
                  {receiptImage.startsWith('data:image/') && (
                    <img
                      src={receiptImage}
                      alt="Pratinjau struk"
                      className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                    />
                  )}
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                    {receiptName || 'struk-lampiran'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setReceiptImage(undefined);
                    setReceiptName(undefined);
                  }}
                  className="p-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors shrink-0"
                  aria-label="Hapus lampiran struk"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer transition-colors">
                <ImagePlus className="w-4 h-4" />
                <span>Unggah foto struk / bukti transfer (Maks 1,5 MB)</span>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  className="sr-only"
                />
              </label>
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
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
            >
              {editingTransaction ? 'Simpan Perubahan' : 'Simpan Transaksi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
