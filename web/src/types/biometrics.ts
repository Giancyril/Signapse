/**
 * biometrics.ts - Types for Signer Biometrics, Dominance Calibration, and Lighting Diagnostics
 */

export type LightingQualityScore = 'optimal' | 'low-light' | 'overexposed' | 'backlit' | 'high-contrast';

export interface LightingMetrics {
  averageLuminance: number; // 0 - 255
  rmsContrast: number; // 0 - 100
  dynamicRange: number; // 0 - 255
  backlightRatio: number; // center luminance vs background perimeter
  qualityScore: LightingQualityScore;
  warningMessage: string | null;
  recommendedAction: string | null;
  measuredAt: number;
}

export type SignerDominance = 'right' | 'left' | 'ambidextrous';

export interface SignerMeasurements {
  shoulderSpan: number; // Euclidean distance between landmarks 11 & 12
  armSpan: number; // Approximate reach wrist-to-wrist or shoulder-to-wrist
  torsoHeight: number; // Mid-shoulder to mid-hip distance
  dominantHand: SignerDominance;
  scaleFactor: number; // Normalized scale compared to reference model (1.0 = standard)
}

export interface BiometricCalibrationProfile {
  id: string;
  calibratedAt: number;
  measurements: SignerMeasurements;
  referenceResolution: {
    width: number;
    height: number;
  };
}

export type CalibrationStep =
  | 'intro'
  | 'neutral-stance' // Hold arms relaxed, detect torso & shoulder span
  | 'arm-reach' // Stretch arms outward to measure span
  | 'hand-dominance' // Wave or sign with primary hand
  | 'complete';

export interface CalibrationProgress {
  step: CalibrationStep;
  progressPercent: number; // 0 - 100
  instruction: string;
  isStable: boolean;
  stepCompleted: boolean;
}
