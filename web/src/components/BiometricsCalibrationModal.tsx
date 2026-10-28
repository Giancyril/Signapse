/**
 * BiometricsCalibrationModal.tsx - Interactive modal for signer body calibration and dominance settings
 */

import React from 'react';
import {
  X,
  UserCheck,
  RotateCcw,
  Sparkles,
  Camera,
  Play,
  Hand,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  BiometricCalibrationProfile,
  SignerDominance,
  CalibrationProgress,
  LightingMetrics,
} from '../types/biometrics';

interface BiometricsCalibrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  isStreaming: boolean;
  onStartCamera?: () => void;
  calibration: BiometricCalibrationProfile | null;
  isCalibrating: boolean;
  calibrationProgress: CalibrationProgress;
  onStartCalibration: () => void;
  onCancelCalibration: () => void;
  onResetCalibration: () => void;
  onUpdateDominance: (dominance: SignerDominance) => void;
  lightingMetrics: LightingMetrics;
}

export const BiometricsCalibrationModal: React.FC<BiometricsCalibrationModalProps> = ({
  isOpen,
  onClose,
  isStreaming,
  onStartCamera,
  calibration,
  isCalibrating,
  calibrationProgress,
  onStartCalibration,
  onCancelCalibration,
  onResetCalibration,
  onUpdateDominance,
  lightingMetrics,
}) => {
  if (!isOpen) return null;

  const { step, progressPercent, instruction } = calibrationProgress;

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-container biometrics-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <UserCheck size={18} className="modal-icon text-accent" />
            <h2 className="modal-title">Signer Biometrics & Calibration</h2>
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

        {/* Content Body */}
        <div className="modal-body biometrics-modal-body">
          {/* Active Calibration Wizard in Progress */}
          {isCalibrating ? (
            <div className="calibration-wizard-view">
              {/* Step Indicators */}
              <div className="calibration-steps-indicator">
                <div className={`calib-step-dot ${step === 'neutral-stance' ? 'active' : step !== 'intro' ? 'done' : ''}`}>
                  <span>1</span>
                  <label>Posture</label>
                </div>
                <div className="calib-step-line" />
                <div className={`calib-step-dot ${step === 'arm-reach' ? 'active' : step === 'hand-dominance' || step === 'complete' ? 'done' : ''}`}>
                  <span>2</span>
                  <label>Reach</label>
                </div>
                <div className="calib-step-line" />
                <div className={`calib-step-dot ${step === 'hand-dominance' ? 'active' : step === 'complete' ? 'done' : ''}`}>
                  <span>3</span>
                  <label>Dominance</label>
                </div>
              </div>

              {/* Central Instructional Card */}
              <div className="calibration-instruction-card">
                <div className="calib-progress-circle-wrap">
                  <svg className="calib-progress-svg" viewBox="0 0 100 100">
                    <circle className="calib-circle-bg" cx="50" cy="50" r="42" />
                    <circle
                      className="calib-circle-fill"
                      cx="50"
                      cy="50"
                      r="42"
                      strokeDasharray={264}
                      strokeDashoffset={264 - (264 * progressPercent) / 100}
                    />
                  </svg>
                  <div className="calib-circle-inner">
                    {step === 'neutral-stance' && <UserCheck size={28} className="text-accent" />}
                    {step === 'arm-reach' && <Sparkles size={28} className="text-accent" />}
                    {step === 'hand-dominance' && <Hand size={28} className="text-accent" />}
                    {step === 'complete' && <CheckCircle2 size={28} className="text-success" />}
                    <span className="calib-percent-text mono-val">{progressPercent}%</span>
                  </div>
                </div>

                <div className="calib-step-texts">
                  <h3 className="calib-step-title">
                    {step === 'neutral-stance' && 'Step 1: Neutral Posture'}
                    {step === 'arm-reach' && 'Step 2: Arm Extension Reach'}
                    {step === 'hand-dominance' && 'Step 3: Primary Hand Dominance'}
                    {step === 'complete' && 'Calibration Finished!'}
                  </h3>
                  <p className="calib-step-desc">{instruction}</p>
                </div>
              </div>

              <div className="calibration-wizard-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={onCancelCalibration}
                >
                  Cancel Calibration
                </button>
              </div>
            </div>
          ) : (
            /* Standard Profile View / Pre-calibration View */
            <div className="biometrics-profile-view">
              {/* Lighting precondition alert if lighting is poor */}
              {isStreaming && lightingMetrics.qualityScore !== 'optimal' && (
                <div className="biometrics-lighting-notice">
                  <AlertCircle size={14} className="flex-shrink-0" />
                  <span>
                    Camera lighting is currently <strong>{lightingMetrics.qualityScore}</strong>.
                    Calibrating in optimal lighting produces the highest tracking stability.
                  </span>
                </div>
              )}

              {/* Active Profile Card */}
              {calibration ? (
                <div className="calibrated-profile-card">
                  <div className="profile-card-header">
                    <div className="profile-badge-active">
                      <CheckCircle2 size={14} className="text-success" />
                      <span>Custom Biometrics Profile Active</span>
                    </div>
                    <span className="profile-timestamp mono-val">
                      {new Date(calibration.calibratedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="profile-metrics-grid">
                    <div className="profile-metric-tile">
                      <span className="tile-label">Shoulder Span</span>
                      <span className="tile-val mono-val">{calibration.measurements.shoulderSpan.toFixed(3)}</span>
                    </div>
                    <div className="profile-metric-tile">
                      <span className="tile-label">Arm Reach</span>
                      <span className="tile-val mono-val">{calibration.measurements.armSpan.toFixed(3)}</span>
                    </div>
                    <div className="profile-metric-tile">
                      <span className="tile-label">Torso Height</span>
                      <span className="tile-val mono-val">{calibration.measurements.torsoHeight.toFixed(3)}</span>
                    </div>
                    <div className="profile-metric-tile">
                      <span className="tile-label">Scale Factor</span>
                      <span className="tile-val mono-val">{calibration.measurements.scaleFactor.toFixed(2)}x</span>
                    </div>
                  </div>

                  {/* Hand Dominance Selector */}
                  <div className="dominance-selector-group">
                    <label className="dominance-label">Primary Signing Hand:</label>
                    <div className="dominance-pills">
                      {(['right', 'left', 'ambidextrous'] as SignerDominance[]).map((dom) => (
                        <button
                          key={dom}
                          type="button"
                          className={`dominance-pill ${calibration.measurements.dominantHand === dom ? 'active' : ''}`}
                          onClick={() => onUpdateDominance(dom)}
                        >
                          {dom === 'right' && 'Right Hand'}
                          {dom === 'left' && 'Left Hand'}
                          {dom === 'ambidextrous' && 'Ambidextrous'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="profile-actions-row">
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={onStartCalibration}
                      disabled={!isStreaming}
                    >
                      <RotateCcw size={14} />
                      <span>Recalibrate Profile</span>
                    </button>
                    <button
                      type="button"
                      className="btn-danger-outline"
                      onClick={onResetCalibration}
                    >
                      Reset to Default
                    </button>
                  </div>
                </div>
              ) : (
                /* Uncalibrated introduction */
                <div className="uncalibrated-intro-card">
                  <div className="uncalibrated-hero">
                    <UserCheck size={36} className="text-accent uncalib-hero-icon" />
                    <h3>Enhance Precision with Custom Body Calibration</h3>
                    <p>
                      Every signer has unique shoulder spans, arm lengths, and hand dominance.
                      Running a quick 6-second calibration normalizes landmark coordinates to
                      your exact proportions, boosting isolated sign accuracy.
                    </p>
                  </div>

                  {!isStreaming ? (
                    <div className="camera-required-notice">
                      <Camera size={16} />
                      <span>Start your camera first to enable signer calibration.</span>
                      {onStartCamera && (
                        <button
                          type="button"
                          className="btn-primary btn-sm"
                          onClick={onStartCamera}
                        >
                          <Play size={12} />
                          <span>Start Camera</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="start-calibration-action">
                      <button
                        type="button"
                        className="btn-primary btn-large"
                        onClick={onStartCalibration}
                      >
                        <Play size={15} />
                        <span>Begin 3-Step Calibration</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
