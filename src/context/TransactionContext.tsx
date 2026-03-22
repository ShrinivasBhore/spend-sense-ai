import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Transaction, Budget, Category, CATEGORIES, Account, RecurringTransaction, RecurrenceFrequency } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { addDays, addWeeks, addMonths, addYears, parseISO, format } from 'date-fns';

interface TransactionContextType {
  transactions: Transaction[];
  currentMonthTransactions: Transaction[];
  budgets: Budget[];
  accounts: Account[];
  currentMonth: string;
  setCurrentMonth: (month: string) => void;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  editTransaction: (id: string, transaction: Omit<Transaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;
  setBudget: (category: Category, limit: number) => void;
  importTransactions: (newTransactions: Transaction[]) => void;
  addAccount: (account: Omit<Account, 'id'>) => void;
  editAccount: (id: string, account: Omit<Account, 'id'>) => void;
  deleteAccount: (id: string) => void;
  getAccountBalance: (accountId: string) => number;
  recurringTransactions: RecurringTransaction[];
  addRecurringTransaction: (rt: Omit<RecurringTransaction, 'id'>) => void;
  deleteRecurringTransaction: (id: string) => void;
  toggleRecurringTransaction: (id: string) => void;
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

  const [accounts, setAccounts] = useState<Account[]>(() => {
    const saved = localStorage.getItem('accounts');
    return saved ? JSON.parse(saved) : [
      { id: 'cash-1', name: 'Cash Wallet', type: 'Cash', initialBalance: 0 }
    ];
  });

  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>(() => {
    const saved = localStorage.getItem('recurringTransactions');
    return saved ? JSON.parse(saved) : [];
  });

  const [currentMonth, setCurrentMonth] = useState(() => new Date().toISOString().slice(0, 7));

  useEffect(() => {
    localStorage.setItem('transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('budgets', JSON.stringify(budgets));
  }, [budgets]);

  useEffect(() => {
    localStorage.setItem('accounts', JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem('recurringTransactions', JSON.stringify(recurringTransactions));
  }, [recurringTransactions]);

  // Recurring Transaction Engine
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    let hasUpdates = false;

    setRecurringTransactions(prevRecurring => {
      let updatedRecurring = [...prevRecurring];
      let newTxToAdd: Transaction[] = [];

      updatedRecurring = updatedRecurring.map(rt => {
        if (!rt.active) return rt;
        let currentNextDate = rt.nextDate;
        let modified = false;

        while (currentNextDate <= today) {
          newTxToAdd.push({
            id: uuidv4(),
            type: rt.type,
            amount: rt.amount,
            category: rt.category,
            date: currentNextDate,
            description: rt.description,
            paymentMethod: rt.paymentMethod,
            accountId: rt.accountId,
            toAccountId: rt.toAccountId
          });

          const dateObj = parseISO(currentNextDate);
          let nextDateObj;
          switch (rt.frequency) {
            case 'daily': nextDateObj = addDays(dateObj, 1); break;
            case 'weekly': nextDateObj = addWeeks(dateObj, 1); break;
            case 'monthly': nextDateObj = addMonths(dateObj, 1); break;
            case 'yearly': nextDateObj = addYears(dateObj, 1); break;
            default: nextDateObj = addMonths(dateObj, 1);
          }
          currentNextDate = format(nextDateObj, 'yyyy-MM-dd');
          modified = true;
          hasUpdates = true;
        }

        if (modified) {
          return { ...rt, nextDate: currentNextDate };
        }
        return rt;
      });

      if (hasUpdates) {
        setTransactions(prev => [...prev, ...newTxToAdd]);
        return updatedRecurring;
      }
      return prevRecurring;
    });
  }, []); // Run engine on mount

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

  const addAccount = (account: Omit<Account, 'id'>) => {
    setAccounts(prev => [...prev, { ...account, id: uuidv4() }]);
  };

  const editAccount = (id: string, updatedAccount: Omit<Account, 'id'>) => {
    setAccounts(prev => prev.map(a => a.id === id ? { ...updatedAccount, id } : a));
  };

  const deleteAccount = (id: string) => {
    setAccounts(prev => prev.filter(a => a.id !== id));
  };

  const getAccountBalance = (accountId: string) => {
    const account = accounts.find(a => a.id === accountId);
    if (!account) return 0;

    let balance = account.initialBalance;

    transactions.forEach(t => {
      if (t.accountId === accountId) {
        if (t.type === 'income') balance += t.amount;
        if (t.type === 'expense') balance -= t.amount;
        if (t.type === 'transfer') balance -= t.amount; // Outgoing transfer
      }
      if (t.toAccountId === accountId && t.type === 'transfer') {
        balance += t.amount; // Incoming transfer
      }
    });

    return balance;
  };

  const addRecurringTransaction = (rt: Omit<RecurringTransaction, 'id'>) => {
    setRecurringTransactions(prev => {
      const newRt = { ...rt, id: uuidv4() };
      // Process it immediately if due
      const today = new Date().toISOString().split('T')[0];
      if (newRt.nextDate <= today) {
        let currentNextDate = newRt.nextDate;
        let newTxToAdd: Transaction[] = [];
        
        while (currentNextDate <= today) {
          newTxToAdd.push({
            id: uuidv4(),
            type: newRt.type,
            amount: newRt.amount,
            category: newRt.category,
            date: currentNextDate,
            description: newRt.description,
            paymentMethod: newRt.paymentMethod,
            accountId: newRt.accountId,
            toAccountId: newRt.toAccountId
          });

          const dateObj = parseISO(currentNextDate);
          let nextDateObj;
          switch (newRt.frequency) {
            case 'daily': nextDateObj = addDays(dateObj, 1); break;
            case 'weekly': nextDateObj = addWeeks(dateObj, 1); break;
            case 'monthly': nextDateObj = addMonths(dateObj, 1); break;
            case 'yearly': nextDateObj = addYears(dateObj, 1); break;
            default: nextDateObj = addMonths(dateObj, 1);
          }
          currentNextDate = format(nextDateObj, 'yyyy-MM-dd');
        }
        
        setTransactions(prevTx => [...prevTx, ...newTxToAdd]);
        newRt.nextDate = currentNextDate;
      }
      return [...prev, newRt];
    });
  };

  const deleteRecurringTransaction = (id: string) => {
    setRecurringTransactions(prev => prev.filter(rt => rt.id !== id));
  };

  const toggleRecurringTransaction = (id: string) => {
    setRecurringTransactions(prev => prev.map(rt => rt.id === id ? { ...rt, active: !rt.active } : rt));
  };

  return (
    <TransactionContext.Provider value={{
      transactions, currentMonthTransactions, budgets, accounts, currentMonth, setCurrentMonth,
      addTransaction, editTransaction, deleteTransaction, setBudget, importTransactions,
      addAccount, editAccount, deleteAccount, getAccountBalance,
      recurringTransactions, addRecurringTransaction, deleteRecurringTransaction, toggleRecurringTransaction
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
