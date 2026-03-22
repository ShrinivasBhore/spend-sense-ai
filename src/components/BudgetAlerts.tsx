import React, { useMemo } from 'react';
import { useTransactions } from '../context/TransactionContext';
import { AlertTriangle, AlertCircle, BellRing, CheckCircle2 } from 'lucide-react';

export const BudgetAlerts: React.FC = () => {
  const { currentMonthTransactions, budgets } = useTransactions();

  const alerts = useMemo(() => {
    const expenses = currentMonthTransactions.filter(t => t.type === 'expense');
    const categoryTotals = expenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {} as Record<string, number>);

    const newAlerts: { category: string; type: 'warning' | 'critical'; message: string; percentage: number }[] = [];

    budgets.forEach(b => {
      if (b.limit === 0) return;
      const spent = categoryTotals[b.category] || 0;
      const percentage = (spent / b.limit) * 100;

      if (percentage >= 100) {
        newAlerts.push({
          category: b.category,
          type: 'critical',
          message: `You've exceeded your ${b.category} budget by ₹${(spent - b.limit).toLocaleString('en-IN')}`,
          percentage
        });
      } else if (percentage >= 80) {
        newAlerts.push({
          category: b.category,
          type: 'warning',
          message: `You've used ${percentage.toFixed(0)}% of your ${b.category} budget. Only ₹${(b.limit - spent).toLocaleString('en-IN')} left.`,
          percentage
        });
      }
    });

    return newAlerts.sort((a, b) => b.percentage - a.percentage);
  }, [currentMonthTransactions, budgets]);

  const hasBudgets = budgets.some(b => b.limit > 0);

  if (!hasBudgets) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-center gap-2">
        <BellRing className="w-5 h-5 text-indigo-500" />
        <h3 className="text-lg font-semibold text-slate-800">Smart Alerts</h3>
      </div>
      <div className="p-6">
        {alerts.length === 0 ? (
          <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            <div>
              <h4 className="font-semibold text-sm text-emerald-900">All Good!</h4>
              <p className="text-sm mt-1 opacity-90">You are well within your budgets for all categories.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert, index) => (
              <div 
                key={index}
                className={`p-4 rounded-xl border flex items-start gap-3 ${
                  alert.type === 'critical' 
                    ? 'bg-red-50 border-red-200 text-red-800' 
                    : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}
              >
                {alert.type === 'critical' ? (
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className={`font-semibold text-sm ${alert.type === 'critical' ? 'text-red-900' : 'text-amber-900'}`}>
                    {alert.category} Budget {alert.type === 'critical' ? 'Exceeded' : 'Warning'}
                  </h4>
                  <p className="text-sm mt-1 opacity-90">{alert.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
