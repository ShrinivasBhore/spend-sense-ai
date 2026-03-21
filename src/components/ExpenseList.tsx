import React, { useState } from 'react';
import { useExpenses } from '../context/ExpenseContext';
import { ExpenseForm } from './ExpenseForm';
import { Trash2, Edit, Calendar, Tag, DollarSign } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export const ExpenseList: React.FC = () => {
  const { expenses, deleteExpense } = useExpenses();
  const [editingId, setEditingId] = useState<string | null>(null);

  const sortedExpenses = [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (expenses.length === 0) {
    return (
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-center">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <DollarSign className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-medium text-slate-800 mb-2">No expenses yet</h3>
        <p className="text-slate-500">Add your first expense to start tracking your spending.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-100">
        <h3 className="text-lg font-semibold text-slate-800">Recent Expenses</h3>
      </div>
      <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
        {sortedExpenses.map(expense => (
          <div key={expense.id} className="p-4 hover:bg-slate-50 transition-colors">
            {editingId === expense.id ? (
              <ExpenseForm expenseToEdit={expense} onClose={() => setEditingId(null)} />
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
                    <Tag className="w-5 h-5 text-indigo-500" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">{expense.description || expense.category}</p>
                    <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <Tag className="w-3.5 h-3.5" />
                        {expense.category}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {format(parseISO(expense.date), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="font-semibold text-slate-800 text-lg">
                    ${expense.amount.toFixed(2)}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingId(expense.id)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteExpense(expense.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
