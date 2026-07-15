import React from 'react';
import { computePosition, positionFromRegions, avoidCollisions } from '../utils/computePosition';

// ─── Text wrapping helper ────────────────────────────────────────────────────

function wrapLines(text, maxChars = 13) {
  const words = text.split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    if (cur && cur.length + 1 + w.length > maxChars) { lines.push(cur); cur = w; }
    else cur = cur ? `${cur} ${w}` : w;
  }
  if (cur) lines.push(cur);
  return lines;
}

function SvgLabel({ x, y, text, fill, size = 11 }) {
  const ls = wrapLines(text);
  const lh = 14;
  const startDy = -((ls.length - 1) * lh) / 2;
  return (
    <text x={x} y={y} textAnchor="middle" fill={fill} fontSize={size}
      fontWeight="700" fontFamily="system-ui, sans-serif">
      {ls.map((l, i) => (
        <tspan key={i} x={x} dy={i === 0 ? startDy : lh}>{l}</tspan>
      ))}
    </text>
  );
}

// White-outlined chip — readable on any circle colour
function GuessChip({ x, y, text }) {
  return (
    <text x={x} y={y} textAnchor="middle"
      fontSize="8" fontWeight="800" fontFamily="system-ui, sans-serif"
      fill="#111827" stroke="white" strokeWidth="3.5" paintOrder="stroke">
      {text}
    </text>
  );
}

// ─── Position extraction ─────────────────────────────────────────────────────

function getPos(guess) {
  if (guess.scores) {
    return computePosition(guess.scores.s1, guess.scores.s2, guess.scores.s3);
  }
  if (guess.regions) {
    return positionFromRegions(guess.regions);
  }
  return null; // still pending / no data
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function VennDiagram({ puzzle, won, guesses = [] }) {
  const { id, category1, category2, category3, targetWord } = puzzle;

  // Compute positions for wrong guesses only
  const wrongGuesses = guesses.filter(g => !g.correct);

  const rawPositions  = wrongGuesses.map(getPos);
  const positions     = avoidCollisions(rawPositions);

  const noMatch = wrongGuesses.filter((_, i) => !positions[i]);

  return (
    <div className="w-full max-w-xs mx-auto select-none">
      <svg viewBox="0 0 360 360" width="100%" aria-label="Venn diagram">

        {/* ── Circles ──────────────────────────────────────────────── */}
        <circle cx={180} cy={125} r={105}
          fill="rgba(239,68,68,0.15)" stroke="rgba(239,68,68,0.5)" strokeWidth="2" />
        <circle cx={110} cy={245} r={105}
          fill="rgba(59,130,246,0.15)" stroke="rgba(59,130,246,0.5)" strokeWidth="2" />
        <circle cx={250} cy={245} r={105}
          fill="rgba(234,179,8,0.15)" stroke="rgba(234,179,8,0.5)" strokeWidth="2" />

        {/* ── Category labels (exclusive regions of each circle) ──── */}
        <SvgLabel x={180} y={42}  text={category1} fill="#dc2626" />
        <SvgLabel x={52}  y={316} text={category2} fill="#2563eb" />
        <SvgLabel x={308} y={316} text={category3} fill="#ca8a04" />

        {/* ── Centre ───────────────────────────────────────────────── */}
        {won ? (
          <text x={180} y={222} textAnchor="middle" fill="#111827"
            fontSize="15" fontWeight="900" fontFamily="system-ui, sans-serif"
            letterSpacing="2">
            {targetWord}
          </text>
        ) : (
          <>
            <text x={180} y={228} textAnchor="middle" fill="#6b7280"
              fontSize="26" fontWeight="700">?</text>
            <text x={180} y={244} textAnchor="middle" fill="#d1d5db"
              fontSize="9" fontFamily="system-ui, sans-serif">#{id}</text>
          </>
        )}

        {/* ── Placed guess chips (continuous Venn position) ──────── */}
        {wrongGuesses.map((g, i) => {
          const pos = positions[i];
          if (!pos) return null;
          return (
            <GuessChip key={g.text} x={pos.x} y={pos.y} text={g.text} />
          );
        })}
      </svg>

      {/* No-match guesses shown below the diagram */}
      {noMatch.length > 0 && (
        <p className="mt-1 text-center text-xs text-gray-400">
          No circle match:{' '}
          <span className="font-semibold text-gray-500">
            {noMatch.map(g => g.text).join(', ')}
          </span>
        </p>
      )}
    </div>
  );
}
