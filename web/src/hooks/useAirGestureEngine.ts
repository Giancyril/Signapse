/**
 * useAirGestureEngine.ts - React hook managing contactless air gesture detection, hold progress, cooldowns, and action dispatch
 */

import { useState, useCallback, useRef } from 'react';
import { LandmarkPoint } from '../types/recorder';
import {
  AirGestureType,
  AirGestureAction,
  AirGestureConfig,
  AirGestureState,
  GestureDetectionResult,
} from '../types/gestures';
import { classifyHandAirGesture } from '../lib/gestureEngine';

export interface UseAirGestureOptions {
  config?: Partial<AirGestureConfig>;
  onToggleCamera?: () => void;
  onToggleMode?: () => void;
  onSpeakSentence?: () => void;
  onClearBuffer?: () => void;
  onNextTab?: () => void;
  onPrevTab?: () => void;
}

const DEFAULT_CONFIG: AirGestureConfig = {
  enabled: true,
  holdDurationMs: 900,
  cooldownMs: 1400,
  soundFeedback: true,
  minimumConfidence: 0.80,
};

const DEFAULT_STATE: AirGestureState = {
  activeGesture: 'none',
  confidence: 0,
  holdProgressPercent: 0,
  isHolding: false,
  isCooldown: false,
  lastTriggeredAction: null,
  lastTriggeredAt: 0,
};

// Web Audio synthesizer for contactless gesture trigger chime
let audioCtx: AudioContext | null = null;
function playGestureChime() {
  try {
    if (typeof window === 'undefined') return;
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(659.25, audioCtx.currentTime); // E5
    osc.frequency.exponentialRampToValueAtTime(1046.50, audioCtx.currentTime + 0.12); // C6

    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.16);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.16);
  } catch {
    // Audio context may be restricted before user gesture
  }
}

export function useAirGestureEngine(options: UseAirGestureOptions = {}) {
  const [config, setConfig] = useState<AirGestureConfig>(() => {
    try {
      const saved = localStorage.getItem('signapse_air_gestures_config');
      return saved ? { ...DEFAULT_CONFIG, ...JSON.parse(saved), ...options.config } : { ...DEFAULT_CONFIG, ...options.config };
    } catch {
      return { ...DEFAULT_CONFIG, ...options.config };
    }
  });

  const [gestureState, setGestureState] = useState<AirGestureState>(DEFAULT_STATE);

  // References for tracking state across 30 FPS frames
  const currentCandidateRef = useRef<AirGestureType>('none');
  const candidateStartTimeRef = useRef<number>(0);
  const lastActionTimeRef = useRef<number>(0);

  const saveConfig = useCallback((newConfig: Partial<AirGestureConfig>) => {
    setConfig((prev) => {
      const updated = { ...prev, ...newConfig };
      try {
        localStorage.setItem('signapse_air_gestures_config', JSON.stringify(updated));
      } catch {
        // Ignored
      }
      return updated;
    });
  }, []);

  const triggerAction = useCallback(
    (action: AirGestureAction) => {
      const now = Date.now();
      lastActionTimeRef.current = now;

      if (config.soundFeedback) {
        playGestureChime();
      }

      setGestureState((prev) => ({
        ...prev,
        isCooldown: true,
        holdProgressPercent: 100,
        lastTriggeredAction: action,
        lastTriggeredAt: now,
      }));

      switch (action) {
        case 'toggle-camera':
          options.onToggleCamera?.();
          break;
        case 'toggle-mode':
          options.onToggleMode?.();
          break;
        case 'speak-sentence':
          options.onSpeakSentence?.();
          break;
        case 'clear-buffer':
          options.onClearBuffer?.();
          break;
        case 'next-tab':
          options.onNextTab?.();
          break;
        case 'prev-tab':
          options.onPrevTab?.();
          break;
      }
    },
    [config.soundFeedback, options]
  );

  /**
   * Evaluates current hand landmarks for air gesture triggers
   */
  const processGestureFrame = useCallback(
    (
      leftHand: LandmarkPoint[] | null,
      rightHand: LandmarkPoint[] | null
    ) => {
      if (!config.enabled) {
        if (gestureState.activeGesture !== 'none') {
          setGestureState(DEFAULT_STATE);
        }
        return;
      }

      const now = Date.now();
      const timeSinceAction = now - lastActionTimeRef.current;
      const isCooldown = timeSinceAction < config.cooldownMs;

      // 1. Classify both hands (prioritize right hand, then left)
      let result: GestureDetectionResult = {
        gesture: 'none',
        confidence: 0,
        handedness: 'unknown',
        detectedAt: now,
      };

      if (rightHand && rightHand.length >= 21) {
        result = classifyHandAirGesture(rightHand, 'right');
      }
      if (result.gesture === 'none' && leftHand && leftHand.length >= 21) {
        result = classifyHandAirGesture(leftHand, 'left');
      }

      const detected = result.gesture;
      const meetsConfidence = result.confidence >= config.minimumConfidence;

      if (isCooldown) {
        setGestureState((prev) => ({
          ...prev,
          activeGesture: meetsConfidence ? detected : 'none',
          confidence: result.confidence,
          isCooldown: true,
          holdProgressPercent: 0,
          isHolding: false,
        }));
        return;
      }

      // No gesture or low confidence
      if (!meetsConfidence || detected === 'none') {
        currentCandidateRef.current = 'none';
        candidateStartTimeRef.current = 0;
        setGestureState((prev) => ({
          ...prev,
          activeGesture: 'none',
          confidence: 0,
          isCooldown: false,
          holdProgressPercent: 0,
          isHolding: false,
        }));
        return;
      }

      // 2. Dynamic gestures (immediate action trigger: wave-left, wave-right, peace-sign)
      if (detected === 'wave-right') {
        triggerAction('next-tab');
        return;
      }
      if (detected === 'wave-left') {
        triggerAction('prev-tab');
        return;
      }
      if (detected === 'peace-sign') {
        // Requires slight hold (400ms) to avoid false trigger during two-finger signs
        if (currentCandidateRef.current !== 'peace-sign') {
          currentCandidateRef.current = 'peace-sign';
          candidateStartTimeRef.current = now;
        } else if (now - candidateStartTimeRef.current > 400) {
          triggerAction('toggle-mode');
        }
        return;
      }

      // 3. Sustained Hold gestures (open-palm, thumbs-up, fist)
      if (detected !== currentCandidateRef.current) {
        currentCandidateRef.current = detected;
        candidateStartTimeRef.current = now;
        setGestureState({
          activeGesture: detected,
          confidence: result.confidence,
          holdProgressPercent: 0,
          isHolding: true,
          isCooldown: false,
          lastTriggeredAction: gestureState.lastTriggeredAction,
          lastTriggeredAt: gestureState.lastTriggeredAt,
        });
      } else {
        const holdElapsed = now - candidateStartTimeRef.current;
        const progress = Math.min(100, Math.floor((holdElapsed / config.holdDurationMs) * 100));

        setGestureState((prev) => ({
          ...prev,
          activeGesture: detected,
          confidence: result.confidence,
          holdProgressPercent: progress,
          isHolding: true,
          isCooldown: false,
        }));

        if (progress >= 100) {
          let actionToTrigger: AirGestureAction = 'none';
          if (detected === 'open-palm') actionToTrigger = 'toggle-camera';
          if (detected === 'thumbs-up') actionToTrigger = 'speak-sentence';
          if (detected === 'fist') actionToTrigger = 'clear-buffer';

          if (actionToTrigger !== 'none') {
            triggerAction(actionToTrigger);
          }
        }
      }
    },
    [config, gestureState.lastTriggeredAction, gestureState.lastTriggeredAt, gestureState.activeGesture, triggerAction]
  );

  return {
    config,
    gestureState,
    updateConfig: saveConfig,
    processGestureFrame,
    triggerActionManually: triggerAction,
  };
}
