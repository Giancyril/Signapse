/**
 * biometricsEngine.ts - Algorithms for signer body proportion estimation, scale normalization, and hand dominance detection
 */

import { LandmarkPoint } from '../types/recorder';
import { SignerMeasurements, SignerDominance, BiometricCalibrationProfile } from '../types/biometrics';

// Reference canonical adult signer proportions (normalized coordinate space)
const REFERENCE_SHOULDER_SPAN = 0.26;

function distance(p1: LandmarkPoint, p2: LandmarkPoint): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  const dz = (p1.z ?? 0) - (p2.z ?? 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Extracts signer body measurements from a MediaPipe 33-point pose landmark array
 */
export function extractMeasurementsFromPose(pose: LandmarkPoint[]): SignerMeasurements | null {
  if (!pose || pose.length < 25) return null;

  const leftShoulder = pose[11];
  const rightShoulder = pose[12];
  const leftElbow = pose[13];
  const rightElbow = pose[14];
  const leftWrist = pose[15];
  const rightWrist = pose[16];
  const leftHip = pose[23];
  const rightHip = pose[24];

  if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) return null;

  // 1. Shoulder Span
  const shoulderSpan = distance(leftShoulder, rightShoulder);
  if (shoulderSpan < 0.05) return null; // Unreliable or out of frame

  // 2. Arm spans (sum of segments)
  const leftArm = (leftElbow && leftWrist) ? distance(leftShoulder, leftElbow) + distance(leftElbow, leftWrist) : shoulderSpan * 0.9;
  const rightArm = (rightElbow && rightWrist) ? distance(rightShoulder, rightElbow) + distance(rightElbow, rightWrist) : shoulderSpan * 0.9;
  const totalArmReach = leftArm + rightArm + shoulderSpan;

  // 3. Torso Height (mid-shoulder to mid-hip)
  const midShoulder: LandmarkPoint = {
    x: (leftShoulder.x + rightShoulder.x) / 2,
    y: (leftShoulder.y + rightShoulder.y) / 2,
    z: ((leftShoulder.z ?? 0) + (rightShoulder.z ?? 0)) / 2,
  };
  const midHip: LandmarkPoint = {
    x: (leftHip.x + rightHip.x) / 2,
    y: (leftHip.y + rightHip.y) / 2,
    z: ((leftHip.z ?? 0) + (rightHip.z ?? 0)) / 2,
  };
  const torsoHeight = distance(midShoulder, midHip);

  // 4. Scale factor relative to canonical reference
  const scaleFactor = shoulderSpan > 0 ? REFERENCE_SHOULDER_SPAN / shoulderSpan : 1.0;

  return {
    shoulderSpan: parseFloat(shoulderSpan.toFixed(4)),
    armSpan: parseFloat(totalArmReach.toFixed(4)),
    torsoHeight: parseFloat(torsoHeight.toFixed(4)),
    dominantHand: 'right', // Default, refined during dominance test
    scaleFactor: parseFloat(Math.max(0.5, Math.min(2.0, scaleFactor)).toFixed(4)),
  };
}

/**
 * Evaluates hand dominance given cumulative wrist activity samples
 */
export function determineHandDominance(
  leftHandActivity: number,
  rightHandActivity: number
): SignerDominance {
  const total = leftHandActivity + rightHandActivity;
  if (total < 0.001) return 'right';

  const rightRatio = rightHandActivity / total;
  if (rightRatio > 0.62) return 'right';
  if (rightRatio < 0.38) return 'left';
  return 'ambidextrous';
}

/**
 * Creates a calibrated profile ready for persistence
 */
export function createCalibrationProfile(
  measurements: SignerMeasurements,
  dominantHand: SignerDominance,
  videoWidth = 640,
  videoHeight = 480
): BiometricCalibrationProfile {
  return {
    id: `calib_${Date.now()}`,
    calibratedAt: Date.now(),
    measurements: {
      ...measurements,
      dominantHand,
    },
    referenceResolution: {
      width: videoWidth,
      height: videoHeight,
    },
  };
}

/**
 * Applies biometric normalization to landmark coordinates
 */
export function applyBiometricNormalization<T extends LandmarkPoint>(
  points: T[],
  calibration: BiometricCalibrationProfile | null
): T[] {
  if (!calibration || !points || points.length === 0) return points;

  const scale = calibration.measurements.scaleFactor;
  // If scale is close to 1.0, bypass extra math
  if (Math.abs(scale - 1.0) < 0.02) return points;

  // Scale relative to centroid of the landmark set
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < points.length; i++) {
    cx += points[i].x;
    cy += points[i].y;
  }
  cx /= points.length;
  cy /= points.length;

  return points.map((p) => ({
    ...p,
    x: cx + (p.x - cx) * scale,
    y: cy + (p.y - cy) * scale,
    z: p.z != null ? p.z * scale : p.z,
  }));
}

