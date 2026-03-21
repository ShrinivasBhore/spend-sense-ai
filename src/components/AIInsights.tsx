import React, { useState } from 'react';
import { useExpenses } from '../context/ExpenseContext';
import { GoogleGenAI } from '@google/genai';
import { Sparkles, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export const AIInsights: React.FC = () => {
  const { expenses, budgets } = useExpenses();
  const [insights, setInsights] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateInsights = async () => {
    if (expenses.length === 0) {
      setInsights("You haven't logged any expenses yet. Start tracking to get personalized insights!");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const prompt = `
        Analyze the following expense data and budgets.
        Provide a brief, encouraging weekly spending summary and 2-3 actionable savings tips.
        Format the response in Markdown. Keep it concise (under 150 words).
        
        Expenses: ${JSON.stringify(expenses)}
        Budgets: ${JSON.stringify(budgets)}
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      setInsights(response.text || 'No insights generated.');
    } catch (err) {
      console.error(err);
      setError('Failed to generate insights. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-2xl shadow-sm border border-indigo-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-indigo-900 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-500" />
          AI Spending Insights
        </h3>
        <button
          onClick={generateInsights}
          disabled={loading}
          className="bg-white hover:bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl text-sm font-medium border border-indigo-200 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Generate Insights'}
        </button>
      </div>
      
      <div className="prose prose-indigo prose-sm max-w-none">
        {error && <p className="text-rose-600">{error}</p>}
        {!error && !insights && !loading && (
          <p className="text-indigo-600/70 italic">Click the button above to generate personalized insights based on your spending habits.</p>
        )}
        {insights && (
          <div className="bg-white/60 p-4 rounded-xl border border-white/40 markdown-body">
            <ReactMarkdown>{insights}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
};
