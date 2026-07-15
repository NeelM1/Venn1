/**
 * Client-side fallback grader using pre-baked word banks.
 * Returns { s1, s2, s3 } scores (0 or 2) matching the server format.
 */
export function gradeClientSide(guess, puzzle) {
  const g = guess.trim().toLowerCase();

  function score(list) {
    if (!list?.length) return 0;
    const hit = list.some(w => {
      const word = w.toLowerCase();
      if (g === word) return true;
      if (g.length >= 4 && word.includes(g)) return true;
      if (word.length >= 4 && g.includes(word)) return true;
      return false;
    });
    return hit ? 2 : 0;
  }

  return {
    s1: score(puzzle.cat1Words),
    s2: score(puzzle.cat2Words),
    s3: score(puzzle.cat3Words),
  };
}
