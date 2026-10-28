/**
 * useSignerBiometrics.ts - React hook for signer calibration state, interactive calibration steps, and normalization
 */

import { useState, useCallback, useRef } from 'react';
import { LandmarkPoint } from '../types/recorder';
import {
  BiometricCalibrationProfile,
  SignerDominance,
  SignerMeasurements,
  CalibrationStep,
  CalibrationProgress,
} from '../types/biometrics';
import {
  extractMeasurementsFromPose,
  determineHandDominance,
  createCalibrationProfile,
  applyBiometricNormalization,
} from '../lib/biometricsEngine';

const STORAGE_KEY = 'signapse_signer_calibration';

export function useSignerBiometrics() {
  const [calibration, setCalibration] = useState<BiometricCalibrationProfile | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('chereme_signer_calibration');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [activeStep, setActiveStep] = useState<CalibrationStep>('intro');
  const [stepProgress, setStepProgress] = useState<number>(0);
  const [isCalibrating, setIsCalibrating] = useState<boolean>(false);

  // Accumulated sample buffers during calibration wizard
  const accumulatedMeasurementsRef = useRef<SignerMeasurements[]>([]);
  const leftHandActivityRef = useRef<number>(0);
  const rightHandActivityRef = useRef<number>(0);
  const stepStartTimestampRef = useRef<number>(0);

  // Save to localStorage whenever calibration updates
  const saveCalibration = useCallback((profile: BiometricCalibrationProfile) => {
    setCalibration(profile);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch {
      // Ignored
    }
  }, []);

  const resetCalibration = useCallback(() => {
    setCalibration(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignored
    }
  }, []);

  const updateDominance = useCallback(
    (dominance: SignerDominance) => {
      if (!calibration) return;
      const updated: BiometricCalibrationProfile = {
        ...calibration,
        measurements: {
          ...calibration.measurements,
          dominantHand: dominance,
        },
      };
      saveCalibration(updated);
    },
    [calibration, saveCalibration]
  );

  const startCalibration = useCallback(() => {
    setIsCalibrating(true);
    setActiveStep('neutral-stance');
    setStepProgress(0);
    accumulatedMeasurementsRef.current = [];
    leftHandActivityRef.current = 0;
    rightHandActivityRef.current = 0;
    stepStartTimestampRef.current = Date.now();
  }, []);

  const cancelCalibration = useCallback(() => {
    setIsCalibrating(false);
    setActiveStep('intro');
    setStepProgress(0);
    accumulatedMeasurementsRef.current = [];
  }, []);

  /**
   * Feeds live frame landmarks during the calibration wizard
   */
  const processCalibrationFrame = useCallback(
    (
      pose: LandmarkPoint[] | null,
      leftHand: LandmarkPoint[] | null,
      rightHand: LandmarkPoint[] | null
    ) => {
      if (!isCalibrating) return;

      const now = Date.now();
      const timeInStep = now - stepStartTimestampRef.current;

      // STEP 1: Neutral Stance (Hold posture steady for 2.0s)
      if (activeStep === 'neutral-stance') {
        if (!pose || pose.length < 25) {
          setStepProgress(0);
          return;
        }

        const measurements = extractMeasurementsFromPose(pose);
        if (measurements) {
          accumulatedMeasurementsRef.current.push(measurements);
        }

        const progress = Math.min(100, Math.floor((timeInStep / 2000) * 100));
        setStepProgress(progress);

        if (progress >= 100) {
          setActiveStep('arm-reach');
          setStepProgress(0);
          stepStartTimestampRef.current = Date.now();
        }
      }
      // STEP 2: Arm Reach (Stretch or move arms for 2.0s)
      else if (activeStep === 'arm-reach') {
        if (pose) {
          const measurements = extractMeasurementsFromPose(pose);
          if (measurements) {
            accumulatedMeasurementsRef.current.push(measurements);
          }
        }

        const progress = Math.min(100, Math.floor((timeInStep / 2000) * 100));
        setStepProgress(progress);

        if (progress >= 100) {
          setActiveStep('hand-dominance');
          setStepProgress(0);
          stepStartTimestampRef.current = Date.now();
        }
      }
      // STEP 3: Hand Dominance Detection (Sign or wave primary hand for 2.0s)
      else if (activeStep === 'hand-dominance') {
        if (leftHand && leftHand.length > 0) leftHandActivityRef.current += 1;
        if (rightHand && rightHand.length > 0) rightHandActivityRef.current += 1;

        const progress = Math.min(100, Math.floor((timeInStep / 2000) * 100));
        setStepProgress(progress);

        if (progress >= 100) {
          // Finalize measurements by averaging samples
          const samples = accumulatedMeasurementsRef.current;
          let avgShoulder = 0.26;
          let avgArm = 0.70;
          let avgTorso = 0.32;
          let avgScale = 1.0;

          if (samples.length > 0) {
            avgShoulder = samples.reduce((acc, m) => acc + m.shoulderSpan, 0) / samples.length;
            avgArm = samples.reduce((acc, m) => acc + m.armSpan, 0) / samples.length;
            avgTorso = samples.reduce((acc, m) => acc + m.torsoHeight, 0) / samples.length;
            avgScale = samples.reduce((acc, m) => acc + m.scaleFactor, 0) / samples.length;
          }

          const dominantHand = determineHandDominance(
            leftHandActivityRef.current,
            rightHandActivityRef.current
          );

          const finalMeasurements: SignerMeasurements = {
            shoulderSpan: parseFloat(avgShoulder.toFixed(4)),
            armSpan: parseFloat(avgArm.toFixed(4)),
            torsoHeight: parseFloat(avgTorso.toFixed(4)),
            dominantHand,
            scaleFactor: parseFloat(avgScale.toFixed(4)),
          };

          const newProfile = createCalibrationProfile(finalMeasurements, dominantHand);
          saveCalibration(newProfile);

          setActiveStep('complete');
          setStepProgress(100);
        }
      }
    },
    [isCalibrating, activeStep, saveCalibration]
  );

  const getStepInstruction = (): string => {
    switch (activeStep) {
      case 'intro':
        return 'Prepare to calibrate your posture, body scale, and hand dominance.';
      case 'neutral-stance':
        return 'Stand or sit upright facing the camera with shoulders level.';
      case 'arm-reach':
        return 'Extend your arms slightly outwards within camera view.';
      case 'hand-dominance':
        return 'Sign or wave naturally with your primary signing hand.';
      case 'complete':
        return 'Calibration complete! Your custom biometrics profile is active.';
    }
  };

  const currentProgress: CalibrationProgress = {
    step: activeStep,
    progressPercent: stepProgress,
    instruction: getStepInstruction(),
    isStable: stepProgress > 20,
    stepCompleted: activeStep === 'complete',
  };

  const normalizePoints = useCallback(
    <T extends LandmarkPoint>(points: T[]): T[] => {
      return applyBiometricNormalization(points, calibration);
    },
    [calibration]
  );

  return {
    calibration,
    isCalibrated: Boolean(calibration),
    isCalibrating,
    calibrationProgress: currentProgress,
    startCalibration,
    cancelCalibration,
    processCalibrationFrame,
    saveCalibration,
    resetCalibration,
    updateDominance,
    normalizePoints,
  };
}


