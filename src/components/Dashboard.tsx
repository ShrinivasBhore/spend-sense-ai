import React, { useMemo } from 'react';
import { useExpenses } from '../context/ExpenseContext';
import { CATEGORIES } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { AlertTriangle, AlertCircle, TrendingUp, Wallet } from 'lucide-react';
import { getDaysInMonth } from 'date-fns';
import { formatINR } from '../utils/currency';

import { SpendingScore } from './SpendingScore';

const COLORS = ['#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#8b5cf6', '#ef4444', '#10b981', '#64748b'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-xl shadow-lg border border-slate-100">
        <p className="text-sm font-medium text-slate-800 mb-1">{label || payload[0].name}</p>
        <p className="text-sm font-bold text-indigo-600">
          {formatINR(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

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
    })).filter(d => d.value > 0).sort((a, b) => b.value - a.value);
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
    }).filter(d => d.budget > 0 || d.spent > 0)
      .sort((a, b) => b.percentage - a.percentage);
  }, [budgets, categoryTotals]);

  const totalSpent = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalBudget = budgets.reduce((sum, b) => sum + b.limit, 0);
  const spentPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {budgetProgress.some(bp => bp.percentage >= 80) && (
        <div className="space-y-3">
          {budgetProgress.map(bp => {
            if (bp.percentage >= 100) {
              return (
                <div key={bp.category} className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-xl flex items-center gap-3 shadow-sm">
                  <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                  <p className="text-sm font-medium">
                    You have exceeded your <span className="font-bold">{bp.category}</span> budget by {formatINR(bp.spent - bp.budget)}.
                  </p>
                </div>
              );
            }
            if (bp.percentage >= 80) {
              return (
                <div key={bp.category} className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl flex items-center gap-3 shadow-sm">
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
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-5">
            <Wallet className="w-32 h-32" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-500 font-medium">Total Spent This Month</h3>
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-indigo-500" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-bold text-slate-800">{formatINR(totalSpent)}</p>
            </div>
            
            {totalBudget > 0 && (
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-500">of {formatINR(totalBudget)} budget</span>
                  <span className={`font-medium ${spentPercentage >= 100 ? 'text-rose-500' : spentPercentage >= 80 ? 'text-amber-500' : 'text-emerald-500'}`}>
                    {spentPercentage.toFixed(0)}%
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ease-out ${
                      spentPercentage >= 100 ? 'bg-rose-500' : spentPercentage >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(spentPercentage, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
        <SpendingScore />
      </div>

      {/* Category Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Progress Bars */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow flex flex-col">
          <h3 className="text-lg font-semibold mb-6 text-slate-800">Budget Usage</h3>
          <div className="space-y-5 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {budgetProgress.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <p className="text-slate-400 text-sm text-center">No budgets set or expenses recorded yet.</p>
              </div>
            ) : (
              budgetProgress.map(bp => (
                <div key={bp.category} className="group">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium text-slate-700 group-hover:text-indigo-600 transition-colors">{bp.category}</span>
                    <span className="text-slate-500">
                      <span className="font-medium text-slate-700">{formatINR(bp.spent)}</span> / {formatINR(bp.budget)}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ease-out ${
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

        {/* Pie Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
          <h3 className="text-lg font-semibold mb-2 text-slate-800">Spending Breakdown</h3>
          {pieData.length > 0 ? (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={75}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                    cornerRadius={4}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    iconType="circle"
                    formatter={(value) => <span className="text-slate-600 text-sm font-medium ml-1">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center">
              <p className="text-slate-400 text-sm">No expenses recorded this month.</p>
            </div>
          )}
        </div>
      </div>

      {/* Daily Spending Chart */}
      {dailyData.some(d => d.amount > 0) && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
          <h3 className="text-lg font-semibold mb-6 text-slate-800">Daily Spending Trends</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  tickFormatter={(val) => val % 5 === 0 || val === 1 ? val : ''}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  tickFormatter={(val) => `₹${val}`}
                  dx={-10}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Bar 
                  dataKey="amount" 
                  fill="#6366f1" 
                  radius={[4, 4, 0, 0]} 
                  maxBarSize={40}
                  animationDuration={1500}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
