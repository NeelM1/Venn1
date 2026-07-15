/** Ask the server for a cryptic hint. hintNumber 1-3 gives progressively less cryptic hints. */
export async function fetchHint(puzzle, hintNumber) {
  try {
    const res = await fetch('/api/hint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetWord:  puzzle.targetWord,
        category1:   puzzle.category1,
        category2:   puzzle.category2,
        category3:   puzzle.category3,
        hintNumber,
      }),
      signal: AbortSignal.timeout(45_000),
    });
    if (!res.ok) return null;
    const { hint } = await res.json();
    return hint ?? null;
  } catch {
    return null;
  }
}
