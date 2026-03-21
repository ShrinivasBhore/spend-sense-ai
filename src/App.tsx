import React from 'react';
import { ExpenseProvider } from './context/ExpenseContext';
import { ExpenseForm } from './components/ExpenseForm';
import { BudgetForm } from './components/BudgetForm';
import { ExpenseList } from './components/ExpenseList';
import { Dashboard } from './components/Dashboard';
import { BudgetAlerts } from './components/BudgetAlerts';
import { AIInsights } from './components/AIInsights';
import { DataActions } from './components/DataActions';
import { MonthSelector } from './components/MonthSelector';
import { Wallet } from 'lucide-react';

export default function App() {
  return (
    <ExpenseProvider>
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-12">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight hidden md:block">Smart Expense Tracker</h1>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4">
              <MonthSelector />
              <DataActions />
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 space-y-6">
              <ExpenseForm />
              <BudgetForm />
            </div>
            
            <div className="lg:col-span-8 space-y-6">
              <BudgetAlerts />
              <Dashboard />
              <AIInsights />
              <ExpenseList />
            </div>
          </div>
        </main>
      </div>
    </ExpenseProvider>
  );
}
