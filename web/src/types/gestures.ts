/**
 * gestures.ts - Types and contracts for Contactless Air Gesture Navigation
 */

export type AirGestureType =
  | 'none'
  | 'open-palm'     // All fingers extended
  | 'thumbs-up'     // Thumb upright, fingers curled
  | 'thumbs-down'   // Thumb downward, fingers curled
  | 'peace-sign'    // Index and middle fingers extended (V sign)
  | 'fist'          // All fingers curled
  | 'wave-left'     // Dynamic horizontal swipe left
  | 'wave-right';   // Dynamic horizontal swipe right

export type AirGestureAction =
  | 'toggle-camera'      // Open Palm hold -> Start / Stop camera
  | 'speak-sentence'     // Thumbs Up hold -> Speak current naturalized sentence
  | 'toggle-mode'        // Peace Sign -> Switch between Recognize & Practice mode
  | 'clear-buffer'       // Fist hold -> Clear sentence builder & transcripts
  | 'next-tab'           // Wave Right -> Advance side panel tab
  | 'prev-tab'           // Wave Left -> Previous side panel tab
  | 'none';

export interface GestureDetectionResult {
  gesture: AirGestureType;
  confidence: number;
  handedness: 'left' | 'right' | 'unknown';
  detectedAt: number;
}

export interface AirGestureConfig {
  enabled: boolean;
  holdDurationMs: number; // ms required to trigger hold-based actions (default: 900ms)
  cooldownMs: number;     // ms cooldown after triggering an action (default: 1500ms)
  soundFeedback: boolean; // Play subtle audio tick/chime on trigger
  minimumConfidence: number; // 0.60 - 0.95
}

export interface AirGestureState {
  activeGesture: AirGestureType;
  confidence: number;
  holdProgressPercent: number; // 0 - 100
  isHolding: boolean;
  isCooldown: boolean;
  lastTriggeredAction: AirGestureAction | null;
  lastTriggeredAt: number;
}

export interface AirGestureActionMap {
  'open-palm': AirGestureAction;
  'thumbs-up': AirGestureAction;
  'peace-sign': AirGestureAction;
  'fist': AirGestureAction;
  'wave-right': AirGestureAction;
  'wave-left': AirGestureAction;
}
