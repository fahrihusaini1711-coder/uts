import { useCallback, useEffect, useMemo, useState } from 'react';
import { createSeedData } from '../data/seed';
import {
  Account,
  AppSettings,
  Budget,
  Category,
  DebtRecord,
  FinanceStoreData,
  Transaction,
} from '../types';
import { generateId, toDateInputValue } from '../utils/format';

const STORAGE_KEY = 'kasloka_finance_store_v1';

function loadInitialStore(): FinanceStoreData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<FinanceStoreData>;
      if (
        Array.isArray(parsed.accounts) &&
        Array.isArray(parsed.categories) &&
        Array.isArray(parsed.transactions) &&
        Array.isArray(parsed.budgets) &&
        Array.isArray(parsed.debts) &&
        parsed.settings
      ) {
        return parsed as FinanceStoreData;
      }
    }
  } catch {
    // Fallback to seed data if localStorage is corrupted or unavailable
  }
  return createSeedData();
}

export interface ComputedAccount extends Account {
  currentBalance: number;
  totalInflow: number;
  totalOutflow: number;
  transactionCount: number;
}

export function useFinanceStore() {
  const [data, setData] = useState<FinanceStoreData>(() => loadInitialStore());

  // Persist to localStorage whenever data changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Ignore quota errors gracefully
    }
  }, [data]);

  // Sync dark mode class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (data.settings.darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [data.settings.darkMode]);

  // Compute live account balances from initialBalance + transactions
  const computedAccounts: ComputedAccount[] = useMemo(() => {
    const map = new Map<
      string,
      { inflow: number; outflow: number; count: number }
    >();
    data.accounts.forEach((acc) => {
      map.set(acc.id, { inflow: 0, outflow: 0, count: 0 });
    });

    for (const tx of data.transactions) {
      const src = map.get(tx.accountId);
      if (tx.type === 'income') {
        if (src) {
          src.inflow += tx.amount;
          src.count += 1;
        }
      } else if (tx.type === 'expense') {
        if (src) {
          src.outflow += tx.amount;
          src.count += 1;
        }
      } else if (tx.type === 'transfer') {
        if (src) {
          src.outflow += tx.amount;
          src.count += 1;
        }
        if (tx.toAccountId) {
          const dst = map.get(tx.toAccountId);
          if (dst) {
            dst.inflow += tx.amount;
            dst.count += 1;
          }
        }
      }
    }

    return data.accounts.map((acc) => {
      const stats = map.get(acc.id) ?? { inflow: 0, outflow: 0, count: 0 };
      return {
        ...acc,
        totalInflow: stats.inflow,
        totalOutflow: stats.outflow,
        transactionCount: stats.count,
        currentBalance: acc.initialBalance + stats.inflow - stats.outflow,
      };
    });
  }, [data.accounts, data.transactions]);

  const totalBalance = useMemo(
    () => computedAccounts.reduce((sum, acc) => sum + acc.currentBalance, 0),
    [computedAccounts]
  );

  // Transactions CRUD
  const addTransaction = useCallback(
    (payload: Omit<Transaction, 'id' | 'createdAt'>) => {
      const newTx: Transaction = {
        ...payload,
        id: generateId('tx'),
        createdAt: new Date().toISOString(),
      };
      setData((prev) => ({
        ...prev,
        transactions: [newTx, ...prev.transactions],
      }));
    },
    []
  );

  const updateTransaction = useCallback(
    (id: string, payload: Omit<Transaction, 'id' | 'createdAt'>) => {
      setData((prev) => ({
        ...prev,
        transactions: prev.transactions.map((t) =>
          t.id === id ? { ...t, ...payload } : t
        ),
      }));
    },
    []
  );

  const deleteTransaction = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      transactions: prev.transactions.filter((t) => t.id !== id),
    }));
  }, []);

  // Accounts CRUD
  const addAccount = useCallback((payload: Omit<Account, 'id'>) => {
    const newAcc: Account = { ...payload, id: generateId('acc') };
    setData((prev) => ({
      ...prev,
      accounts: [...prev.accounts, newAcc],
    }));
  }, []);

  const updateAccount = useCallback(
    (id: string, payload: Omit<Account, 'id'>) => {
      setData((prev) => ({
        ...prev,
        accounts: prev.accounts.map((a) => (a.id === id ? { ...a, ...payload } : a)),
      }));
    },
    []
  );

  const deleteAccount = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      accounts: prev.accounts.filter((a) => a.id !== id),
    }));
  }, []);

  // Categories CRUD
  const addCategory = useCallback((payload: Omit<Category, 'id'>) => {
    const newCat: Category = { ...payload, id: generateId('cat') };
    setData((prev) => ({
      ...prev,
      categories: [...prev.categories, newCat],
    }));
  }, []);

  const updateCategory = useCallback(
    (id: string, payload: Omit<Category, 'id'>) => {
      setData((prev) => ({
        ...prev,
        categories: prev.categories.map((c) =>
          c.id === id ? { ...c, ...payload } : c
        ),
      }));
    },
    []
  );

  const deleteCategory = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      categories: prev.categories.filter((c) => c.id !== id),
      budgets: prev.budgets.filter((b) => b.categoryId !== id),
    }));
  }, []);

  // Budgets CRUD
  const upsertBudget = useCallback(
    (payload: { id?: string; categoryId: string; month: string; limit: number }) => {
      setData((prev) => {
        const existing = prev.budgets.find(
          (b) =>
            b.id === payload.id ||
            (b.categoryId === payload.categoryId && b.month === payload.month)
        );
        if (existing) {
          return {
            ...prev,
            budgets: prev.budgets.map((b) =>
              b.id === existing.id
                ? { ...b, categoryId: payload.categoryId, month: payload.month, limit: payload.limit }
                : b
            ),
          };
        }
        const newBudget: Budget = {
          id: generateId('bdg'),
          categoryId: payload.categoryId,
          month: payload.month,
          limit: payload.limit,
        };
        return {
          ...prev,
          budgets: [...prev.budgets, newBudget],
        };
      });
    },
    []
  );

  const deleteBudget = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      budgets: prev.budgets.filter((b) => b.id !== id),
    }));
  }, []);

  // Debts CRUD
  const addDebt = useCallback((payload: Omit<DebtRecord, 'id'>) => {
    const newDebt: DebtRecord = { ...payload, id: generateId('debt') };
    setData((prev) => ({
      ...prev,
      debts: [newDebt, ...prev.debts],
    }));
  }, []);

  const updateDebt = useCallback(
    (id: string, payload: Omit<DebtRecord, 'id'>) => {
      setData((prev) => ({
        ...prev,
        debts: prev.debts.map((d) => (d.id === id ? { ...d, ...payload } : d)),
      }));
    },
    []
  );

  const toggleDebtStatus = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      debts: prev.debts.map((d) => {
        if (d.id !== id) return d;
        const nextStatus = d.status === 'paid' ? 'unpaid' : 'paid';
        return {
          ...d,
          status: nextStatus,
          paidAt: nextStatus === 'paid' ? toDateInputValue(new Date()) : undefined,
        };
      }),
    }));
  }, []);

  const deleteDebt = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      debts: prev.debts.filter((d) => d.id !== id),
    }));
  }, []);

  // Settings & System Actions
  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setData((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...patch },
    }));
  }, []);

  const toggleDarkMode = useCallback(() => {
    setData((prev) => ({
      ...prev,
      settings: { ...prev.settings, darkMode: !prev.settings.darkMode },
    }));
  }, []);

  const resetToDemoData = useCallback(() => {
    setData((prev) => {
      const seed = createSeedData();
      return {
        ...seed,
        settings: {
          ...seed.settings,
          darkMode: prev.settings.darkMode,
        },
      };
    });
  }, []);

  const clearAllData = useCallback(() => {
    setData((prev) => ({
      accounts: [],
      categories: prev.categories, // keep default categories so user can start quickly, or empty transactions/accounts/budgets/debts
      transactions: [],
      budgets: [],
      debts: [],
      settings: prev.settings,
    }));
  }, []);

  const importFullData = useCallback((imported: FinanceStoreData) => {
    setData(imported);
  }, []);

  return {
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
  };
}
