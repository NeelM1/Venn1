import React, { useState, useEffect, useCallback } from 'react';
import VennDiagram   from './components/VennDiagram';
import GuessInput    from './components/GuessInput';
import GuessList     from './components/GuessList';
import ResultModal   from './components/ResultModal';
import ModeSelector  from './components/ModeSelector';
import PastGames     from './components/PastGames';
import HintArea      from './components/HintArea';
import { fetchDailyPuzzle, fetchPastPuzzle, fetchRandomPuzzle } from './utils/fetchPuzzle';
import { gradeGuess }       from './utils/gradeGuess';
import { gradeClientSide }  from './utils/gradeClientSide';
import { loadProgress, saveProgress, recordResult, getStats } from './utils/storage';

const MAX_ATTEMPTS = 5;

export default function App() {
  // ── Navigation ─────────────────────────────────────────────────────────────
  const [mode,   setMode]   = useState('daily');          // daily | past | random
  const [screen, setScreen] = useState('game');           // game | past-list

  // ── Puzzle / game state ─────────────────────────────────────────────────────
  const [puzzle,        setPuzzle]        = useState(null);
  const [puzzleLoading, setPuzzleLoading] = useState(true);
  const [ollamaOnline,  setOllamaOnline]  = useState(false);
  const [guesses,       setGuesses]       = useState([]);
  const [gameOver,      setGameOver]      = useState(false);
  const [won,           setWon]           = useState(false);
  const [showModal,     setShowModal]     = useState(false);
  const [isGrading,     setIsGrading]     = useState(false);

  // ── Stats (streak etc.) ─────────────────────────────────────────────────────
  const [stats, setStats] = useState(getStats);

  // ── Load a puzzle and restore progress ─────────────────────────────────────
  const loadPuzzle = useCallback(async (fetchFn) => {
    setPuzzleLoading(true);
    setGuesses([]);
    setGameOver(false);
    setWon(false);
    setShowModal(false);

    const { puzzle: p, ollamaOnline: online } = await fetchFn();
    const saved = loadProgress(p.id);

    setPuzzle(p);
    setOllamaOnline(online);
    setGuesses(saved?.guesses ?? []);
    setGameOver(saved?.gameOver ?? false);
    setWon(saved?.won ?? false);
    if (saved?.gameOver) setShowModal(true);
    setPuzzleLoading(false);
  }, []);

  // Load daily puzzle on mount
  useEffect(() => { loadPuzzle(fetchDailyPuzzle); }, [loadPuzzle]);

  // ── Mode switching ─────────────────────────────────────────────────────────
  function handleModeChange(newMode) {
    if (newMode === 'daily') {
      setMode('daily');
      setScreen('game');
      loadPuzzle(fetchDailyPuzzle);
    } else if (newMode === 'random') {
      setMode('random');
      setScreen('game');
      loadPuzzle(fetchRandomPuzzle);
    } else {
      setMode('past');
      setScreen('past-list');
    }
  }

  function handlePastSelect(date) {
    setScreen('game');
    loadPuzzle(() => fetchPastPuzzle(date));
  }

  // ── Guessing ───────────────────────────────────────────────────────────────
  async function handleGuess(rawGuess) {
    if (!puzzle || gameOver || isGrading) return;

    const isCorrect =
      rawGuess.trim().toLowerCase() === puzzle.targetWord.toLowerCase();
    const guessIndex = guesses.length;

    // Optimistically add as pending
    const pending = { text: rawGuess.trim().toUpperCase(), correct: isCorrect, scores: null };
    setGuesses(prev => [...prev, pending]);
    setIsGrading(true);

    // Grade — scores 0-3 per circle
    let scores;
    if (isCorrect) {
      scores = { s1: 3, s2: 3, s3: 3 };
    } else if (ollamaOnline) {
      scores = await gradeGuess(rawGuess, puzzle.category1, puzzle.category2, puzzle.category3);
    } else {
      scores = gradeClientSide(rawGuess, puzzle);
    }

    const graded  = { ...pending, scores };
    const isOver  = isCorrect || guessIndex + 1 >= MAX_ATTEMPTS;

    setIsGrading(false);
    setGuesses(prev => {
      const next = [...prev];
      next[guessIndex] = graded;
      saveProgress(puzzle.id, next, isOver, isCorrect);
      return next;
    });

    if (isOver) {
      // Streak counts only for daily mode
      recordResult(isCorrect, mode);
      setStats(getStats());
      setWon(isCorrect);
      setGameOver(true);
      setTimeout(() => setShowModal(true), 500);
    }
  }

  // ── Render helpers ─────────────────────────────────────────────────────────

  const pageTitle = mode === 'random' ? 'Random Puzzle'
    : mode === 'past'  ? 'Past Game'
    : 'Daily Puzzle';

  if (puzzleLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 px-4">
        <h1 className="text-4xl font-black text-gray-800 tracking-tight">Venn</h1>
        <svg className="animate-spin h-8 w-8 text-indigo-400" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        <p className="text-sm text-gray-500">
          {mode === 'random' ? 'Generating a random puzzle…' : "Crafting today's puzzle…"}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center pt-6 pb-20 px-4">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="text-center mb-1 w-full max-w-sm">
        <div className="flex items-center justify-between">
          <div className="w-16" /> {/* spacer */}
          <h1 className="text-4xl font-black text-gray-800 tracking-tight">Venn</h1>
          {/* Streak pill */}
          {stats.streak > 0 && (
            <div className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 rounded-full px-2 py-1 border border-amber-200">
              🔥 {stats.streak}
            </div>
          )}
          {stats.streak === 0 && <div className="w-16" />}
        </div>
        <p className="text-gray-400 text-xs mt-0.5 tracking-wide">
          {mode === 'daily' ? 'Find the word that fits all three circles'
            : mode === 'random' ? 'A random puzzle — no streak impact'
            : 'Past puzzle — no streak impact'}
        </p>
      </header>

      {/* ── Mode selector ──────────────────────────────────────────────────── */}
      <ModeSelector active={mode === 'past' && screen === 'past-list' ? 'past' : mode}
        onChange={handleModeChange} />

      {/* ── Stats row ──────────────────────────────────────────────────────── */}
      {mode === 'daily' && (
        <div className="flex gap-4 mb-2 text-center">
          {[
            { label: 'Played',    val: stats.totalPlayed },
            { label: 'Won',       val: `${stats.winRate}%` },
            { label: 'Streak',    val: stats.streak },
            { label: 'Best',      val: stats.maxStreak },
          ].map(({ label, val }) => (
            <div key={label} className="flex flex-col">
              <span className="text-base font-black text-gray-800">{val}</span>
              <span className="text-[9px] text-gray-400 uppercase tracking-wide">{label}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Past-game list view ─────────────────────────────────────────────── */}
      {screen === 'past-list' ? (
        <PastGames onSelect={handlePastSelect} />
      ) : (
        <>
          {/* Offline banner */}
          {!ollamaOnline && (
            <div className="w-full max-w-sm mb-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-2 text-xs text-amber-700 text-center">
              <span className="font-semibold">Offline mode</span> — using a handcrafted puzzle.{' '}
              <a href="https://ollama.com" target="_blank" rel="noreferrer" className="underline">
                Install Ollama
              </a>{' '}
              for AI-generated daily puzzles.
            </div>
          )}

          {/* Venn diagram */}
          <VennDiagram puzzle={puzzle} won={won} guesses={guesses} />

          {/* Guess input */}
          {!gameOver && (
            <>
              <GuessInput
                onGuess={handleGuess}
                attemptsLeft={MAX_ATTEMPTS - guesses.length}
                isGrading={isGrading}
              />
              <HintArea puzzle={puzzle} ollamaOnline={ollamaOnline} />
            </>
          )}

          {gameOver && !showModal && (
            <button onClick={() => setShowModal(true)}
              className="mt-4 rounded-full bg-indigo-600 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">
              View results
            </button>
          )}

          <GuessList guesses={guesses} maxAttempts={MAX_ATTEMPTS} />

          {showModal && (
            <ResultModal
              puzzle={puzzle}
              guesses={guesses}
              won={won}
              stats={stats}
              mode={mode}
              onClose={() => setShowModal(false)}
              onPlayRandom={() => { setShowModal(false); handleModeChange('random'); }}
            />
          )}
        </>
      )}
    </div>
  );
}
