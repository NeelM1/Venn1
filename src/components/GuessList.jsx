import React from 'react';

// Render three strength dots (0-3) as filled/semi/empty circles
function ScoreDots({ scores }) {
  if (!scores) {
    return (
      <span className="ml-auto text-xs text-gray-400 animate-pulse tracking-wide">
        grading…
      </span>
    );
  }

  const dotColor = (s, baseColor) => {
    if (s === 3) return baseColor;
    if (s === 2) return `${baseColor} opacity-60`;
    if (s === 1) return `${baseColor} opacity-30`;
    return 'bg-gray-200';
  };

  return (
    <span className="ml-auto flex items-center gap-1" title={`Circles: ${scores.s1} / ${scores.s2} / ${scores.s3}`}>
      <span className={`w-2.5 h-2.5 rounded-full ${dotColor(scores.s1, 'bg-red-400')}`} />
      <span className={`w-2.5 h-2.5 rounded-full ${dotColor(scores.s2, 'bg-blue-400')}`} />
      <span className={`w-2.5 h-2.5 rounded-full ${dotColor(scores.s3, 'bg-yellow-400')}`} />
    </span>
  );
}

export default function GuessList({ guesses, maxAttempts }) {
  if (guesses.length === 0) return null;

  const slots = Array.from({ length: maxAttempts }, (_, i) => guesses[i] ?? null);

  return (
    <ul className="w-full max-w-sm mt-4 flex flex-col gap-2">
      {slots.map((guess, i) => {
        if (!guess) {
          return (
            <li key={i}
              className="flex items-center justify-between rounded-xl border border-dashed border-gray-200 px-4 py-2 text-sm text-gray-300">
              <span>—</span>
              <span className="text-xs">{i + 1}</span>
            </li>
          );
        }

        // Normalise: support old boolean regions and new 0-3 scores
        const scores = guess.scores
          ?? (guess.regions
            ? { s1: guess.regions.cat1 ? 3 : 0, s2: guess.regions.cat2 ? 3 : 0, s3: guess.regions.cat3 ? 3 : 0 }
            : null);

        return (
          <li key={i}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-all ${
              guess.correct
                ? 'border-green-300 bg-green-50 text-green-700'
                : 'border-red-200 bg-red-50 text-red-600'
            }`}>
            <span className="shrink-0">{guess.correct ? '🎯' : '❌'}</span>
            <span className="uppercase tracking-wide font-mono text-xs">{guess.text}</span>
            {guess.correct
              ? <span className="ml-auto flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                </span>
              : <ScoreDots scores={scores} />
            }
          </li>
        );
      })}
    </ul>
  );
}
