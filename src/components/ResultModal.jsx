import React, { useState } from 'react';
import { buildShareText } from '../utils/share';

export default function ResultModal({ puzzle, guesses, won, stats, mode, onClose, onPlayRandom }) {
  const [copied, setCopied] = useState(false);

  function handleShare() {
    const text = buildShareText(puzzle.id, guesses);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const isDaily = mode === 'daily';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl text-center">

        {/* Outcome */}
        {won ? (
          <>
            <div className="text-5xl mb-2">🎉</div>
            <h2 className="text-2xl font-bold text-gray-800">Nice one!</h2>
            <p className="mt-1 text-gray-500 text-sm">
              Solved in {guesses.length} guess{guesses.length !== 1 ? 'es' : ''}.
            </p>
          </>
        ) : (
          <>
            <div className="text-5xl mb-2">😔</div>
            <h2 className="text-2xl font-bold text-gray-800">Better luck next time!</h2>
          </>
        )}

        {/* Answer reveal */}
        <div className="mt-4 rounded-xl bg-gray-50 py-3 px-4">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">The answer was</p>
          <p className="text-2xl font-black text-gray-800 tracking-widest">{puzzle.targetWord}</p>
          <p className="text-xs text-gray-400 mt-1">
            {puzzle.category1} · {puzzle.category2} · {puzzle.category3}
          </p>
        </div>

        {/* Daily stats */}
        {isDaily && (
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              { label: 'Streak', val: won ? `🔥 ${stats.streak}` : `💔 ${stats.streak}` },
              { label: 'Best',   val: stats.maxStreak },
              { label: 'Win %',  val: `${stats.winRate}%` },
            ].map(({ label, val }) => (
              <div key={label} className="rounded-xl bg-gray-50 py-2">
                <div className="font-black text-gray-800">{val}</div>
                <div className="text-[10px] text-gray-400 uppercase tracking-wide">{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="mt-5 flex flex-col gap-3">
          {isDaily && (
            <button onClick={handleShare}
              className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">
              {copied ? '✅ Copied!' : '📋 Share result'}
            </button>
          )}
          <button onClick={onPlayRandom}
            className="w-full rounded-xl bg-purple-600 py-3 text-sm font-semibold text-white hover:bg-purple-700 transition-colors">
            🎲 Play Random
          </button>
          <button onClick={onClose}
            className="w-full rounded-xl border border-gray-200 py-2.5 text-sm text-gray-500 hover:bg-gray-50 transition-colors">
            See board
          </button>
        </div>

        {isDaily && (
          <p className="mt-4 text-xs text-gray-400">Come back tomorrow for a new puzzle!</p>
        )}
      </div>
    </div>
  );
}
