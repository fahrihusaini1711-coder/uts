export type TransactionType = 'income' | 'expense' | 'transfer';

export type AccountType = 'cash' | 'bank' | 'ewallet';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  initialBalance: number;
  color: string;
  notes?: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  date: string; // YYYY-MM-DD
  amount: number;
  categoryId?: string;
  accountId: string;
  toAccountId?: string;
  note: string;
  receiptImage?: string;
  receiptName?: string;
  createdAt: string;
}

export interface Budget {
  id: string;
  categoryId: string;
  month: string; // YYYY-MM
  limit: number;
}

export interface DebtRecord {
  id: string;
  type: 'debt' | 'receivable'; // debt = hutang kita, receivable = piutang (orang berhutang ke kita)
  personName: string;
  amount: number;
  date: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  note: string;
  status: 'unpaid' | 'paid';
  paidAt?: string;
}

export interface AppSettings {
  businessName: string;
  mode: 'umkm' | 'personal';
  darkMode: boolean;
}

export type NavSection =
  | 'dashboard'
  | 'transactions'
  | 'accounts'
  | 'categories'
  | 'budgets'
  | 'reports'
  | 'debts'
  | 'settings';

export interface FinanceStoreData {
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  debts: DebtRecord[];
  settings: AppSettings;
}
