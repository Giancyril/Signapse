import { useState, useCallback, useRef, useEffect } from 'react';
import { SentenceSegment } from '../types/speech';
import { naturalizeGlosses } from '../lib/glossNaturalizer';

interface UseSentenceBuilderOptions {
  autoCommitSilenceMs?: number; // Time of no new signs before sentence finalizes (default: 2200ms)
  onSentenceFinalized?: (sentence: string, segment: SentenceSegment) => void;
  isEnabled?: boolean;
}

export function useSentenceBuilder({
  autoCommitSilenceMs = 2200,
  onSentenceFinalized,
  isEnabled = true,
}: UseSentenceBuilderOptions = {}) {
  const [currentGlosses, setCurrentGlosses] = useState<string[]>([]);
  const [customEditedText, setCustomEditedText] = useState<string | null>(null);
  const [sentenceHistory, setSentenceHistory] = useState<SentenceSegment[]>([]);

  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const segmentStartTimeRef = useRef<number>(Date.now());
  const onSentenceFinalizedRef = useRef(onSentenceFinalized);
  onSentenceFinalizedRef.current = onSentenceFinalized;

  // Real-time naturalized preview of current buffer
  const previewSentence = customEditedText !== null
    ? customEditedText
    : naturalizeGlosses(currentGlosses);

  // Helper to format timestamp HH:MM:SS
  const getFormattedTime = () => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };

  // Finalize current buffer into a sentence segment
  const finalizeCurrentSentence = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    setCurrentGlosses((prevGlosses) => {
      if (prevGlosses.length === 0) return [];

      const finalText = customEditedText !== null
        ? customEditedText
        : naturalizeGlosses(prevGlosses);

      if (!finalText || !finalText.trim()) return [];

      const newSegment: SentenceSegment = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        rawGlosses: [...prevGlosses],
        naturalizedText: finalText,
        startTimestamp: segmentStartTimeRef.current,
        endTimestamp: Date.now(),
        formattedTime: getFormattedTime(),
        isSpoken: false,
      };

      setSentenceHistory((prev) => [...prev, newSegment]);

      if (onSentenceFinalizedRef.current) {
        onSentenceFinalizedRef.current(finalText, newSegment);
      }

      setCustomEditedText(null);
      segmentStartTimeRef.current = Date.now();
      return [];
    });
  }, [customEditedText]);

  // Add a new confirmed gloss from live recognition
  const addGloss = useCallback((gloss: string) => {
    if (!isEnabled || !gloss || !gloss.trim()) return;
    const clean = gloss.trim().toLowerCase();

    // Start timer on first word
    setCurrentGlosses((prev) => {
      if (prev.length === 0) {
        segmentStartTimeRef.current = Date.now();
      }
      return [...prev, clean];
    });

    setCustomEditedText(null);

    // Reset silence timer
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }

    // Auto-commit if terminal sign
    if (clean === 'finish') {
      silenceTimerRef.current = setTimeout(() => {
        finalizeCurrentSentence();
      }, 500);
    } else {
      silenceTimerRef.current = setTimeout(() => {
        finalizeCurrentSentence();
      }, autoCommitSilenceMs);
    }
  }, [isEnabled, autoCommitSilenceMs, finalizeCurrentSentence]);

  // Remove the last gloss added
  const removeLastGloss = useCallback(() => {
    setCurrentGlosses((prev) => prev.slice(0, -1));
    setCustomEditedText(null);
  }, []);

  // Clear current active buffer without saving
  const clearActiveBuffer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    setCurrentGlosses([]);
    setCustomEditedText(null);
  }, []);

  // Clear all past sentences
  const clearAllSentences = useCallback(() => {
    clearActiveBuffer();
    setSentenceHistory([]);
  }, [clearActiveBuffer]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    };
  }, []);

  return {
    currentGlosses,
    previewSentence,
    sentenceHistory,
    setSentenceHistory,
    addGloss,
    removeLastGloss,
    clearActiveBuffer,
    finalizeCurrentSentence,
    clearAllSentences,
    setCustomEditedText,
  };
}