import { useState, useCallback } from 'react';
import {
  PracticeTarget,
  PracticeStats,
  DifficultyTier,
  getRandomTarget,
  PracticeFeedback,
} from '../types/practice';

interface UsePracticeEngineOptions {
  initialDifficulty?: DifficultyTier;
}

export function usePracticeEngine({
  initialDifficulty = 'all',
}: UsePracticeEngineOptions = {}) {
  const [difficulty, setDifficultyState] = useState<DifficultyTier>(initialDifficulty);
  const [target, setTarget] = useState<PracticeTarget>(() => getRandomTarget(initialDifficulty));

  const [stats, setStats] = useState<PracticeStats>({
    streak: 0,
    bestStreak: 0,
    completedCount: 0,
    totalAttempts: 0,
    accuracy: 100,
    sessionStartTime: Date.now(),
  });

  const [recentHistory, setRecentHistory] = useState<PracticeFeedback[]>([]);

  // Advance to next target
  const nextTarget = useCallback(() => {
    setTarget((prev) => getRandomTarget(difficulty, prev.gloss));
  }, [difficulty]);

  // Skip target (resets current streak)
  const skipTarget = useCallback(() => {
    setStats((prev) => {
      const newAttempts = prev.totalAttempts + 1;
      const newAccuracy = Math.round((prev.completedCount / newAttempts) * 100);
      return {
        ...prev,
        streak: 0,
        totalAttempts: newAttempts,
        accuracy: newAccuracy,
      };
    });
    nextTarget();
  }, [nextTarget]);

  // Change difficulty tier
  const setDifficulty = useCallback((newTier: DifficultyTier) => {
    setDifficultyState(newTier);
    setTarget(getRandomTarget(newTier));
  }, []);

  // Reset entire practice session
  const resetSession = useCallback(() => {
    setStats({
      streak: 0,
      bestStreak: 0,
      completedCount: 0,
      totalAttempts: 0,
      accuracy: 100,
      sessionStartTime: Date.now(),
    });
    setRecentHistory([]);
    setTarget(getRandomTarget(difficulty));
  }, [difficulty]);

  return {
    target,
    difficulty,
    stats,
    recentHistory,
    setRecentHistory,
    setStats,
    nextTarget,
    skipTarget,
    setDifficulty,
    resetSession,
  };
}