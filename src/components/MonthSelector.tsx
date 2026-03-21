import React from 'react';
import { useExpenses } from '../context/ExpenseContext';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { format, parseISO, addMonths, subMonths } from 'date-fns';

export const MonthSelector: React.FC = () => {
  const { currentMonth, setCurrentMonth } = useExpenses();

  const handlePrev = () => {
    const date = parseISO(`${currentMonth}-01`);
    setCurrentMonth(format(subMonths(date, 1), 'yyyy-MM'));
  };

  const handleNext = () => {
    const date = parseISO(`${currentMonth}-01`);
    setCurrentMonth(format(addMonths(date, 1), 'yyyy-MM'));
  };

  const handleCurrent = () => {
    setCurrentMonth(format(new Date(), 'yyyy-MM'));
  };

  return (
    <div className="flex items-center gap-2 sm:gap-4 bg-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl border border-slate-200 shadow-sm">
      <button onClick={handlePrev} className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
        <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
      </button>
      
      <div className="flex items-center gap-2 min-w-[120px] sm:min-w-[140px] justify-center">
        <CalendarIcon className="w-4 h-4 text-indigo-500 hidden sm:block" />
        <span className="text-sm sm:text-base font-medium text-slate-700">
          {format(parseISO(`${currentMonth}-01`), 'MMM yyyy')}
        </span>
      </div>

      <button onClick={handleNext} className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
      </button>

      <button 
        onClick={handleCurrent}
        className="text-xs font-medium text-indigo-600 hover:text-indigo-700 ml-1 sm:ml-2 px-2 py-1 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors hidden sm:block"
      >
        Today
      </button>
    </div>
  );
};
