import React, { useEffect, useState } from 'react';
import { fetchPastList } from '../utils/fetchPuzzle';
import { getCompletedDates, loadProgress } from '../utils/storage';

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function dayOfWeek(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' });
}

export default function PastGames({ onSelect }) {
  const [days, setDays]     = useState([]);
  const [loading, setLoading] = useState(true);
  const completed = getCompletedDates();

  useEffect(() => {
    fetchPastList().then(list => { setDays(list); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <div className="w-full max-w-sm flex justify-center py-10">
        <svg className="animate-spin h-6 w-6 text-indigo-400" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
        </svg>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <p className="text-xs text-gray-400 text-center mb-3 uppercase tracking-wide">
        Last 30 Days
      </p>
      <div className="grid grid-cols-5 gap-2">
        {days.map(({ date }) => {
          const done     = completed.has(date);
          const progress = loadProgress(date);
          const won      = progress?.won;

          return (
            <button
              key={date}
              onClick={() => onSelect(date)}
              className={`flex flex-col items-center justify-center rounded-xl p-1.5 text-center
                border transition-all hover:scale-105 active:scale-95
                ${done
                  ? won
                    ? 'bg-green-50 border-green-300 text-green-700'
                    : 'bg-red-50 border-red-200 text-red-600'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300'}`}
            >
              <span className="text-base leading-none">
                {done ? (won ? '✅' : '❌') : '🔒'}
              </span>
              <span className="text-[9px] font-bold mt-0.5 leading-tight">
                {formatDate(date)}
              </span>
              <span className="text-[8px] text-gray-400 leading-tight">
                {dayOfWeek(date)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
