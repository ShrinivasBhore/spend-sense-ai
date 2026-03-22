import React, { useState, useRef, useEffect } from 'react';
import { useTransactions } from '../context/TransactionContext';
import { Category, CATEGORIES, PaymentMethod, PAYMENT_METHODS, Transaction, TransactionType, RecurrenceFrequency } from '../types';
import { PlusCircle, Edit2, Sparkles, Loader2, ArrowRight, Camera, ArrowDownCircle, ArrowUpCircle, RefreshCw } from 'lucide-react';
import { GoogleGenAI, Type } from '@google/genai';

interface TransactionFormProps {
  transactionToEdit?: Transaction;
  onClose?: () => void;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ transactionToEdit, onClose }) => {
  const { addTransaction, editTransaction, currentMonth, accounts, addRecurringTransaction } = useTransactions();
  const [type, setType] = useState<TransactionType>(transactionToEdit?.type || 'expense');
  const [amount, setAmount] = useState(transactionToEdit?.amount.toString() || '');
  const [category, setCategory] = useState<Category>(transactionToEdit?.category || 'Food');
  
  const defaultDate = new Date().toISOString().slice(0, 7) === currentMonth 
    ? new Date().toISOString().split('T')[0] 
    : `${currentMonth}-01`;
    
  const [date, setDate] = useState(transactionToEdit?.date || defaultDate);
  const [description, setDescription] = useState(transactionToEdit?.description || '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(transactionToEdit?.paymentMethod || 'Credit Card');

  const defaultAccount = accounts.length > 0 ? accounts[0].id : '';
  const [accountId, setAccountId] = useState(transactionToEdit?.accountId || defaultAccount);
  const [toAccountId, setToAccountId] = useState(transactionToEdit?.toAccountId || '');

  const [smartInput, setSmartInput] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<RecurrenceFrequency>('monthly');

  // Ensure accountId is set if accounts load later
  useEffect(() => {
    if (!accountId && accounts.length > 0) {
      setAccountId(accounts[0].id);
    }
  }, [accounts, accountId]);

  const applyParsedResult = (result: any) => {
    if (result.type && ['expense', 'income', 'transfer'].includes(result.type)) setType(result.type as TransactionType);
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
      const prompt = `Parse the following transaction description into structured data.
      
Description: "${smartInput}"

Current Date (if they say today/yesterday): ${new Date().toISOString().split('T')[0]}

Categories available: ${CATEGORIES.join(', ')}
Payment methods available: ${PAYMENT_METHODS.join(', ')}
Types available: expense, income, transfer`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING, description: "The type of transaction: 'expense', 'income', or 'transfer'" },
              amount: { type: Type.NUMBER, description: "The amount" },
              category: { type: Type.STRING, description: "The best matching category from the available list" },
              description: { type: Type.STRING, description: "A short description of the transaction" },
              date: { type: Type.STRING, description: "The date of the transaction in YYYY-MM-DD format" },
              paymentMethod: { type: Type.STRING, description: "The best matching payment method from the available list, default to 'Credit Card' if unknown" }
            },
            required: ["type", "amount", "category", "description", "date", "paymentMethod"]
          }
        }
      });

      const result = JSON.parse(response.text || '{}');
      applyParsedResult(result);
      setSmartInput('');
    } catch (error) {
      console.error("Failed to parse transaction:", error);
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
      const prompt = `Analyze this receipt or document and extract the transaction details into structured data.
      
      Current Date (if relative): ${new Date().toISOString().split('T')[0]}
      
      Categories available: ${CATEGORIES.join(', ')}
      Payment methods available: ${PAYMENT_METHODS.join(', ')}
      Types available: expense, income, transfer`;

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
              type: { type: Type.STRING, description: "The type of transaction: 'expense', 'income', or 'transfer'" },
              amount: { type: Type.NUMBER, description: "The total amount" },
              category: { type: Type.STRING, description: "The best matching category from the available list" },
              description: { type: Type.STRING, description: "A short description (e.g., store name or items)" },
              date: { type: Type.STRING, description: "The date in YYYY-MM-DD format" },
              paymentMethod: { type: Type.STRING, description: "The best matching payment method from the available list, default to 'Credit Card' if unknown" }
            },
            required: ["type", "amount", "category", "description", "date", "paymentMethod"]
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
    if (!accountId) {
      alert("Please select an account.");
      return;
    }
    if (type === 'transfer' && !toAccountId) {
      alert("Please select a destination account for the transfer.");
      return;
    }
    if (type === 'transfer' && accountId === toAccountId) {
      alert("Source and destination accounts cannot be the same.");
      return;
    }

    const transactionData = {
      type,
      amount: Number(amount),
      category,
      date,
      description,
      paymentMethod,
      accountId,
      toAccountId: type === 'transfer' ? toAccountId : undefined
    };

    if (transactionToEdit) {
      editTransaction(transactionToEdit.id, transactionData);
    } else {
      if (isRecurring) {
        addRecurringTransaction({
          type,
          amount: Number(amount),
          category,
          description,
          paymentMethod,
          accountId,
          toAccountId: type === 'transfer' ? toAccountId : undefined,
          frequency,
          startDate: date,
          nextDate: date,
          active: true
        });
      } else {
        addTransaction(transactionData);
      }
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
        {transactionToEdit ? <Edit2 className="w-5 h-5 text-indigo-500" /> : <PlusCircle className="w-5 h-5 text-emerald-500" />}
        {transactionToEdit ? 'Edit Transaction' : 'Add Transaction'}
      </h3>

      {!transactionToEdit && (
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
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-sm font-medium transition-colors ${
              type === 'expense' 
                ? 'bg-rose-50 border-rose-200 text-rose-700' 
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <ArrowDownCircle className="w-4 h-4" /> Expense
          </button>
          <button
            type="button"
            onClick={() => setType('income')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-sm font-medium transition-colors ${
              type === 'income' 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <ArrowUpCircle className="w-4 h-4" /> Income
          </button>
          <button
            type="button"
            onClick={() => setType('transfer')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-sm font-medium transition-colors ${
              type === 'transfer' 
                ? 'bg-blue-50 border-blue-200 text-blue-700' 
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <RefreshCw className="w-4 h-4" /> Transfer
          </button>
        </div>

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

        <div className={`grid ${type === 'transfer' ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              {type === 'transfer' ? 'From Account' : 'Account'}
            </label>
            <select
              value={accountId}
              onChange={e => setAccountId(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white"
            >
              <option value="" disabled>Select Account</option>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>{a.name} ({a.type})</option>
              ))}
            </select>
          </div>
          {type === 'transfer' && (
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">To Account</label>
              <select
                value={toAccountId}
                onChange={e => setToAccountId(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white"
              >
                <option value="" disabled>Select Destination</option>
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>{a.name} ({a.type})</option>
                ))}
              </select>
            </div>
          )}
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

        {!transactionToEdit && (
          <div className="flex flex-col gap-3 mt-4 p-4 bg-slate-50 border border-slate-100 rounded-xl">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={e => setIsRecurring(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
              Make this a recurring transaction
            </label>
            {isRecurring && (
              <div className="pl-6">
                <label className="block text-xs font-medium text-slate-500 mb-1">Frequency</label>
                <select
                  value={frequency}
                  onChange={e => setFrequency(e.target.value as RecurrenceFrequency)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-4 rounded-xl transition-colors"
          >
            {transactionToEdit ? 'Save Changes' : 'Add Transaction'}
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
