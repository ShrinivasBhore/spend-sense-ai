export type TransactionType = 'expense' | 'income' | 'transfer';

export type Category = 'Food' | 'Transport' | 'Housing' | 'Utilities' | 'Entertainment' | 'Healthcare' | 'Shopping' | 'Salary' | 'Investment' | 'Transfer' | 'Other';

export const CATEGORIES: Category[] = [
  'Food', 'Transport', 'Housing', 'Utilities', 'Entertainment', 'Healthcare', 'Shopping', 'Salary', 'Investment', 'Transfer', 'Other'
];

export type PaymentMethod = 'Cash' | 'Credit Card' | 'Debit Card' | 'Bank Transfer';

export const PAYMENT_METHODS: PaymentMethod[] = [
  'Cash', 'Credit Card', 'Debit Card', 'Bank Transfer'
];

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: Category;
  date: string;
  description: string;
  paymentMethod: PaymentMethod;
}

export interface Budget {
  category: Category;
  limit: number;
}
