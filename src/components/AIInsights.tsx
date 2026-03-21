import React, { useState, useRef, useEffect } from 'react';
import { useExpenses } from '../context/ExpenseContext';
import { GoogleGenAI } from '@google/genai';
import { Sparkles, Loader2, MessageSquare, Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export const AIInsights: React.FC = () => {
  const { currentMonthExpenses, budgets, currentMonth } = useExpenses();
  const [insights, setInsights] = useState<string | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  
  const [chatMessages, setChatMessages] = useState<{role: 'user'|'assistant', content: string}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [loadingChat, setLoadingChat] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const generateInsights = async () => {
    if (currentMonthExpenses.length === 0) {
      setInsights("You haven't logged any expenses this month. Start tracking to get personalized insights!");
      return;
    }

    setLoadingInsights(true);
    try {
      const prompt = `
        Analyze the following expense data for ${currentMonth} and budgets. All currency values are in Indian Rupees (INR, ₹).
        Provide a brief, encouraging spending summary and 2-3 actionable savings tips.
        Format the response in Markdown. Keep it concise (under 150 words).
        
        Expenses: ${JSON.stringify(currentMonthExpenses)}
        Budgets: ${JSON.stringify(budgets)}
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      setInsights(response.text || 'No insights generated.');
    } catch (err) {
      console.error(err);
      setInsights('Failed to generate insights. Please try again later.');
    } finally {
      setLoadingInsights(false);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoadingChat(true);

    try {
      const prompt = `
        You are a helpful financial assistant. Answer the user's question based on their expense data for ${currentMonth}. All currency values are in Indian Rupees (INR, ₹).
        Keep answers concise and helpful. Format the response in Markdown.
        
        Expenses: ${JSON.stringify(currentMonthExpenses)}
        Budgets: ${JSON.stringify(budgets)}
        
        User Question: ${userMsg}
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      setChatMessages(prev => [...prev, { role: 'assistant', content: response.text || 'I could not process that.' }]);
    } catch (err) {
      console.error(err);
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error.' }]);
    } finally {
      setLoadingChat(false);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      {/* Insights Section */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 border-b border-indigo-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-indigo-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            AI Spending Insights
          </h3>
          <button
            onClick={generateInsights}
            disabled={loadingInsights}
            className="bg-white hover:bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl text-sm font-medium border border-indigo-200 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loadingInsights ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Generate Insights'}
          </button>
        </div>
        
        <div className="prose prose-indigo prose-sm max-w-none">
          {!insights && !loadingInsights && (
            <p className="text-indigo-600/70 italic">Click the button above to generate personalized insights based on your spending habits.</p>
          )}
          {insights && (
            <div className="bg-white/60 p-4 rounded-xl border border-white/40 markdown-body">
              <ReactMarkdown>{insights}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>

      {/* Chat Section */}
      <div className="p-6">
        <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2 mb-4">
          <MessageSquare className="w-5 h-5 text-slate-500" />
          Ask about your spending
        </h3>
        
        <div className="bg-slate-50 rounded-xl border border-slate-200 h-[300px] flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatMessages.length === 0 && (
              <p className="text-center text-slate-400 text-sm mt-10">
                Ask me anything! e.g., "How much did I spend on food this month?"
              </p>
            )}
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                  msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-br-none' 
                    : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
                }`}>
                  <div className={msg.role === 'user' ? '' : 'markdown-body'}>
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
            {loadingChat && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-none px-4 py-2">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          
          <form onSubmit={handleChatSubmit} className="p-3 bg-white border-t border-slate-200 rounded-b-xl flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              placeholder="Ask a question..."
              className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={!chatInput.trim() || loadingChat}
              className="bg-indigo-600 text-white p-2 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
