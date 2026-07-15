import React from 'react';

const MODES = [
  { id: 'daily',  label: 'Today',      icon: '📅' },
  { id: 'random', label: 'Random',     icon: '🎲' },
  { id: 'past',   label: 'Past Games', icon: '📚' },
];

export default function ModeSelector({ active, onChange }) {
  return (
    <div className="flex w-full max-w-sm rounded-xl overflow-hidden border border-gray-200 shadow-sm mb-3">
      {MODES.map(({ id, label, icon }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={`flex-1 py-2 text-xs font-semibold transition-colors flex items-center justify-center gap-1
            ${active === id
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-gray-500 hover:bg-gray-50'}`}
        >
          <span>{icon}</span>
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}
