// Circle centers in the 360×360 SVG viewBox
const C1 = { x: 180, y: 125 };  // Red   (cat1)
const C2 = { x: 110, y: 245 };  // Blue  (cat2)
const C3 = { x: 250, y: 245 };  // Yellow (cat3)

/**
 * Weighted centroid of the three circle centers.
 * s1/s2/s3 are 0-3 strength scores from the AI grader.
 * Returns { x, y } in SVG space, or null if all scores are 0.
 */
export function computePosition(s1, s2, s3) {
  const total = s1 + s2 + s3;
  if (total === 0) return null; // no connection → place outside diagram

  return {
    x: Math.round((s1 * C1.x + s2 * C2.x + s3 * C3.x) / total),
    y: Math.round((s1 * C1.y + s2 * C2.y + s3 * C3.y) / total),
  };
}

/**
 * Convert old-style boolean regions to a position, for backward compat
 * with guesses saved before the scores system.
 */
export function positionFromRegions({ cat1, cat2, cat3 }) {
  return computePosition(cat1 ? 3 : 0, cat2 ? 3 : 0, cat3 ? 3 : 0);
}

/**
 * Given an array of { x, y } positions (some may be null),
 * shift later entries upward if they land too close to an earlier one.
 */
export function avoidCollisions(positions) {
  const result = positions.map(p => p ? { ...p } : null);
  for (let i = 1; i < result.length; i++) {
    if (!result[i]) continue;
    for (let j = 0; j < i; j++) {
      if (!result[j]) continue;
      const dist = Math.hypot(result[i].x - result[j].x, result[i].y - result[j].y);
      if (dist < 20) {
        // push i up by one chip height
        result[i] = { x: result[i].x, y: result[j].y - 14 };
      }
    }
  }
  return result;
}
