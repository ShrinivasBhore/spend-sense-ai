import React, { useMemo } from 'react';
import { useExpenses } from '../context/ExpenseContext';
import { CATEGORIES } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { AlertTriangle, AlertCircle, TrendingUp } from 'lucide-react';
import { getDaysInMonth } from 'date-fns';
import { formatINR } from '../utils/currency';

const COLORS = ['#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#8b5cf6', '#ef4444', '#10b981', '#64748b'];

export const Dashboard: React.FC = () => {
  const { currentMonthExpenses, budgets, currentMonth } = useExpenses();

  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    CATEGORIES.forEach(c => totals[c] = 0);
    currentMonthExpenses.forEach(e => {
      totals[e.category] += e.amount;
    });
    return totals;
  }, [currentMonthExpenses]);

  const pieData = useMemo(() => {
    return CATEGORIES.map(category => ({
      name: category,
      value: categoryTotals[category]
    })).filter(d => d.value > 0);
  }, [categoryTotals]);

  const dailyData = useMemo(() => {
    if (!currentMonth) return [];
    const [year, month] = currentMonth.split('-').map(Number);
    const daysInMonth = getDaysInMonth(new Date(year, month - 1));
    const days = Array.from({ length: daysInMonth }, (_, i) => ({
      day: i + 1,
      date: `${currentMonth}-${String(i + 1).padStart(2, '0')}`,
      amount: 0
    }));

    currentMonthExpenses.forEach(e => {
      const day = parseInt(e.date.split('-')[2], 10);
      if (days[day - 1]) {
        days[day - 1].amount += e.amount;
      }
    });

    return days;
  }, [currentMonthExpenses, currentMonth]);

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
                  You have exceeded your <span className="font-bold">{bp.category}</span> budget by {formatINR(bp.spent - bp.budget)}.
                </p>
              </div>
            );
          }
          if (bp.percentage >= 80) {
            return (
              <div key={bp.category} className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                <p className="text-sm font-medium">
                  You are nearing your <span className="font-bold">{bp.category}</span> budget limit. ({formatINR(bp.budget - bp.spent)} remaining)
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
          <p className="text-3xl font-bold text-slate-800">{formatINR(totalSpent)}</p>
          <p className="text-sm text-slate-500 mt-2">
            of {formatINR(totalBudget)} total budget
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
                    {formatINR(bp.spent)} / {formatINR(bp.budget)}
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {pieData.length > 0 && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-semibold mb-6 text-slate-800">Spending by Category</h3>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatINR(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {dailyData.some(d => d.amount > 0) && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-semibold mb-6 text-slate-800">Daily Spending</h3>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="day" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    tickFormatter={(val) => val % 5 === 0 || val === 1 ? val : ''}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    tickFormatter={(val) => `₹${val}`}
                  />
                  <Tooltip 
                    formatter={(value: number) => [formatINR(value), 'Spent']}
                    labelFormatter={(label) => `Day ${label}`}
                    cursor={{ fill: '#f1f5f9' }}
                  />
                  <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
