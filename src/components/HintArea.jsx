import React, { useState } from 'react';
import { fetchHint } from '../utils/fetchHint';

const MAX_HINTS = 3;

export default function HintArea({ puzzle, ollamaOnline }) {
  const [hints, setHints]     = useState([]);
  const [loading, setLoading] = useState(false);

  async function requestHint() {
    if (loading || hints.length >= MAX_HINTS) return;
    const nextNum = hints.length + 1;
    setLoading(true);
    const hint = await fetchHint(puzzle, nextNum);
    setLoading(false);
    if (hint) setHints(prev => [...prev, hint]);
  }

  const exhausted = hints.length >= MAX_HINTS;

  return (
    <div className="w-full max-w-sm mt-1 flex flex-col gap-1.5">
      {/* Show existing hints */}
      {hints.map((h, i) => (
        <div key={i}
          className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
          <span className="shrink-0 text-amber-500">💡</span>
          <span>{h}</span>
        </div>
      ))}

      {/* Hint button */}
      {!exhausted && (
        <button
          onClick={requestHint}
          disabled={loading || !ollamaOnline}
          title={!ollamaOnline ? 'Hints require Ollama' : `Hint ${hints.length + 1} of ${MAX_HINTS}`}
          className="self-end flex items-center gap-1.5 text-xs text-gray-400 hover:text-amber-500
            disabled:opacity-40 disabled:cursor-not-allowed transition-colors py-1 px-2 rounded-lg hover:bg-amber-50"
        >
          {loading
            ? <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
            : <span className="text-base leading-none">💡</span>
          }
          <span>{loading ? 'Thinking…' : `Hint (${hints.length}/${MAX_HINTS})`}</span>
        </button>
      )}
    </div>
  );
}
