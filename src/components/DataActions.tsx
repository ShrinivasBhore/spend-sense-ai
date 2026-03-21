import React, { useRef } from 'react';
import { useExpenses } from '../context/ExpenseContext';
import { Download, Upload } from 'lucide-react';
import { Expense, PaymentMethod, Category } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const DataActions: React.FC = () => {
  const { expenses, importExpenses } = useExpenses();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const headers = ['id', 'amount', 'category', 'date', 'description', 'paymentMethod'];
    const csvRows = [headers.join(',')];

    expenses.forEach(e => {
      const row = [
        e.id,
        e.amount,
        e.category,
        e.date,
        `"${e.description.replace(/"/g, '""')}"`,
        e.paymentMethod
      ];
      csvRows.push(row.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split('\n').filter(line => line.trim() !== '');
      if (lines.length <= 1) return; // Only headers or empty

      const newExpenses: Expense[] = [];
      
      // Basic CSV parsing
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        // Regex to split by comma, ignoring commas inside quotes
        const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        if (values.length >= 6) {
          newExpenses.push({
            id: values[0] || uuidv4(),
            amount: Number(values[1]),
            category: values[2] as Category,
            date: values[3],
            description: values[4].replace(/^"|"$/g, '').replace(/""/g, '"'),
            paymentMethod: values[5] as PaymentMethod
          });
        }
      }

      if (newExpenses.length > 0) {
        importExpenses(newExpenses);
        alert(`Successfully imported ${newExpenses.length} expenses.`);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleExport}
        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
        title="Export to CSV"
      >
        <Download className="w-4 h-4" />
        <span className="hidden sm:inline">Export</span>
      </button>
      
      <input
        type="file"
        accept=".csv"
        ref={fileInputRef}
        onChange={handleImport}
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
        title="Import from CSV"
      >
        <Upload className="w-4 h-4" />
        <span className="hidden sm:inline">Import</span>
      </button>
    </div>
  );
};
