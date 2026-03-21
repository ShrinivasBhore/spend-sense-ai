import React, { useState, useRef } from 'react';
import { useExpenses } from '../context/ExpenseContext';
import { Category, CATEGORIES, PaymentMethod, PAYMENT_METHODS, Expense } from '../types';
import { PlusCircle, Edit2, Sparkles, Loader2, ArrowRight, Camera } from 'lucide-react';
import { GoogleGenAI, Type } from '@google/genai';

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

  const [smartInput, setSmartInput] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const applyParsedResult = (result: any) => {
    if (result.amount) setAmount(result.amount.toString());
    if (result.category && CATEGORIES.includes(result.category as Category)) setCategory(result.category as Category);
    if (result.description) setDescription(result.description);
    if (result.date) setDate(result.date);
    if (result.paymentMethod && PAYMENT_METHODS.includes(result.paymentMethod as PaymentMethod)) setPaymentMethod(result.paymentMethod as PaymentMethod);
  };

  const handleSmartParse = async () => {
    if (!smartInput.trim()) return;
    setIsParsing(true);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `Parse the following expense description into structured data.
      
Description: "${smartInput}"

Current Date (if they say today/yesterday): ${new Date().toISOString().split('T')[0]}

Categories available: ${CATEGORIES.join(', ')}
Payment methods available: ${PAYMENT_METHODS.join(', ')}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              amount: { type: Type.NUMBER, description: "The amount spent" },
              category: { type: Type.STRING, description: "The best matching category from the available list" },
              description: { type: Type.STRING, description: "A short description of the expense" },
              date: { type: Type.STRING, description: "The date of the expense in YYYY-MM-DD format" },
              paymentMethod: { type: Type.STRING, description: "The best matching payment method from the available list, default to 'Credit Card' if unknown" }
            },
            required: ["amount", "category", "description", "date", "paymentMethod"]
          }
        }
      });

      const result = JSON.parse(response.text || '{}');
      applyParsedResult(result);
      setSmartInput('');
    } catch (error) {
      console.error("Failed to parse expense:", error);
    } finally {
      setIsParsing(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    try {
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = error => reject(error);
      });

      const mimeType = file.type;
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `Analyze this receipt and extract the expense details into structured data.
      
      Current Date (if relative): ${new Date().toISOString().split('T')[0]}
      
      Categories available: ${CATEGORIES.join(', ')}
      Payment methods available: ${PAYMENT_METHODS.join(', ')}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { inlineData: { data: base64Data, mimeType } },
            { text: prompt }
          ]
        },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              amount: { type: Type.NUMBER, description: "The total amount spent" },
              category: { type: Type.STRING, description: "The best matching category from the available list" },
              description: { type: Type.STRING, description: "A short description of the expense (e.g., store name or items)" },
              date: { type: Type.STRING, description: "The date of the expense in YYYY-MM-DD format" },
              paymentMethod: { type: Type.STRING, description: "The best matching payment method from the available list, default to 'Credit Card' if unknown" }
            },
            required: ["amount", "category", "description", "date", "paymentMethod"]
          }
        }
      });

      const result = JSON.parse(response.text || '{}');
      applyParsedResult(result);
    } catch (error) {
      console.error("Failed to parse receipt:", error);
    } finally {
      setIsParsing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

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

      {!expenseToEdit && (
        <div className="mb-6 p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl">
          <label className="block text-sm font-medium text-indigo-900 mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            Smart Add & Scan
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={smartInput}
              onChange={e => setSmartInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSmartParse();
                }
              }}
              placeholder="e.g., 'Spent 500 on groceries yesterday'"
              className="flex-1 px-4 py-2 border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white text-sm"
              disabled={isParsing}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isParsing}
              className="bg-white border border-indigo-200 hover:bg-indigo-50 text-indigo-600 p-2 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center min-w-[40px]"
              title="Upload Receipt"
            >
              <Camera className="w-4 h-4" />
            </button>
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
            />
            <button
              type="button"
              onClick={handleSmartParse}
              disabled={isParsing || !smartInput.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center min-w-[40px]"
            >
              {isParsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs text-indigo-600/70 mt-2">
            Type a sentence or upload a receipt to automatically fill the form.
          </p>
        </div>
      )}

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
