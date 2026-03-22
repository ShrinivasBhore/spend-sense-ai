import React, { useMemo } from 'react';
import { useTransactions } from '../context/TransactionContext';
import { Trophy, TrendingUp, AlertCircle } from 'lucide-react';

export const SpendingScore: React.FC = () => {
  const { currentMonthTransactions, budgets } = useTransactions();

  const { score, grade, message, textClass, bgClass, borderClass } = useMemo(() => {
    const expenses = currentMonthTransactions.filter(t => t.type === 'expense');
    const totalBudget = budgets.reduce((sum, b) => sum + b.limit, 0);
    const categoryTotals = expenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {} as Record<string, number>);

    // If no budgets are set, we can't really score budget adherence
    if (totalBudget === 0) {
      return {
        score: null,
        grade: 'N/A',
        message: 'Set up budgets to get your spending score.',
        textClass: 'text-slate-400',
        bgClass: 'bg-slate-50',
        borderClass: 'border-slate-200'
      };
    }

    let currentScore = 100;
    let activeBudgetsCount = 0;
    let overBudgetCount = 0;

    budgets.forEach(b => {
      if (b.limit > 0) {
        activeBudgetsCount++;
        const spent = categoryTotals[b.category] || 0;
        if (spent > b.limit) {
          overBudgetCount++;
          // Deduct points for each over-budget category
          currentScore -= (40 / activeBudgetsCount); 
        }
      }
    });

    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
    const utilization = totalSpent / totalBudget;

    if (utilization > 1) {
      currentScore -= 40; // Heavy penalty for overall overspending
    } else if (utilization > 0.9) {
      currentScore -= 20;
    } else if (utilization > 0.75) {
      currentScore -= 10;
    } else if (utilization < 0.5) {
      currentScore += 5; // Bonus for high savings
    }

    currentScore = Math.max(0, Math.min(100, Math.round(currentScore)));

    let grade = 'F';
    let message = 'Significant overspending detected.';
    let textClass = 'text-rose-600';
    let bgClass = 'bg-rose-50';
    let borderClass = 'border-rose-200';

    if (currentScore >= 90) {
      grade = 'A+';
      message = 'Excellent! You are saving brilliantly.';
      textClass = 'text-emerald-600';
      bgClass = 'bg-emerald-50';
      borderClass = 'border-emerald-200';
    } else if (currentScore >= 80) {
      grade = 'A';
      message = 'Great job staying within your limits.';
      textClass = 'text-emerald-500';
      bgClass = 'bg-emerald-50';
      borderClass = 'border-emerald-200';
    } else if (currentScore >= 70) {
      grade = 'B';
      message = 'Good, but watch your category budgets.';
      textClass = 'text-indigo-500';
      bgClass = 'bg-indigo-50';
      borderClass = 'border-indigo-200';
    } else if (currentScore >= 60) {
      grade = 'C';
      message = 'Fair. You are nearing your limits.';
      textClass = 'text-amber-500';
      bgClass = 'bg-amber-50';
      borderClass = 'border-amber-200';
    } else if (currentScore >= 50) {
      grade = 'D';
      message = 'Warning: High budget utilization.';
      textClass = 'text-orange-500';
      bgClass = 'bg-orange-50';
      borderClass = 'border-orange-200';
    }

    return { score: currentScore, grade, message, textClass, bgClass, borderClass };
  }, [currentMonthTransactions, budgets]);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-slate-500 font-medium">Financial Health Score</h3>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${score === null ? 'bg-slate-100 text-slate-400' : `${bgClass} ${textClass}`}`}>
          {score !== null && score >= 80 ? <Trophy className="w-5 h-5" /> : score !== null && score >= 60 ? <TrendingUp className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
        </div>
      </div>
      
      {score === null ? (
        <div className="flex-1 flex flex-col justify-center">
          <p className="text-2xl font-bold text-slate-300">-</p>
          <p className="text-sm text-slate-500 mt-2">{message}</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-center">
          <div className="flex items-baseline gap-3">
            <p className={`text-4xl font-bold ${textClass}`}>{score}</p>
            <span className={`text-sm font-bold px-2 py-0.5 rounded-md border ${textClass} ${bgClass} ${borderClass}`}>
              Grade: {grade}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-3 font-medium">
            {message}
          </p>
        </div>
      )}
    </div>
  );
};
