import React, { useState } from 'react';
import {
  ArrowLeftRight,
  FileBarChart,
  Gauge,
  HandCoins,
  LayoutDashboard,
  Menu,
  Moon,
  Plus,
  Settings,
  Sun,
  Tag,
  Wallet,
  X,
} from 'lucide-react';
import { AccountsView } from './components/AccountsView';
import { BudgetsView } from './components/BudgetsView';
import { CategoriesView } from './components/CategoriesView';
import { DashboardView } from './components/DashboardView';
import { DebtsView } from './components/DebtsView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { TransactionModal } from './components/TransactionModal';
import { TransactionsView } from './components/TransactionsView';
import { useFinanceStore } from './hooks/useFinanceStore';
import { NavSection, Transaction } from './types';

interface NavItem {
  id: NavSection;
  label: string;
  description: string;
  icon: React.FC<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    description: 'Ringkasan saldo, grafik tren, dan transaksi terbaru',
    icon: LayoutDashboard,
  },
  {
    id: 'transactions',
    label: 'Transaksi',
    description: 'Catat, cari, filter, dan kelola riwayat transaksi',
    icon: ArrowLeftRight,
  },
  {
    id: 'accounts',
    label: 'Akun',
    description: 'Kelola kas tunai, rekening bank, dan e-wallet',
    icon: Wallet,
  },
  {
    id: 'categories',
    label: 'Kategori',
    description: 'Atur kategori pemasukan dan pengeluaran',
    icon: Tag,
  },
  {
    id: 'budgets',
    label: 'Anggaran',
    description: 'Tetapkan batas belanja bulanan per kategori',
    icon: Gauge,
  },
  {
    id: 'reports',
    label: 'Laporan',
    description: 'Laporan laba rugi, arus kas, ekspor CSV & PDF',
    icon: FileBarChart,
  },
  {
    id: 'debts',
    label: 'Hutang & Piutang',
    description: 'Pantau tagihan jatuh tempo dan status pelunasan',
    icon: HandCoins,
  },
  {
    id: 'settings',
    label: 'Pengaturan',
    description: 'Profil usaha, tema tampilan, dan cadangan data',
    icon: Settings,
  },
];

export default function App() {
  const {
    data,
    computedAccounts,
    totalBalance,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addAccount,
    updateAccount,
    deleteAccount,
    addCategory,
    updateCategory,
    deleteCategory,
    upsertBudget,
    deleteBudget,
    addDebt,
    updateDebt,
    toggleDebtStatus,
    deleteDebt,
    updateSettings,
    toggleDarkMode,
    resetToDemoData,
    clearAllData,
    importFullData,
  } = useFinanceStore();

  const [activeNav, setActiveNav] = useState<NavSection>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [txModalOpen, setTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  const currentNavMeta =
    NAV_ITEMS.find((n) => n.id === activeNav) ?? NAV_ITEMS[0];

  const handleOpenAddTx = () => {
    setEditingTx(null);
    setTxModalOpen(true);
  };

  const handleOpenEditTx = (tx: Transaction) => {
    setEditingTx(tx);
    setTxModalOpen(true);
  };

  const handleSaveTx = (
    payload: Omit<Transaction, 'id' | 'createdAt'>,
    existingId?: string
  ) => {
    if (existingId) {
      updateTransaction(existingId, payload);
    } else {
      addTransaction(payload);
    }
  };

  const handleSelectNav = (id: NavSection) => {
    setActiveNav(id);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Desktop Sidebar */}
      <aside className="no-print hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
        {/* Brand */}
        <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
            K
          </div>
          <div className="min-w-0">
            <span className="block text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100 truncate">
              KasLoka
            </span>
            <span className="block text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {data.settings.businessName}
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Navigasi utama">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectNav(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Bottom Profile Mode Info */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Mode Profil</span>
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {data.settings.mode === 'umkm' ? 'UMKM / Toko' : 'Pribadi'}
            </span>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="no-print fixed inset-0 z-40 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative w-72 max-w-[80vw] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col z-50">
            <div className="h-16 px-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                  K
                </div>
                <div className="min-w-0">
                  <span className="block text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                    KasLoka
                  </span>
                  <span className="block text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {data.settings.businessName}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                aria-label="Tutup menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeNav === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectNav(item.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="no-print sticky top-0 z-30 h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Buka menu navigasi"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 truncate">
                {currentNavMeta.label}
              </h1>
              <p className="hidden sm:block text-xs text-slate-500 dark:text-slate-400 truncate">
                {currentNavMeta.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={toggleDarkMode}
              title={data.settings.darkMode ? 'Aktifkan Mode Terang' : 'Aktifkan Mode Gelap'}
              aria-label={data.settings.darkMode ? 'Aktifkan Mode Terang' : 'Aktifkan Mode Gelap'}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {data.settings.darkMode ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>

            <button
              type="button"
              onClick={handleOpenAddTx}
              className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Tambah Transaksi</span>
              <span className="sm:hidden">Transaksi</span>
            </button>
          </div>
        </header>

        {/* Active View Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto">
          {activeNav === 'dashboard' && (
            <DashboardView
              totalBalance={totalBalance}
              accounts={computedAccounts}
              categories={data.categories}
              transactions={data.transactions}
              budgets={data.budgets}
              onAddTransaction={handleOpenAddTx}
              onNavigate={setActiveNav}
            />
          )}

          {activeNav === 'transactions' && (
            <TransactionsView
              transactions={data.transactions}
              accounts={data.accounts}
              categories={data.categories}
              onAddTransaction={handleOpenAddTx}
              onEditTransaction={handleOpenEditTx}
              onDeleteTransaction={deleteTransaction}
            />
          )}

          {activeNav === 'accounts' && (
            <AccountsView
              accounts={computedAccounts}
              totalBalance={totalBalance}
              onAddAccount={addAccount}
              onUpdateAccount={updateAccount}
              onDeleteAccount={deleteAccount}
            />
          )}

          {activeNav === 'categories' && (
            <CategoriesView
              categories={data.categories}
              transactions={data.transactions}
              onAddCategory={addCategory}
              onUpdateCategory={updateCategory}
              onDeleteCategory={deleteCategory}
            />
          )}

          {activeNav === 'budgets' && (
            <BudgetsView
              budgets={data.budgets}
              categories={data.categories}
              transactions={data.transactions}
              onUpsertBudget={upsertBudget}
              onDeleteBudget={deleteBudget}
            />
          )}

          {activeNav === 'reports' && (
            <ReportsView
              businessName={data.settings.businessName}
              accounts={data.accounts}
              categories={data.categories}
              transactions={data.transactions}
            />
          )}

          {activeNav === 'debts' && (
            <DebtsView
              debts={data.debts}
              onAddDebt={addDebt}
              onUpdateDebt={updateDebt}
              onToggleStatus={toggleDebtStatus}
              onDeleteDebt={deleteDebt}
            />
          )}

          {activeNav === 'settings' && (
            <SettingsView
              data={data}
              onUpdateSettings={updateSettings}
              onResetToDemo={resetToDemoData}
              onClearAllData={clearAllData}
              onImportData={importFullData}
            />
          )}
        </main>
      </div>

      {/* Global Add/Edit Transaction Modal */}
      <TransactionModal
        isOpen={txModalOpen}
        editingTransaction={editingTx}
        accounts={data.accounts}
        categories={data.categories}
        onSave={handleSaveTx}
        onClose={() => {
          setTxModalOpen(false);
          setEditingTx(null);
        }}
      />
    </div>
  );
}
