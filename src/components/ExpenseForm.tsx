import React, { useState } from 'react';
import { useExpenses } from '../context/ExpenseContext';
import { Category, CATEGORIES, PaymentMethod, PAYMENT_METHODS, Expense } from '../types';
import { PlusCircle, Edit2 } from 'lucide-react';

interface ExpenseFormProps {
  expenseToEdit?: Expense;
  onClose?: () => void;
}

export const ExpenseForm: React.FC<ExpenseFormProps> = ({ expenseToEdit, onClose }) => {
  const { addExpense, editExpense, currentMonth } = useExpenses();
  const [amount, setAmount] = useState(expenseToEdit?.amount.toString() || '');
  const [category, setCategory] = useState<Category>(expenseToEdit?.category || 'Food');
  
  const defaultDate = new Date().toISOString().slice(0, 7) === currentMonth 
    ? new Date().toISOString().split('T')[0] 
    : `${currentMonth}-01`;
    
  const [date, setDate] = useState(expenseToEdit?.date || defaultDate);
  const [description, setDescription] = useState(expenseToEdit?.description || '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(expenseToEdit?.paymentMethod || 'Credit Card');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount))) return;

    const expenseData = {
      amount: Number(amount),
      category,
      date,
      description,
      paymentMethod
    };

    if (expenseToEdit) {
      editExpense(expenseToEdit.id, expenseData);
    } else {
      addExpense(expenseData);
    }

    if (onClose) {
      onClose();
    } else {
      setAmount('');
      setDescription('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <h3 className="text-lg font-semibold mb-4 text-slate-800 flex items-center gap-2">
        {expenseToEdit ? <Edit2 className="w-5 h-5 text-indigo-500" /> : <PlusCircle className="w-5 h-5 text-emerald-500" />}
        {expenseToEdit ? 'Edit Expense' : 'Add Expense'}
      </h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Amount (₹)</label>
          <input
            type="number"
            step="0.01"
            required
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            placeholder="0.00"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value as Category)}
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white"
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white"
            >
              {PAYMENT_METHODS.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Date</label>
          <input
            type="date"
            required
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Description</label>
          <input
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            placeholder="What was this for?"
          />
        </div>
        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-4 rounded-xl transition-colors"
          >
            {expenseToEdit ? 'Save Changes' : 'Add Expense'}
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2.5 px-4 rounded-xl transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </form>
  );
};
