/**
 * AirGestureSettingsModal.tsx - Modal for configuring contactless air gesture navigation and testing hand poses
 */

import React from 'react';
import {
  X,
  Hand,
  ThumbsUp,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Volume2,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import { AirGestureConfig, AirGestureType } from '../types/gestures';

interface AirGestureSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AirGestureConfig;
  onUpdateConfig: (cfg: Partial<AirGestureConfig>) => void;
  activeGesture: AirGestureType;
  isStreaming: boolean;
}

export const AirGestureSettingsModal: React.FC<AirGestureSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
  activeGesture,
  isStreaming,
}) => {
  if (!isOpen) return null;

  const gestureMappings = [
    {
      gesture: 'Open Palm',
      icon: <Hand size={16} className="text-amber-400" />,
      action: 'Hold to Toggle Camera (Start / Stop)',
      triggerType: 'Hold (900ms)',
    },
    {
      gesture: 'Thumbs Up',
      icon: <ThumbsUp size={16} className="text-emerald-400" />,
      action: 'Hold to Speak Naturalized Sentence (TTS)',
      triggerType: 'Hold (900ms)',
    },
    {
      gesture: 'Peace Sign (V)',
      icon: <Sparkles size={16} className="text-blue-400" />,
      action: 'Switch between Recognition & Practice Mode',
      triggerType: 'Instant (400ms)',
    },
    {
      gesture: 'Closed Fist',
      icon: <RotateCcw size={16} className="text-rose-400" />,
      action: 'Hold to Clear Sentence Buffer & Transcripts',
      triggerType: 'Hold (900ms)',
    },
    {
      gesture: 'Wave Left / Right',
      icon: <ArrowRight size={16} className="text-cyan-400" />,
      action: 'Advance / Revert Side Panel Tabs',
      triggerType: 'Swipe',
    },
  ];

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-container gesture-settings-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <Hand size={18} className="modal-icon text-accent" />
            <h2 className="modal-title">Air Gesture Navigation</h2>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body gesture-modal-body">
          {/* Master Enable / Disable Toggle */}
          <div className="gesture-master-toggle-card">
            <div className="master-toggle-info">
              <span className="master-toggle-title">Contactless Gesture Control</span>
              <span className="master-toggle-desc">
                Navigate the interface, speak sentences, and toggle modes completely hands-free.
              </span>
            </div>
            <label className="switch-toggle" aria-label="Toggle air gesture navigation">
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={(e) => onUpdateConfig({ enabled: e.target.checked })}
              />
              <span className="slider-round" />
            </label>
          </div>

          {/* Live Gesture Tester Card */}
          {isStreaming && config.enabled && (
            <div className="gesture-live-tester-card">
              <div className="tester-header">
                <span className="tester-title">Live Hand Pose Detector</span>
                <span className="tester-status-tag">
                  {activeGesture !== 'none' ? (
                    <span className="tag-active">
                      <CheckCircle2 size={12} />
                      {activeGesture}
                    </span>
                  ) : (
                    <span className="tag-idle">Show hand to test</span>
                  )}
                </span>
              </div>
            </div>
          )}

          {/* Action Mappings Reference Table */}
          <div className="gesture-mappings-section">
            <h3 className="section-title">Gesture Action Mappings</h3>
            <div className="gesture-mappings-list">
              {gestureMappings.map((m) => (
                <div key={m.gesture} className="gesture-mapping-item">
                  <div className="mapping-gesture-col">
                    {m.icon}
                    <span className="gesture-name">{m.gesture}</span>
                  </div>
                  <div className="mapping-action-col">
                    <span className="action-name">{m.action}</span>
                    <span className="action-trigger-type">{m.triggerType}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Fine-Tuning Controls */}
          {config.enabled && (
            <div className="gesture-controls-section">
              <h3 className="section-title">Timing & Feedback Controls</h3>

              {/* Hold Duration Slider */}
              <div className="gesture-control-row">
                <div className="control-label-group">
                  <Sliders size={14} className="text-text-muted" />
                  <label htmlFor="hold-duration">Hold Duration</label>
                  <span className="control-val mono-val">{config.holdDurationMs}ms</span>
                </div>
                <input
                  id="hold-duration"
                  type="range"
                  min="600"
                  max="1500"
                  step="50"
                  value={config.holdDurationMs}
                  onChange={(e) => onUpdateConfig({ holdDurationMs: Number(e.target.value) })}
                  className="range-input"
                />
              </div>

              {/* Cooldown Window Slider */}
              <div className="gesture-control-row">
                <div className="control-label-group">
                  <Sliders size={14} className="text-text-muted" />
                  <label htmlFor="cooldown-ms">Action Cooldown</label>
                  <span className="control-val mono-val">{config.cooldownMs}ms</span>
                </div>
                <input
                  id="cooldown-ms"
                  type="range"
                  min="800"
                  max="2500"
                  step="100"
                  value={config.cooldownMs}
                  onChange={(e) => onUpdateConfig({ cooldownMs: Number(e.target.value) })}
                  className="range-input"
                />
              </div>

              {/* Sound Feedback Toggle */}
              <div className="gesture-control-toggle-row">
                <div className="control-toggle-label">
                  <Volume2 size={14} className="text-text-muted" />
                  <span>Audio Feedback Chime on Trigger</span>
                </div>
                <label className="switch-toggle" aria-label="Toggle sound feedback">
                  <input
                    type="checkbox"
                    checked={config.soundFeedback}
                    onChange={(e) => onUpdateConfig({ soundFeedback: e.target.checked })}
                  />
                  <span className="slider-round" />
                </label>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
