import React, { useMemo } from 'react';
import { useExpenses } from '../context/ExpenseContext';
import { CATEGORIES } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { AlertTriangle, AlertCircle, TrendingUp } from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

const COLORS = ['#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#8b5cf6', '#ef4444', '#10b981', '#64748b'];

export const Dashboard: React.FC = () => {
  const { expenses, budgets } = useExpenses();

  const currentMonthExpenses = useMemo(() => {
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);
    return expenses.filter(e => isWithinInterval(parseISO(e.date), { start, end }));
  }, [expenses]);

  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    CATEGORIES.forEach(c => totals[c] = 0);
    currentMonthExpenses.forEach(e => {
      totals[e.category] += e.amount;
    });
    return totals;
  }, [currentMonthExpenses]);

  const chartData = useMemo(() => {
    return CATEGORIES.map(category => ({
      name: category,
      value: categoryTotals[category]
    })).filter(d => d.value > 0);
  }, [categoryTotals]);

  const budgetProgress = useMemo(() => {
    return CATEGORIES.map(category => {
      const budget = budgets.find(b => b.category === category)?.limit || 0;
      const spent = categoryTotals[category] || 0;
      const percentage = budget > 0 ? (spent / budget) * 100 : 0;
      return { category, budget, spent, percentage };
    }).filter(d => d.budget > 0 || d.spent > 0);
  }, [budgets, categoryTotals]);

  const totalSpent = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalBudget = budgets.reduce((sum, b) => sum + b.limit, 0);

  return (
    <div className="space-y-6">
      {/* Alerts */}
      <div className="space-y-3">
        {budgetProgress.map(bp => {
          if (bp.percentage >= 100) {
            return (
              <div key={bp.category} className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-xl flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                <p className="text-sm font-medium">
                  You have exceeded your <span className="font-bold">{bp.category}</span> budget by ${(bp.spent - bp.budget).toFixed(2)}.
                </p>
              </div>
            );
          }
          if (bp.percentage >= 80) {
            return (
              <div key={bp.category} className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                <p className="text-sm font-medium">
                  You are nearing your <span className="font-bold">{bp.category}</span> budget limit. (${(bp.budget - bp.spent).toFixed(2)} remaining)
                </p>
              </div>
            );
          }
          return null;
        })}
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-500 font-medium">Total Spent This Month</h3>
            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-indigo-500" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-800">${totalSpent.toFixed(2)}</p>
          <p className="text-sm text-slate-500 mt-2">
            of ${totalBudget.toFixed(2)} total budget
          </p>
        </div>
      </div>

      {/* Progress Bars */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold mb-6 text-slate-800">Budget Usage</h3>
        <div className="space-y-6">
          {budgetProgress.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-4">No budgets set or expenses recorded yet.</p>
          ) : (
            budgetProgress.map(bp => (
              <div key={bp.category}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-slate-700">{bp.category}</span>
                  <span className="text-slate-500">
                    ${bp.spent.toFixed(2)} / ${bp.budget.toFixed(2)}
                  </span>
                </div>
                <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      bp.percentage >= 100 ? 'bg-rose-500' : bp.percentage >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(bp.percentage, 100)}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Charts */}
      {chartData.length > 0 && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold mb-6 text-slate-800">Spending by Category</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
