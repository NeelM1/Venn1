/** Call Ollama grading endpoint. Returns { s1, s2, s3 } scores 0-3. */
export async function gradeGuess(guess, category1, category2, category3) {
  try {
    const res = await fetch('/api/grade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guess, category1, category2, category3 }),
      signal: AbortSignal.timeout(60_000),
    });
    if (!res.ok) return { s1: 0, s2: 0, s3: 0 };
    const data = await res.json();
    return { s1: data.s1 ?? 0, s2: data.s2 ?? 0, s3: data.s3 ?? 0 };
  } catch {
    return { s1: 0, s2: 0, s3: 0 };
  }
}
