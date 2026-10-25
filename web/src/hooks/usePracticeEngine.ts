import { useState, useCallback, useRef, useEffect } from 'react';
import {
  PracticeTarget,
  PracticeStats,
  DifficultyTier,
  getRandomTarget,
  PracticeFeedback,
} from '../types/practice';
import { InferenceResult } from './useInference';

interface UsePracticeEngineOptions {
  initialDifficulty?: DifficultyTier;
  confidenceThreshold?: number;
  requiredHoldMs?: number;
  prediction?: InferenceResult | null;
  isEnabled?: boolean;
}

export function usePracticeEngine({
  initialDifficulty = 'all',
  confidenceThreshold = 0.40,
  requiredHoldMs = 700,
  prediction = null,
  isEnabled = false,
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

  const [holdProgress, setHoldProgress] = useState<number>(0);
  const [isHolding, setIsHolding] = useState<boolean>(false);
  const [isSuccessCelebrating, setIsSuccessCelebrating] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<PracticeFeedback | null>(null);
  const [recentHistory, setRecentHistory] = useState<PracticeFeedback[]>([]);

  const holdStartTimeRef = useRef<number | null>(null);
  const isTransitioningRef = useRef<boolean>(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Synthesize a gentle success sound via Web Audio API
  const playSuccessChime = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.12); // E5
      osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.24); // G5

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.36);
    } catch {
      // Audio playback fails gracefully if blocked by browser policy
    }
  }, []);

  // Advance to next target
  const nextTarget = useCallback(() => {
    holdStartTimeRef.current = null;
    isTransitioningRef.current = false;
    setHoldProgress(0);
    setIsHolding(false);
    setIsSuccessCelebrating(false);
    setTarget((prev) => getRandomTarget(difficulty, prev.gloss));
  }, [difficulty]);

  // Skip target (resets current streak)
  const skipTarget = useCallback(() => {
    holdStartTimeRef.current = null;
    isTransitioningRef.current = false;
    setHoldProgress(0);
    setIsHolding(false);
    setIsSuccessCelebrating(false);

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
    holdStartTimeRef.current = null;
    isTransitioningRef.current = false;
    setHoldProgress(0);
    setIsHolding(false);
    setDifficultyState(newTier);
    setTarget(getRandomTarget(newTier));
  }, []);

  // Reset entire practice session
  const resetSession = useCallback(() => {
    holdStartTimeRef.current = null;
    isTransitioningRef.current = false;
    setHoldProgress(0);
    setIsHolding(false);
    setIsSuccessCelebrating(false);
    setStats({
      streak: 0,
      bestStreak: 0,
      completedCount: 0,
      totalAttempts: 0,
      accuracy: 100,
      sessionStartTime: Date.now(),
    });
    setRecentHistory([]);
    setFeedback(null);
    setTarget(getRandomTarget(difficulty));
  }, [difficulty]);

  // Temporal hold detection loop
  useEffect(() => {
    if (!isEnabled || isTransitioningRef.current || !prediction || !prediction.top1) {
      if (!isTransitioningRef.current && holdStartTimeRef.current !== null) {
        holdStartTimeRef.current = null;
        setHoldProgress(0);
        setIsHolding(false);
      }
      return;
    }

    const top = prediction.top1;
    const isMatching =
      top.gloss.toLowerCase() === target.gloss.toLowerCase() &&
      top.confidence >= confidenceThreshold;

    if (isMatching) {
      const now = performance.now();
      if (holdStartTimeRef.current === null) {
        holdStartTimeRef.current = now;
      }

      const elapsed = now - holdStartTimeRef.current;
      const progress = Math.min(1, elapsed / requiredHoldMs);
      setHoldProgress(progress);
      setIsHolding(true);

      if (progress >= 1 && !isTransitioningRef.current) {
        // Target mastered!
        isTransitioningRef.current = true;
        setIsSuccessCelebrating(true);
        playSuccessChime();

        const successItem: PracticeFeedback = {
          matchedWord: target.gloss,
          confidence: top.confidence,
          timestamp: Date.now(),
          success: true,
        };

        setFeedback(successItem);
        setRecentHistory((prev) => [successItem, ...prev.slice(0, 19)]);

        setStats((prev) => {
          const newStreak = prev.streak + 1;
          const newCompleted = prev.completedCount + 1;
          const newAttempts = prev.totalAttempts + 1;
          const newAccuracy = Math.round((newCompleted / newAttempts) * 100);
          return {
            ...prev,
            streak: newStreak,
            bestStreak: Math.max(prev.bestStreak, newStreak),
            completedCount: newCompleted,
            totalAttempts: newAttempts,
            accuracy: newAccuracy,
          };
        });

        // Automatically rotate to next word after celebration window
        setTimeout(() => {
          nextTarget();
        }, 850);
      }
    } else {
      if (holdStartTimeRef.current !== null) {
        holdStartTimeRef.current = null;
        setHoldProgress(0);
        setIsHolding(false);
      }
    }
  }, [
    prediction,
    target.gloss,
    confidenceThreshold,
    requiredHoldMs,
    isEnabled,
    nextTarget,
    playSuccessChime,
  ]);

  return {
    target,
    difficulty,
    stats,
    holdProgress,
    isHolding,
    isSuccessCelebrating,
    feedback,
    recentHistory,
    nextTarget,
    skipTarget,
    setDifficulty,
    resetSession,
  };
}