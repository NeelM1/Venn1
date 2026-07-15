// Each row: outcome emoji + 3 circle emojis.
// The circles light up progressively by attempt number (spoiler-free).
const CIRCLES = ['🔴', '🔵', '🟡'];
const EMPTY = '⭕';

export function buildShareText(puzzleId, guesses) {
  const rows = guesses.map((guess, i) => {
    const outcome = guess.correct ? '🎯' : '❌';
    const circles = CIRCLES.map((c, ci) => (ci <= i ? c : EMPTY)).join('');
    return outcome + circles;
  });
  return `Venn #${puzzleId}\n${rows.join('\n')}`;
}
