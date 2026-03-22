import React from 'react';
import { useTransactions } from '../context/TransactionContext';
import { Repeat, Trash2, Play, Pause, Wallet } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { formatINR } from '../utils/currency';

export const RecurringTransactionsList: React.FC = () => {
  const { recurringTransactions, deleteRecurringTransaction, toggleRecurringTransaction, accounts } = useTransactions();

  if (recurringTransactions.length === 0) return null;

  const getAccountName = (id?: string) => {
    if (!id) return 'Unknown';
    const account = accounts.find(a => a.id === id);
    return account ? account.name : 'Unknown';
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6">
      <div className="p-6 border-b border-slate-100 flex items-center gap-2">
        <Repeat className="w-5 h-5 text-indigo-500" />
        <h3 className="text-lg font-semibold text-slate-800">Recurring Transactions</h3>
      </div>
      <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
        {recurringTransactions.map(rt => (
          <div key={rt.id} className={`p-4 flex items-center justify-between transition-colors ${rt.active ? 'hover:bg-slate-50' : 'bg-slate-50 opacity-75'}`}>
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${rt.type === 'income' ? 'bg-emerald-50 text-emerald-500' : rt.type === 'transfer' ? 'bg-blue-50 text-blue-500' : 'bg-rose-50 text-rose-500'}`}>
                <Repeat className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-slate-800">{rt.description || rt.category}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                  <span className="capitalize font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">{rt.frequency}</span>
                  <span>Next: {format(parseISO(rt.nextDate), 'MMM d, yyyy')}</span>
                  <span className="flex items-center gap-1">
                    <Wallet className="w-3 h-3" />
                    {rt.type === 'transfer' ? `${getAccountName(rt.accountId)} → ${getAccountName(rt.toAccountId)}` : getAccountName(rt.accountId)}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className={`font-semibold ${rt.type === 'income' ? 'text-emerald-600' : 'text-slate-800'}`}>
                {rt.type === 'income' ? '+' : rt.type === 'expense' ? '-' : ''}{formatINR(rt.amount)}
              </span>
              <div className="flex items-center gap-1">
                <button onClick={() => toggleRecurringTransaction(rt.id)} className={`p-1.5 rounded-lg transition-colors ${rt.active ? 'text-amber-500 hover:bg-amber-50' : 'text-emerald-500 hover:bg-emerald-50'}`} title={rt.active ? "Pause" : "Resume"}>
                  {rt.active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button onClick={() => deleteRecurringTransaction(rt.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Delete">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
