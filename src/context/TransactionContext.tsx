import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Transaction, Budget, Category, CATEGORIES } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface TransactionContextType {
  transactions: Transaction[];
  currentMonthTransactions: Transaction[];
  budgets: Budget[];
  currentMonth: string;
  setCurrentMonth: (month: string) => void;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  editTransaction: (id: string, transaction: Omit<Transaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;
  setBudget: (category: Category, limit: number) => void;
  importTransactions: (newTransactions: Transaction[]) => void;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export const TransactionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('transactions') || localStorage.getItem('expenses');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migrate old expenses to transactions
      return parsed.map((item: any) => ({
        ...item,
        type: item.type || 'expense'
      }));
    }
    return [];
  });

  const [budgets, setBudgets] = useState<Budget[]>(() => {
    const saved = localStorage.getItem('budgets');
    return saved ? JSON.parse(saved) : CATEGORIES.map(c => ({ category: c, limit: 0 }));
  });

  const [currentMonth, setCurrentMonth] = useState(() => new Date().toISOString().slice(0, 7));

  useEffect(() => {
    localStorage.setItem('transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('budgets', JSON.stringify(budgets));
  }, [budgets]);

  const currentMonthTransactions = useMemo(() => {
    return transactions.filter(t => t.date.startsWith(currentMonth));
  }, [transactions, currentMonth]);

  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    setTransactions(prev => [...prev, { ...transaction, id: uuidv4() }]);
  };

  const editTransaction = (id: string, updatedTransaction: Omit<Transaction, 'id'>) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...updatedTransaction, id } : t));
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const setBudget = (category: Category, limit: number) => {
    setBudgets(prev => {
      const existing = prev.find(b => b.category === category);
      if (existing) {
        return prev.map(b => b.category === category ? { ...b, limit } : b);
      }
      return [...prev, { category, limit }];
    });
  };

  const importTransactions = (newTransactions: Transaction[]) => {
    setTransactions(prev => {
      const existingIds = new Set(prev.map(t => t.id));
      const toAdd = newTransactions.filter(t => !existingIds.has(t.id));
      return [...prev, ...toAdd];
    });
  };

  return (
    <TransactionContext.Provider value={{
      transactions, currentMonthTransactions, budgets, currentMonth, setCurrentMonth,
      addTransaction, editTransaction, deleteTransaction, setBudget, importTransactions
    }}>
      {children}
    </TransactionContext.Provider>
  );
};

export const useTransactions = () => {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
};
