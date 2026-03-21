import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Expense, Budget, Category, CATEGORIES } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface ExpenseContextType {
  expenses: Expense[];
  currentMonthExpenses: Expense[];
  budgets: Budget[];
  currentMonth: string;
  setCurrentMonth: (month: string) => void;
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  editExpense: (id: string, expense: Omit<Expense, 'id'>) => void;
  deleteExpense: (id: string) => void;
  setBudget: (category: Category, limit: number) => void;
  importExpenses: (newExpenses: Expense[]) => void;
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

export const ExpenseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('expenses');
    return saved ? JSON.parse(saved) : [];
  });

  const [budgets, setBudgets] = useState<Budget[]>(() => {
    const saved = localStorage.getItem('budgets');
    return saved ? JSON.parse(saved) : CATEGORIES.map(c => ({ category: c, limit: 0 }));
  });

  const [currentMonth, setCurrentMonth] = useState(() => new Date().toISOString().slice(0, 7));

  useEffect(() => {
    localStorage.setItem('expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('budgets', JSON.stringify(budgets));
  }, [budgets]);

  const currentMonthExpenses = useMemo(() => {
    return expenses.filter(e => e.date.startsWith(currentMonth));
  }, [expenses, currentMonth]);

  const addExpense = (expense: Omit<Expense, 'id'>) => {
    setExpenses(prev => [...prev, { ...expense, id: uuidv4() }]);
  };

  const editExpense = (id: string, updatedExpense: Omit<Expense, 'id'>) => {
    setExpenses(prev => prev.map(e => e.id === id ? { ...updatedExpense, id } : e));
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
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

  const importExpenses = (newExpenses: Expense[]) => {
    setExpenses(prev => {
      const existingIds = new Set(prev.map(e => e.id));
      const toAdd = newExpenses.filter(e => !existingIds.has(e.id));
      return [...prev, ...toAdd];
    });
  };

  return (
    <ExpenseContext.Provider value={{
      expenses, currentMonthExpenses, budgets, currentMonth, setCurrentMonth,
      addExpense, editExpense, deleteExpense, setBudget, importExpenses
    }}>
      {children}
    </ExpenseContext.Provider>
  );
};

export const useExpenses = () => {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error('useExpenses must be used within an ExpenseProvider');
  }
  return context;
};
