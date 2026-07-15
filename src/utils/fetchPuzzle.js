import fallbackPuzzles from '../puzzles';

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function getFallback(date) {
  const d = new Date(date ?? todayStr());
  d.setHours(0, 0, 0, 0);
  const start = new Date('2024-01-01');
  const idx = Math.floor((d - start) / 86_400_000) % fallbackPuzzles.length;
  // Override the id with the date so localStorage keying is consistent
  return { ...fallbackPuzzles[idx], id: date ?? todayStr() };
}

async function apiFetch(url, opts = {}) {
  const res = await fetch(url, { signal: AbortSignal.timeout(90_000), ...opts });
  if (res.status === 503) return null; // ollama offline
  if (!res.ok) return null;
  const data = await res.json();
  return data.error ? null : data;
}

/** Fetch today's daily puzzle. Returns { puzzle, ollamaOnline }. */
export async function fetchDailyPuzzle() {
  try {
    const puzzle = await apiFetch('/api/puzzle');
    if (puzzle) return { puzzle, ollamaOnline: true };
  } catch {}
  return { puzzle: getFallback(todayStr()), ollamaOnline: false };
}

/** Fetch a specific past date's puzzle. Returns { puzzle, ollamaOnline }. */
export async function fetchPastPuzzle(date) {
  try {
    const puzzle = await apiFetch(`/api/puzzle/${date}`);
    if (puzzle) return { puzzle, ollamaOnline: true };
  } catch {}
  return { puzzle: getFallback(date), ollamaOnline: false };
}

/** Generate a fresh random puzzle (not cached). Returns { puzzle, ollamaOnline }. */
export async function fetchRandomPuzzle() {
  try {
    const puzzle = await apiFetch('/api/puzzle/random', { method: 'POST' });
    if (puzzle) return { puzzle, ollamaOnline: true };
  } catch {}
  // Random fallback: pick a random pre-baked puzzle with a unique id
  const idx = Math.floor(Math.random() * fallbackPuzzles.length);
  return {
    puzzle: { ...fallbackPuzzles[idx], id: `random-${Date.now()}` },
    ollamaOnline: false,
  };
}

/** Fetch the list of past 30 days (array of { date } objects). */
export async function fetchPastList() {
  try {
    const list = await apiFetch('/api/puzzles/list');
    if (list) return list;
  } catch {}
  // Fallback: build list client-side
  const today = new Date();
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (i + 1));
    return { date: d.toISOString().split('T')[0] };
  });
}
