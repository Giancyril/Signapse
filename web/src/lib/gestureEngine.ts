/**
 * gestureEngine.ts - Geometric rule-based air gesture classifier from 2D/3D hand landmarks
 */

import { LandmarkPoint } from '../types/recorder';
import { AirGestureType, GestureDetectionResult } from '../types/gestures';

// Sliding window for dynamic horizontal wave detection
interface WristHistoryPoint {
  x: number;
  timestamp: number;
}

const wristHistory: WristHistoryPoint[] = [];
const HISTORY_WINDOW_MS = 300;

function dist(p1: LandmarkPoint, p2: LandmarkPoint): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Checks whether a non-thumb finger is extended relative to the wrist and PIP joint
 */
function isFingerExtended(
  wrist: LandmarkPoint,
  mcp: LandmarkPoint,
  pip: LandmarkPoint,
  tip: LandmarkPoint
): boolean {
  const distTip = dist(tip, wrist);
  const distPip = dist(pip, wrist);
  const distMcp = dist(mcp, wrist);

  // Tip must be significantly farther from wrist than PIP and MCP
  return distTip > distPip * 1.15 && distTip > distMcp * 1.35;
}

/**
 * Checks whether the thumb is extended outward or upward
 */
function isThumbExtended(
  mcp: LandmarkPoint,
  ip: LandmarkPoint,
  tip: LandmarkPoint,
  indexMcp: LandmarkPoint
): boolean {
  const distTip = dist(tip, mcp);
  const distIp = dist(ip, mcp);
  const distFromHand = dist(tip, indexMcp);

  return distTip > distIp * 1.1 && distFromHand > 0.08;
}

/**
 * Evaluates dynamic horizontal swipe / wave gesture from recent wrist positions
 */
function detectWaveGesture(wrist: LandmarkPoint, now: number): AirGestureType {
  wristHistory.push({ x: wrist.x, timestamp: now });

  // Prune history older than window
  while (wristHistory.length > 0 && now - wristHistory[0].timestamp > HISTORY_WINDOW_MS) {
    wristHistory.shift();
  }

  if (wristHistory.length < 4) return 'none';

  const oldest = wristHistory[0];
  const deltaX = wrist.x - oldest.x;
  const deltaTime = (now - oldest.timestamp) / 1000;
  const velocityX = deltaX / (deltaTime || 0.001);

  // Velocity threshold for deliberate swipe
  if (Math.abs(velocityX) > 0.65 && Math.abs(deltaX) > 0.12) {
    // Clear history to prevent duplicate triggers
    wristHistory.length = 0;
    return velocityX > 0 ? 'wave-right' : 'wave-left';
  }

  return 'none';
}

/**
 * Classifies 21 hand landmarks into a discrete air gesture
 */
export function classifyHandAirGesture(
  hand: LandmarkPoint[] | null,
  handedness: 'left' | 'right' | 'unknown' = 'unknown'
): GestureDetectionResult {
  const now = Date.now();

  if (!hand || hand.length < 21) {
    return {
      gesture: 'none',
      confidence: 0,
      handedness,
      detectedAt: now,
    };
  }

  const wrist = hand[0];
    const thumbMcp = hand[2];
  const thumbIp = hand[3];
  const thumbTip = hand[4];

  const indexMcp = hand[5];
  const indexPip = hand[6];
  const indexTip = hand[8];

  const middleMcp = hand[9];
  const middlePip = hand[10];
  const middleTip = hand[12];

  const ringMcp = hand[13];
  const ringPip = hand[14];
  const ringTip = hand[16];

  const pinkyMcp = hand[17];
  const pinkyPip = hand[18];
  const pinkyTip = hand[20];

  const thumbOpen = isThumbExtended(thumbMcp, thumbIp, thumbTip, indexMcp);
  const indexOpen = isFingerExtended(wrist, indexMcp, indexPip, indexTip);
  const middleOpen = isFingerExtended(wrist, middleMcp, middlePip, middleTip);
  const ringOpen = isFingerExtended(wrist, ringMcp, ringPip, ringTip);
  const pinkyOpen = isFingerExtended(wrist, pinkyMcp, pinkyPip, pinkyTip);

  const extendedCount = (indexOpen ? 1 : 0) + (middleOpen ? 1 : 0) + (ringOpen ? 1 : 0) + (pinkyOpen ? 1 : 0);

  // 1. Check for dynamic horizontal wave/swipe if hand is somewhat open
  if (extendedCount >= 3) {
    const wave = detectWaveGesture(wrist, now);
    if (wave !== 'none') {
      return {
        gesture: wave,
        confidence: 0.88,
        handedness,
        detectedAt: now,
      };
    }
  }

  // 2. Open Palm (All 4 fingers + thumb extended)
  if (extendedCount === 4 && thumbOpen) {
    return {
      gesture: 'open-palm',
      confidence: 0.92,
      handedness,
      detectedAt: now,
    };
  }

  // 3. Peace / Victory Sign (Index & Middle open, Ring & Pinky closed)
  if (indexOpen && middleOpen && !ringOpen && !pinkyOpen) {
    return {
      gesture: 'peace-sign',
      confidence: 0.90,
      handedness,
      detectedAt: now,
    };
  }

  // 4. Thumbs Up (Thumb pointing upward, all other fingers closed)
  const thumbPointingUp = thumbTip.y < thumbMcp.y && thumbTip.y < wrist.y;
  if (thumbOpen && thumbPointingUp && extendedCount === 0) {
    return {
      gesture: 'thumbs-up',
      confidence: 0.93,
      handedness,
      detectedAt: now,
    };
  }

  // 5. Thumbs Down (Thumb pointing downward, all other fingers closed)
  const thumbPointingDown = thumbTip.y > thumbMcp.y && thumbTip.y > wrist.y;
  if (thumbOpen && thumbPointingDown && extendedCount === 0) {
    return {
      gesture: 'thumbs-down',
      confidence: 0.88,
      handedness,
      detectedAt: now,
    };
  }

  // 6. Fist (All fingers curled tight)
  if (!thumbOpen && extendedCount === 0) {
    return {
      gesture: 'fist',
      confidence: 0.89,
      handedness,
      detectedAt: now,
    };
  }

  return {
    gesture: 'none',
    confidence: 0,
    handedness,
    detectedAt: now,
  };
}

