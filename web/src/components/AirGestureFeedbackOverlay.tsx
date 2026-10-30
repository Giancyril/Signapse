/**
 * AirGestureFeedbackOverlay.tsx - Non-intrusive camera HUD overlay showing active gesture, hold ring, and triggered actions
 */

import React, { useEffect, useState } from 'react';
import {
  Hand,
  ThumbsUp,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Volume2,
  Video,
  Layers,
} from 'lucide-react';
import { AirGestureState, AirGestureType, AirGestureAction } from '../types/gestures';

interface AirGestureFeedbackOverlayProps {
  state: AirGestureState;
  enabled: boolean;
}

export const AirGestureFeedbackOverlay: React.FC<AirGestureFeedbackOverlayProps> = ({
  state,
  enabled,
}) => {
  const [showToast, setShowToast] = useState(false);
  const [toastAction, setToastAction] = useState<AirGestureAction | null>(null);

  // Trigger brief celebration toast when an action fires
  useEffect(() => {
    if (state.lastTriggeredAction && state.lastTriggeredAction !== 'none') {
      setToastAction(state.lastTriggeredAction);
      setShowToast(true);
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 1400);
      return () => clearTimeout(timer);
    }
  }, [state.lastTriggeredAction, state.lastTriggeredAt]);

  if (!enabled) return null;

  const { activeGesture, holdProgressPercent, isHolding, isCooldown } = state;

  const getGestureMeta = (gesture: AirGestureType) => {
    switch (gesture) {
      case 'open-palm':
        return {
          icon: <Hand size={18} className="text-amber-300" />,
          label: 'Hold: Toggle Camera',
          actionIcon: <Video size={14} />,
        };
      case 'thumbs-up':
        return {
          icon: <ThumbsUp size={18} className="text-emerald-400" />,
          label: 'Hold: Speak Sentence',
          actionIcon: <Volume2 size={14} />,
        };
      case 'peace-sign':
        return {
          icon: <Sparkles size={18} className="text-blue-400" />,
          label: 'Toggle Practice Mode',
          actionIcon: <Layers size={14} />,
        };
      case 'fist':
        return {
          icon: <RotateCcw size={18} className="text-rose-400" />,
          label: 'Hold: Clear Buffer',
          actionIcon: <RotateCcw size={14} />,
        };
      case 'wave-right':
        return {
          icon: <ArrowRight size={18} className="text-cyan-400" />,
          label: 'Next Tab',
          actionIcon: <ArrowRight size={14} />,
        };
      case 'wave-left':
        return {
          icon: <ArrowLeft size={18} className="text-cyan-400" />,
          label: 'Prev Tab',
          actionIcon: <ArrowLeft size={14} />,
        };
      default:
        return null;
    }
  };

  const getActionLabel = (action: AirGestureAction | null) => {
    switch (action) {
      case 'toggle-camera':
        return 'Camera Toggled';
      case 'speak-sentence':
        return 'Spoke Sentence';
      case 'toggle-mode':
        return 'Switched App Mode';
      case 'clear-buffer':
        return 'Buffer Cleared';
      case 'next-tab':
        return 'Next Tab';
      case 'prev-tab':
        return 'Previous Tab';
      default:
        return 'Action Triggered';
    }
  };

  const currentMeta = getGestureMeta(activeGesture);

  return (
    <div className="air-gesture-overlay" aria-live="polite">
      {/* 1. Action Triggered Toast Notification */}
      {showToast && toastAction && (
        <div className="gesture-action-toast">
          <Sparkles size={14} className="text-accent" />
          <span>{getActionLabel(toastAction)}</span>
        </div>
      )}

      {/* 2. Active Hold Progress Ring HUD */}
      {currentMeta && !isCooldown && (
        <div className="gesture-indicator-badge">
          <div className="gesture-progress-ring-wrap">
            <svg className="gesture-ring-svg" viewBox="0 0 44 44">
              <circle className="gesture-ring-bg" cx="22" cy="22" r="18" />
              {isHolding && (
                <circle
                  className="gesture-ring-fill"
                  cx="22"
                  cy="22"
                  r="18"
                  strokeDasharray={113}
                  strokeDashoffset={113 - (113 * holdProgressPercent) / 100}
                />
              )}
            </svg>
            <div className="gesture-ring-icon">{currentMeta.icon}</div>
          </div>
          <span className="gesture-indicator-label">{currentMeta.label}</span>
        </div>
      )}
    </div>
  );
};
