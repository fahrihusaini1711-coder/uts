import React, { useState } from 'react';
import {
  Check,
  Download,
  Moon,
  RotateCcw,
  Sun,
  Trash2,
  Upload,
} from 'lucide-react';
import { AppSettings, FinanceStoreData } from '../types';
import { ConfirmModal } from './ConfirmModal';

interface SettingsViewProps {
  data: FinanceStoreData;
  onUpdateSettings: (patch: Partial<AppSettings>) => void;
  onResetToDemo: () => void;
  onClearAllData: () => void;
  onImportData: (imported: FinanceStoreData) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  data,
  onUpdateSettings,
  onResetToDemo,
  onClearAllData,
  onImportData,
}) => {
  const [businessName, setBusinessName] = useState(data.settings.businessName);
  const [mode, setMode] = useState<'umkm' | 'personal'>(data.settings.mode);
  const [savedNotice, setSavedNotice] = useState(false);
  const [importFeedback, setImportFeedback] = useState<string>('');
  const [confirmAction, setConfirmAction] = useState<'reset' | 'clear' | null>(null);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      businessName: businessName.trim() || 'KasLoka Keuangan',
      mode,
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const handleExportJSON = () => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-kasloka-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as FinanceStoreData;
        if (
          !Array.isArray(parsed.accounts) ||
          !Array.isArray(parsed.categories) ||
          !Array.isArray(parsed.transactions)
        ) {
          setImportFeedback('Format berkas JSON tidak valid.');
          return;
        }
        onImportData({
          accounts: parsed.accounts,
          categories: parsed.categories,
          transactions: parsed.transactions,
          budgets: Array.isArray(parsed.budgets) ? parsed.budgets : [],
          debts: Array.isArray(parsed.debts) ? parsed.debts : [],
          settings: parsed.settings ?? data.settings,
        });
        setImportFeedback('Data cadangan berhasil dipulihkan.');
      } catch {
        setImportFeedback('Gagal membaca berkas JSON. Pastikan file tidak rusak.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="max-w-3xl space-y-6">
      {/* Profil Keuangan */}
      <form
        onSubmit={handleSaveProfile}
        className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-5"
      >
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Profil Usaha / Pribadi
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Informasi ini ditampilkan pada judul ruang kerja dan laporan cetak PDF.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
              Nama Usaha / Pemilik
            </label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Contoh: Toko Nusantara"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
              Jenis Penggunaan
            </label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as 'umkm' | 'personal')}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            >
              <option value="umkm">UMKM / Toko / Bisnis</option>
              <option value="personal">Keuangan Pribadi / Keluarga</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            {savedNotice && (
              <span className="inline-flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                Pengaturan profil disimpan.
              </span>
            )}
          </div>
          <button
            type="submit"
            className="px-5 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
          >
            Simpan Profil
          </button>
        </div>
      </form>

      {/* Tampilan Tema */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Tema Tampilan
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Pilih mode terang atau gelap sesuai kenyamanan mata Anda.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 self-start sm:self-center">
          <button
            type="button"
            onClick={() => onUpdateSettings({ darkMode: false })}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              !data.settings.darkMode
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            Terang
          </button>
          <button
            type="button"
            onClick={() => onUpdateSettings({ darkMode: true })}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              data.settings.darkMode
                ? 'bg-slate-900 text-slate-100 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
            Gelap
          </button>
        </div>
      </div>

      {/* Manajemen Data & Backup */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-5">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Cadangan & Pengelolaan Data Lokal
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Semua data tersimpan aman di peramban Anda (localStorage). Gunakan fitur ekspor untuk menyimpan salinan berkala.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleExportJSON}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Download className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            Ekspor Backup (JSON)
          </button>

          <label className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer">
            <Upload className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Impor Backup (JSON)
            <input
              type="file"
              accept="application/json,.json"
              onChange={handleImportJSON}
              className="sr-only"
            />
          </label>
        </div>

        {importFeedback && (
          <p className="text-xs font-medium text-sky-600 dark:text-sky-400">
            {importFeedback}
          </p>
        )}

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setConfirmAction('reset')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Muat Ulang Data Contoh (Demo)
          </button>

          <button
            type="button"
            onClick={() => setConfirmAction('clear')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl border border-rose-200 dark:border-rose-900/70 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Kosongkan Semua Data
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmAction !== null}
        title={
          confirmAction === 'reset'
            ? 'Muat Ulang Data Contoh?'
            : 'Kosongkan Semua Data?'
        }
        message={
          confirmAction === 'reset'
            ? 'Tindakan ini akan mengganti seluruh akun, transaksi, anggaran, dan catatan hutang saat ini dengan data contoh bawaan.'
            : 'Seluruh transaksi, akun dompet, anggaran, dan hutang/piutang akan dihapus permanen agar Anda dapat memulai dari nol.'
        }
        confirmLabel={confirmAction === 'reset' ? 'Muat Data Contoh' : 'Hapus Semua Data'}
        variant={confirmAction === 'reset' ? 'warning' : 'danger'}
        onConfirm={() => {
          if (confirmAction === 'reset') onResetToDemo();
          else if (confirmAction === 'clear') onClearAllData();
          setConfirmAction(null);
        }}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
};
