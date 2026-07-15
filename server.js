import express from 'express';
import fs from 'fs/promises';
import path from 'path';

const app    = express();
const PORT   = process.env.PORT   || 3001;
const MODEL  = process.env.OLLAMA_MODEL || 'gemma3:4b';
const OLLAMA = 'http://localhost:11434';

app.use(express.json());

// Resolve __dirname in ESM
const __dir  = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1'));
const CACHE  = path.join(__dir, '.puzzle-cache.json');

// ─── Helpers ────────────────────────────────────────────────────────────────

function todayStr() {
  return new Date().toISOString().split('T')[0];
}
function dayOffset(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}
function daysSince2024(dateStr) {
  return Math.floor((new Date(dateStr) - new Date('2024-01-01')) / 86_400_000);
}

async function ollamaRunning() {
  try {
    const r = await fetch(`${OLLAMA}/api/tags`, { signal: AbortSignal.timeout(1500) });
    return r.ok;
  } catch { return false; }
}

async function ask(prompt, { json = false, seed = null, temperature = 0.8 } = {}) {
  const body = {
    model: MODEL,
    prompt,
    stream: false,
    options: { temperature, ...(seed !== null ? { seed } : {}) },
    ...(json ? { format: 'json' } : {}),
  };
  const r = await fetch(`${OLLAMA}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(90_000),
  });
  return (await r.json()).response?.trim() ?? '';
}

// ─── Cache (multi-day JSON file) ─────────────────────────────────────────────

async function readCache() {
  try { return JSON.parse(await fs.readFile(CACHE, 'utf-8')); }
  catch { return {}; }
}
async function writeCache(cache) {
  await fs.writeFile(CACHE, JSON.stringify(cache, null, 2), 'utf-8').catch(() => {});
}

// ─── Puzzle generation ───────────────────────────────────────────────────────

const PUZZLE_PROMPT = (date) => `You are designing an extremely hard daily word puzzle called Venn for ${date}.

A player must find ONE English word that secretly fits three categories from completely different fields.
The categories must look totally unrelated at first glance — the "aha!" moment only comes once you already know the answer.

HARDNESS RULES (critical):
- Pick a word with multiple distinct meanings, homonyms, or surprising metaphorical uses
- Categories must span totally different domains: e.g. (anatomy + 19th-century literature + stock trading)
- Avoid obvious connections — if someone could guess the word from ONE category alone, it's too easy
- Do NOT use: fire, water, ice, sun, moon, star, red, blue, simple colors, basic animals
- Prefer: words where the connection only clicks after reflection

CATEGORY FORMAT:
- Exactly 1-4 words each
- Cryptic but fair — no direct synonyms or dictionary definitions
- Use "___ " blanks for fill-in-the-blank style clues

Return ONLY valid JSON, no other text:
{"targetWord":"WORD","category1":"phrase","category2":"phrase","category3":"phrase"}`;

async function generatePuzzle(date, random = false) {
  const seed = random ? Math.floor(Math.random() * 999999) : daysSince2024(date);
  const raw = await ask(PUZZLE_PROMPT(date), { json: true, seed, temperature: random ? 1.0 : 0.85 });
  const parsed = JSON.parse(raw);
  return {
    id: random ? `random-${Date.now()}` : date,
    targetWord: String(parsed.targetWord ?? parsed.target_word ?? '').toUpperCase().trim(),
    category1:  String(parsed.category1).trim(),
    category2:  String(parsed.category2).trim(),
    category3:  String(parsed.category3).trim(),
    aiGenerated: true,
  };
}

// Get or create a deterministic puzzle for a given date
async function puzzleForDate(date) {
  const cache = await readCache();
  if (cache[date]?.targetWord) return cache[date];

  const puzzle = await generatePuzzle(date);
  cache[date] = puzzle;
  // Prune cache older than 60 days
  const cutoff = dayOffset(todayStr(), -60);
  for (const k of Object.keys(cache)) { if (k < cutoff) delete cache[k]; }
  await writeCache(cache);
  return puzzle;
}

// ─── Routes ─────────────────────────────────────────────────────────────────

// GET /api/puzzle  — today's puzzle (same for everyone with same seed)
app.get('/api/puzzle', async (_req, res) => {
  if (!await ollamaRunning()) return res.status(503).json({ error: 'ollama_offline' });
  try { res.json(await puzzleForDate(todayStr())); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/puzzle/:date  — specific past date
app.get('/api/puzzle/:date', async (req, res) => {
  if (!await ollamaRunning()) return res.status(503).json({ error: 'ollama_offline' });
  try { res.json(await puzzleForDate(req.params.date)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/puzzle/random  — fresh random puzzle, not cached
app.post('/api/puzzle/random', async (_req, res) => {
  if (!await ollamaRunning()) return res.status(503).json({ error: 'ollama_offline' });
  try { res.json(await generatePuzzle(todayStr(), true)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/puzzles/list  — last 30 days for Past Games screen
app.get('/api/puzzles/list', async (_req, res) => {
  const today = todayStr();
  const dates = Array.from({ length: 30 }, (_, i) => dayOffset(today, -(i + 1)));
  // Return metadata only (no answers), so the frontend can show the calendar
  res.json(dates.map(date => ({ date })));
});

// POST /api/grade  — score how strongly guess fits each category (0-3 each)
// Returns { s1, s2, s3 } — used to compute continuous Venn position on client
app.post('/api/grade', async (req, res) => {
  const { guess, category1, category2, category3 } = req.body ?? {};
  if (!await ollamaRunning()) return res.status(503).json({ error: 'ollama_offline' });

  const prompt = `Word puzzle grading. Rate how strongly the word/concept "${guess}" connects to each category.

Category 1: ${category1}
Category 2: ${category2}
Category 3: ${category3}

Scoring:
0 = no connection at all
1 = loose or creative connection
2 = moderate, clear connection
3 = strong, direct connection

Be generous — consider all meanings, homonyms, metaphors, and wordplay.

Return ONLY JSON: {"s1":0-3,"s2":0-3,"s3":0-3}`;

  try {
    const raw = await ask(prompt, { json: true, temperature: 0.3 });
    const { s1, s2, s3 } = JSON.parse(raw);
    res.json({ s1: clamp(s1), s2: clamp(s2), s3: clamp(s3) });
  } catch (e) {
    res.status(500).json({ s1: 0, s2: 0, s3: 0, error: e.message });
  }
});

function clamp(v) { return Math.max(0, Math.min(3, Math.round(Number(v) || 0))); }

// POST /api/hint  — generate a cryptic hint (hintNumber 1-3 gives different angles)
app.post('/api/hint', async (req, res) => {
  const { targetWord, category1, category2, category3, hintNumber = 1 } = req.body ?? {};
  if (!await ollamaRunning()) return res.status(503).json({ error: 'ollama_offline' });

  const angles = [
    `Give a thematic or etymological hint pointing toward the word's essence without naming it.`,
    `Give a hint using wordplay, a pop-culture reference, or an analogy — from a completely different angle than the categories.`,
    `Give a more direct hint: reference the number of letters or give a rhyming clue or partial spelling like "_E_ _".`,
  ];

  const prompt = `You are writing hint #${hintNumber} for a word puzzle. The answer is "${targetWord}".

Categories: "${category1}" / "${category2}" / "${category3}"

Rules:
- NEVER use the word itself
- Do NOT paraphrase any category directly
- ${angles[(hintNumber - 1) % 3]}
- Max 20 words. Be clever and cryptic but ultimately fair.

Return ONLY the hint text, nothing else.`;

  try {
    const hint = await ask(prompt, { temperature: 0.9 });
    res.json({ hint: hint.replace(/^["']|["']$/g, '').trim() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Start ───────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n✅  Venn API  →  http://localhost:${PORT}`);
  console.log(`🤖  Model: ${MODEL}  (override: OLLAMA_MODEL=llama3.2:3b)`);
  console.log(`🌱  Seeded by date — same day always generates same puzzle\n`);
});
