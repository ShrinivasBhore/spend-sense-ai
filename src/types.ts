export type TransactionType = 'expense' | 'income' | 'transfer';

export type Category = 'Food' | 'Transport' | 'Housing' | 'Utilities' | 'Entertainment' | 'Healthcare' | 'Shopping' | 'Salary' | 'Investment' | 'Transfer' | 'Other';

export const CATEGORIES: Category[] = [
  'Food', 'Transport', 'Housing', 'Utilities', 'Entertainment', 'Healthcare', 'Shopping', 'Salary', 'Investment', 'Transfer', 'Other'
];

export type PaymentMethod = 'Cash' | 'Credit Card' | 'Debit Card' | 'Bank Transfer';

export const PAYMENT_METHODS: PaymentMethod[] = [
  'Cash', 'Credit Card', 'Debit Card', 'Bank Transfer'
];

export type AccountType = 'Cash' | 'Bank' | 'Digital Wallet' | 'Credit Card';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  initialBalance: number;
}

export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RecurringTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: Category;
  description: string;
  paymentMethod: PaymentMethod;
  accountId?: string;
  toAccountId?: string;
  frequency: RecurrenceFrequency;
  startDate: string;
  nextDate: string;
  active: boolean;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: Category;
  date: string;
  description: string;
  paymentMethod: PaymentMethod;
  accountId?: string;
  toAccountId?: string;
}

export interface Budget {
  category: Category;
  limit: number;
}
