import React, { useState, useRef } from 'react';

export default function GuessInput({ onGuess, attemptsLeft, isGrading }) {
  const [value, setValue] = useState('');
  const inputRef = useRef(null);

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || isGrading) return;
    onGuess(trimmed);
    setValue('');
    inputRef.current?.focus();
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm mt-4 flex flex-col items-center gap-2">
      <div className="flex w-full gap-2">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={isGrading ? 'AI is thinking…' : 'Type your guess…'}
          disabled={isGrading}
          autoComplete="off"
          spellCheck={false}
          className="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:bg-gray-100 disabled:cursor-wait transition-colors"
        />
        <button
          type="submit"
          disabled={!value.trim() || isGrading}
          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-40 transition-colors"
        >
          {isGrading ? (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          ) : 'Guess'}
        </button>
      </div>
      <p className="text-xs text-gray-400">
        {isGrading
          ? 'Placing your guess on the diagram…'
          : `${attemptsLeft} attempt${attemptsLeft !== 1 ? 's' : ''} remaining`}
      </p>
    </form>
  );
}
