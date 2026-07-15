const PROGRESS_KEY = 'venn_progress';   // map of puzzleId → progress
const STREAK_KEY   = 'venn_streak';     // { count, lastDate, maxStreak, totalWon, totalPlayed }

function todayStr() {
  return new Date().toISOString().split('T')[0];
}
function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

// ─── Per-game progress ────────────────────────────────────────────────────────

export function loadProgress(puzzleId) {
  try {
    const map = JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}');
    return map[puzzleId] ?? null;
  } catch { return null; }
}

export function saveProgress(puzzleId, guesses, gameOver, won) {
  try {
    const map = JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}');
    map[puzzleId] = { guesses, gameOver, won };
    // Keep only last 60 entries to avoid bloat
    const keys = Object.keys(map).sort().reverse().slice(0, 60);
    const pruned = {};
    for (const k of keys) pruned[k] = map[k];
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(pruned));
  } catch {}
}

// ─── Streak + stats ───────────────────────────────────────────────────────────

export function getStreak() {
  try {
    return JSON.parse(localStorage.getItem(STREAK_KEY) || '{}');
  } catch { return {}; }
}

/**
 * Record a daily game result.
 * mode = 'daily' → updates streak and stats
 * mode = 'past' | 'random' → updates stats only (no streak impact)
 */
export function recordResult(won, mode = 'daily') {
  const today = todayStr();
  const s = getStreak();

  // Always update total played / won
  s.totalPlayed = (s.totalPlayed || 0) + 1;
  if (won) s.totalWon = (s.totalWon || 0) + 1;

  if (mode === 'daily') {
    // Don't double-count same day
    if (s.lastDailyDate !== today) {
      if (won) {
        const isConsecutive = s.lastWonDate === yesterdayStr();
        s.count = isConsecutive ? (s.count || 0) + 1 : 1;
        s.maxStreak = Math.max(s.maxStreak || 0, s.count);
        s.lastWonDate = today;
      } else {
        s.count = 0;
      }
      s.lastDailyDate = today;
    }
  }

  try { localStorage.setItem(STREAK_KEY, JSON.stringify(s)); } catch {}
  return s.count || 0;
}

export function getStats() {
  const s = getStreak();
  return {
    streak:      s.count      || 0,
    maxStreak:   s.maxStreak  || 0,
    totalPlayed: s.totalPlayed || 0,
    totalWon:    s.totalWon   || 0,
    winRate: s.totalPlayed
      ? Math.round((s.totalWon || 0) / s.totalPlayed * 100)
      : 0,
  };
}

/**
 * Returns a Set of date strings for which the daily puzzle was completed.
 * Used to colour the Past Games calendar.
 */
export function getCompletedDates() {
  try {
    const map = JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}');
    return new Set(
      Object.entries(map)
        .filter(([k, v]) => v?.gameOver && /^\d{4}-\d{2}-\d{2}$/.test(k))
        .map(([k]) => k)
    );
  } catch { return new Set(); }
}
