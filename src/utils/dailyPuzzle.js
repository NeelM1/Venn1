import puzzles from '../puzzles';

// Anchor date — puzzle #1 starts here
const START_DATE = new Date('2024-01-01T00:00:00');

export function getDailyPuzzle() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysSinceStart = Math.floor((today - START_DATE) / 86_400_000);
  return puzzles[daysSinceStart % puzzles.length];
}
