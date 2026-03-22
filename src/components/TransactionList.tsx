import React, { useState, useMemo } from 'react';
import { useTransactions } from '../context/TransactionContext';
import { TransactionForm } from './TransactionForm';
import { Trash2, Edit, Calendar, Tag, DollarSign, Search, CreditCard, ArrowDownCircle, ArrowUpCircle, RefreshCw } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Category, CATEGORIES } from '../types';
import { formatINR } from '../utils/currency';

export const TransactionList: React.FC = () => {
  const { currentMonthTransactions, deleteTransaction } = useTransactions();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<Category | 'All'>('All');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');

  const filteredAndSorted = useMemo(() => {
    let result = [...currentMonthTransactions];
    
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(t => 
        t.description.toLowerCase().includes(lowerSearch) || 
        t.category.toLowerCase().includes(lowerSearch)
      );
    }

    if (filterCategory !== 'All') {
      result = result.filter(t => t.category === filterCategory);
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc': return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'date-asc': return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'amount-desc': return b.amount - a.amount;
        case 'amount-asc': return a.amount - b.amount;
        default: return 0;
      }
    });

    return result;
  }, [currentMonthTransactions, searchTerm, filterCategory, sortBy]);

  if (currentMonthTransactions.length === 0) {
    return (
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-center">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <DollarSign className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-medium text-slate-800 mb-2">No transactions this month</h3>
        <p className="text-slate-500">Add your first transaction to start tracking your finances.</p>
      </div>
    );
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'income': return <ArrowUpCircle className="w-5 h-5 text-emerald-500" />;
      case 'transfer': return <RefreshCw className="w-5 h-5 text-blue-500" />;
      case 'expense':
      default: return <ArrowDownCircle className="w-5 h-5 text-rose-500" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'income': return 'bg-emerald-50';
      case 'transfer': return 'bg-blue-50';
      case 'expense':
      default: return 'bg-rose-50';
    }
  };

  const getAmountColor = (type: string) => {
    switch (type) {
      case 'income': return 'text-emerald-600';
      case 'transfer': return 'text-slate-800';
      case 'expense':
      default: return 'text-slate-800';
    }
  };

  const getAmountPrefix = (type: string) => {
    switch (type) {
      case 'income': return '+';
      case 'expense': return '-';
      default: return '';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-100 space-y-4">
        <h3 className="text-lg font-semibold text-slate-800">Monthly Transactions</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search transactions..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <select 
            value={filterCategory} 
            onChange={e => setFilterCategory(e.target.value as any)}
            className="px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
          >
            <option value="All">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select 
            value={sortBy} 
            onChange={e => setSortBy(e.target.value as any)}
            className="px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="amount-desc">Highest Amount</option>
            <option value="amount-asc">Lowest Amount</option>
          </select>
        </div>
      </div>
      <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
        {filteredAndSorted.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No transactions match your filters.</div>
        ) : (
          filteredAndSorted.map(transaction => (
            <div key={transaction.id} className="p-4 hover:bg-slate-50 transition-colors">
              {editingId === transaction.id ? (
                <TransactionForm transactionToEdit={transaction} onClose={() => setEditingId(null)} />
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getTypeColor(transaction.type)}`}>
                      {getTypeIcon(transaction.type)}
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">{transaction.description || transaction.category}</p>
                      <div className="flex items-center gap-3 mt-1 text-sm text-slate-500 flex-wrap">
                        <span className="flex items-center gap-1"><Tag className="w-3.5 h-3.5" />{transaction.category}</span>
                        <span className="flex items-center gap-1"><CreditCard className="w-3.5 h-3.5" />{transaction.paymentMethod}</span>
                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{format(parseISO(transaction.date), 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`font-semibold text-lg ${getAmountColor(transaction.type)}`}>
                      {getAmountPrefix(transaction.type)}{formatINR(transaction.amount)}
                    </span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setEditingId(transaction.id)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => deleteTransaction(transaction.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
