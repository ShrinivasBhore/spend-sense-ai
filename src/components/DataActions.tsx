import React, { useRef } from 'react';
import { useTransactions } from '../context/TransactionContext';
import { Download, Upload } from 'lucide-react';
import { Transaction, PaymentMethod, Category, TransactionType } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const DataActions: React.FC = () => {
  const { transactions, importTransactions } = useTransactions();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const headers = ['id', 'type', 'amount', 'category', 'date', 'description', 'paymentMethod'];
    const csvRows = [headers.join(',')];

    transactions.forEach(t => {
      const row = [
        t.id,
        t.type,
        t.amount,
        t.category,
        t.date,
        `"${t.description.replace(/"/g, '""')}"`,
        t.paymentMethod
      ];
      csvRows.push(row.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_export_${new Date().toISOString().split('T')[0]}.csv`;
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

      const newTransactions: Transaction[] = [];
      
      // Basic CSV parsing
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        // Regex to split by comma, ignoring commas inside quotes
        const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        
        // Handle both old format (6 cols) and new format (7 cols)
        if (values.length === 6) {
          // Old format: id, amount, category, date, description, paymentMethod
          newTransactions.push({
            id: values[0] || uuidv4(),
            type: 'expense',
            amount: Number(values[1]),
            category: values[2] as Category,
            date: values[3],
            description: values[4].replace(/^"|"$/g, '').replace(/""/g, '"'),
            paymentMethod: values[5] as PaymentMethod
          });
        } else if (values.length >= 7) {
          // New format: id, type, amount, category, date, description, paymentMethod
          newTransactions.push({
            id: values[0] || uuidv4(),
            type: (values[1] as TransactionType) || 'expense',
            amount: Number(values[2]),
            category: values[3] as Category,
            date: values[4],
            description: values[5].replace(/^"|"$/g, '').replace(/""/g, '"'),
            paymentMethod: values[6] as PaymentMethod
          });
        }
      }

      if (newTransactions.length > 0) {
        importTransactions(newTransactions);
        alert(`Successfully imported ${newTransactions.length} transactions.`);
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
