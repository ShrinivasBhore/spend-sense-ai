import React, { useState } from 'react';
import { useExpenses } from '../context/ExpenseContext';
import { CATEGORIES } from '../types';
import { Target } from 'lucide-react';

export const BudgetForm: React.FC = () => {
  const { budgets, setBudget } = useExpenses();

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <h3 className="text-lg font-semibold mb-4 text-slate-800 flex items-center gap-2">
        <Target className="w-5 h-5 text-rose-500" />
        Monthly Budgets
      </h3>
      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
        {CATEGORIES.map(category => {
          const budget = budgets.find(b => b.category === category)?.limit || 0;
          return (
            <div key={category} className="flex items-center justify-between gap-4">
              <label className="text-sm font-medium text-slate-700 w-28">{category}</label>
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={budget || ''}
                  onChange={(e) => setBudget(category, Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full pl-8 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
