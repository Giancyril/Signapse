/**
 * useLightingDiagnostics.ts - React hook for real-time video lighting and contrast analysis
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { LightingMetrics } from '../types/biometrics';
import { analyzeVideoLighting } from '../lib/lightingDiagnostics';

const DEFAULT_METRICS: LightingMetrics = {
  averageLuminance: 128,
  rmsContrast: 50,
  dynamicRange: 200,
  backlightRatio: 1.0,
  qualityScore: 'optimal',
  warningMessage: null,
  recommendedAction: null,
  measuredAt: 0,
};

export interface UseLightingDiagnosticsOptions {
  sampleIntervalMs?: number; // Default 800ms
  enabled?: boolean;
}

export function useLightingDiagnostics(
  videoRef: React.RefObject<HTMLVideoElement>,
  isStreaming: boolean,
  options: UseLightingDiagnosticsOptions = {}
) {
  const { sampleIntervalMs = 800, enabled = true } = options;
  const [metrics, setMetrics] = useState<LightingMetrics>(DEFAULT_METRICS);
  const timerRef = useRef<number | null>(null);

  const performCheck = useCallback((): LightingMetrics | null => {
    const video = videoRef.current;
    if (!video || !isStreaming || video.readyState < 2) return null;

    const result = analyzeVideoLighting(video);
    setMetrics(result);
    return result;
  }, [videoRef, isStreaming]);

  useEffect(() => {
    if (!isStreaming || !enabled) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    // Run first check after short delay once stream is active
    const initialTimer = window.setTimeout(() => {
      performCheck();
    }, 400);

    timerRef.current = window.setInterval(() => {
      performCheck();
    }, sampleIntervalMs);

    return () => {
      clearTimeout(initialTimer);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isStreaming, enabled, sampleIntervalMs, performCheck]);

  return {
    metrics,
    isOptimal: metrics.qualityScore === 'optimal',
    hasWarning: Boolean(metrics.warningMessage),
    checkLightingNow: performCheck,
  };
}
