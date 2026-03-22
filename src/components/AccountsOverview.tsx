import React from 'react';
import { useTransactions } from '../context/TransactionContext';
import { Wallet, Landmark, Smartphone, CreditCard } from 'lucide-react';
import { formatINR } from '../utils/currency';

export const AccountsOverview: React.FC = () => {
  const { accounts, getAccountBalance } = useTransactions();

  const getIcon = (type: string) => {
    switch (type) {
      case 'Cash': return <Wallet className="w-6 h-6 text-emerald-500" />;
      case 'Bank': return <Landmark className="w-6 h-6 text-blue-500" />;
      case 'Digital Wallet': return <Smartphone className="w-6 h-6 text-purple-500" />;
      case 'Credit Card': return <CreditCard className="w-6 h-6 text-rose-500" />;
      default: return <Wallet className="w-6 h-6 text-slate-500" />;
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-800">Your Accounts</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {accounts.map(account => {
          const balance = getAccountBalance(account.id);
          return (
            <div key={account.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex items-center gap-4 hover:shadow-sm transition-shadow">
              <div className="p-3 bg-white rounded-xl shadow-sm">
                {getIcon(account.type)}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">{account.name}</p>
                <p className={`text-lg font-bold ${balance < 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                  {formatINR(balance)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
