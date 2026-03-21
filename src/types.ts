export type Category = 'Food' | 'Transport' | 'Housing' | 'Utilities' | 'Entertainment' | 'Healthcare' | 'Shopping' | 'Other';

export const CATEGORIES: Category[] = [
  'Food', 'Transport', 'Housing', 'Utilities', 'Entertainment', 'Healthcare', 'Shopping', 'Other'
];

export interface Expense {
  id: string;
  amount: number;
  category: Category;
  date: string;
  description: string;
}

export interface Budget {
  category: Category;
  limit: number;
}
