import React from 'react';
import { VideoOff, FlipHorizontal, Layers, Settings as SettingsIcon, AlertCircle } from 'lucide-react';
import { LandmarkTrackingState } from '../hooks/useLandmarks';
import { SuccessCelebration } from './SuccessCelebration';
import { HoldProgressRing } from './HoldProgressRing';
import { SpeakingVisualizer } from './SpeakingVisualizer';
import { RecordControlBar } from './RecordControlBar';
import { PracticeTarget, PracticeFeedback } from '../types/practice';
import { LightingQualityMeter } from './LightingQualityMeter';
import { LightingMetrics } from '../types/biometrics';
import { UserCheck } from 'lucide-react';

interface StageProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isStreaming: boolean;
  isLoading: boolean;
  error: string | null;
  onStartCamera: () => void;
  onStopCamera: () => void;
  isMirrored: boolean;
  onToggleMirror: () => void;
  showOverlay: boolean;
  onToggleOverlay: () => void;
  onOpenSettings: () => void;
  trackingState: LandmarkTrackingState;
  confirmedCaptions: string[];
  tentativeCaption: string | null;
  captionSize?: 'S' | 'M' | 'L';

  // Practice Mode props
  appMode?: 'recognize' | 'practice';
  practiceTarget?: PracticeTarget;
  holdProgress?: number;
  isHolding?: boolean;
  isSuccessCelebrating?: boolean;
  celebrationFeedback?: PracticeFeedback | null;
  practiceStreak?: number;
  currentConfidence?: number;
  isSpeaking?: boolean;
  previewSentence?: string;
  // Recording props
  isRecording?: boolean;
  onStartRecording?: (limitMs?: number) => void;
  onStopRecording?: () => void;
  recordingElapsedMs?: number;
  recordingDurationLimitMs?: number;
  onSelectRecordingDuration?: (ms: number) => void;
  lightingMetrics?: LightingMetrics;
  onOpenCalibration?: () => void;
  isCalibrated?: boolean;
}

export const Stage: React.FC<StageProps> = ({
  videoRef,
  canvasRef,
  isStreaming,
  isLoading,
  error,
  onStartCamera,
  onStopCamera,
  isMirrored,
  onToggleMirror,
  showOverlay,
  onToggleOverlay,
  onOpenSettings,
  trackingState,
  confirmedCaptions,
  tentativeCaption,
  captionSize = 'S',
  appMode = 'recognize',
  practiceTarget,
  holdProgress = 0,
  isHolding = false,
  isSuccessCelebrating = false,
  celebrationFeedback = null,
  practiceStreak = 0,
  currentConfidence = 0,
  isSpeaking = false,
  previewSentence = '',
  isRecording = false,
  onStartRecording,
  onStopRecording,
  recordingElapsedMs = 0,
  recordingDurationLimitMs = 4000,
  onSelectRecordingDuration,
  lightingMetrics,
  onOpenCalibration,
  isCalibrated = false,
}) => {
  // Determine camera state
  const cameraState: 'Off' | 'Starting' | 'Live' | 'Error' = error
    ? 'Error'
    : isLoading
    ? 'Starting'
    : isStreaming
    ? 'Live'
    : 'Off';

  const dotClass =
    cameraState === 'Live'
      ? 'ok'
      : cameraState === 'Starting'
      ? 'warn'
      : cameraState === 'Error'
      ? 'error'
      : 'neutral';

  // Live hint logic
  let liveHint: string | null = null;
  if (isStreaming) {
    if (!trackingState.hasPose && !trackingState.hasLeftHand && !trackingState.hasRightHand) {
      liveHint = 'Step back so upper body is visible';
    } else if (!trackingState.hasLeftHand && !trackingState.hasRightHand) {
      liveHint = 'Show both hands in frame';
    } else if (trackingState.hasLeftHand && !trackingState.hasRightHand) {
      liveHint = 'Left hand visible';
    } else if (!trackingState.hasLeftHand && trackingState.hasRightHand) {
      liveHint = 'Right hand visible';
    } else {
      liveHint = 'Tracking active';
    }
  }

  return (
    <section className="stage-panel" aria-label="Video stage and captions">
      {/* Top Toolbar */}
      <div className="stage-toolbar">
        <div className="camera-status-chip">
          <span className={`status-dot ${dotClass}`} aria-hidden="true" />
          <span className="camera-status-label">{cameraState}</span>
        </div>

        {/* Live REC chip */}
        {isRecording && (
          <span className="recording-status-chip" aria-live="polite">
            <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#EF4444', display: 'inline-block' }} />
            REC
          </span>
        )}

        {/* Lighting Quality Meter (live camera only) */}
        {isStreaming && lightingMetrics && (
          <LightingQualityMeter metrics={lightingMetrics} compact={true} />
        )}

        {/* Calibrated Profile status pill */}
        {isCalibrated && onOpenCalibration && (
          <button
            type="button"
            className="calibrated-status-pill"
            onClick={onOpenCalibration}
            title="Biometrics calibrated - Click to view profile"
          >
            <UserCheck size={12} className="text-accent" />
            <span>Calibrated</span>
          </button>
        )}

        <div className="stage-tools">
          {isStreaming && (
            <button
              type="button"
              className="btn-secondary"
              onClick={onStopCamera}
              title="Stop camera (Space)"
            >
              <VideoOff size={16} strokeWidth={1.75} />
              <span>Stop camera</span>
            </button>
          )}

          <button
            type="button"
            className="btn-toggle"
            aria-pressed={isMirrored}
            onClick={onToggleMirror}
            title="Mirror video (M)"
          >
            <FlipHorizontal size={16} strokeWidth={1.75} />
            <span>Mirror</span>
          </button>

          <button
            type="button"
            className="btn-toggle"
            aria-pressed={showOverlay}
            onClick={onToggleOverlay}
            title="Toggle landmark skeleton (L)"
          >
            <Layers size={16} strokeWidth={1.75} />
            <span>Landmarks</span>
          </button>

          <button
            type="button"
            className="btn-ghost btn-icon"
            onClick={onOpenSettings}
            title="Camera settings"
            aria-label="Camera settings"
          >
            <SettingsIcon size={16} strokeWidth={1.75} />
          </button>

          {/* Record Clip control - only shown when camera is live */}
          {isStreaming && (
            <RecordControlBar
              isRecording={isRecording}
              elapsedMs={recordingElapsedMs}
              durationLimitMs={recordingDurationLimitMs}
              isStreaming={isStreaming}
              onStartRecording={onStartRecording ?? (() => {})}
              onStopRecording={onStopRecording ?? (() => {})}
              onSelectDuration={onSelectRecordingDuration ?? (() => {})}
            />
          )}
        </div>
      </div>

      {/* 16:9 Video Viewport */}
      <div className="stage-viewport">
        <video
          ref={videoRef}
          className={`stage-video ${isMirrored ? 'mirrored' : ''}`}
          playsInline
          muted
          aria-hidden={!isStreaming}
        />
        <canvas
          ref={canvasRef}
          className={`stage-canvas ${isMirrored ? 'mirrored' : ''}`}
          aria-hidden="true"
        />

        {/* Live Hint Chip */}
        {isStreaming && liveHint && (
          <div className="live-hint-chip" role="status">
            <span>{liveHint}</span>
          </div>
        )}

        {/* Practice Mode Celebration Badge */}
        {appMode === 'practice' && (
          <SuccessCelebration feedback={celebrationFeedback} streak={practiceStreak} />
        )}

        {/* Empty State / Inactive */}
        {!isStreaming && !error && (
          <div className="stage-empty-state">
            <VideoOff size={32} strokeWidth={1.75} className="empty-icon" />
            <h2 className="empty-title">Camera is off</h2>
            <p className="empty-description">
              Sign recognition begins once your camera stream is active.
            </p>
            <span className="empty-subtext">
              Video is processed on this device and never uploaded.
            </span>
            <button
              type="button"
              className="btn-primary"
              onClick={onStartCamera}
              disabled={isLoading}
            >
              {isLoading ? 'Starting camera...' : 'Start camera'}
            </button>
          </div>
        )}

        {/* Permission Denied or Error State */}
        {error && (
          <div className="stage-error-state" role="alert">
            <AlertCircle size={32} strokeWidth={1.75} className="error-icon" />
            <h2 className="error-title">Camera access unavailable</h2>
            <p className="error-description">{error}</p>
            <span className="error-instructions">
              Please allow camera permission in your browser address bar settings and retry.
            </span>
            <button
              type="button"
              className="btn-secondary"
              onClick={onStartCamera}
            >
              Retry camera
            </button>
          </div>
        )}
      </div>

      {/* Bottom Area: Practice Hold Ring or Dictation Caption Strip */}
      {appMode === 'practice' && practiceTarget ? (
        <div className="practice-stage-footer">
          <HoldProgressRing
            progress={holdProgress}
            isHolding={isHolding}
            isCelebrating={isSuccessCelebrating}
            targetGloss={practiceTarget.gloss}
            currentDetectedGloss={tentativeCaption || (confirmedCaptions.length > 0 ? confirmedCaptions[confirmedCaptions.length - 1] : null)}
            confidence={currentConfidence}
          />
        </div>
      ) : (
        <div
          className={`caption-strip caption-size-${captionSize.toLowerCase()}`}
          aria-live="polite"
          aria-atomic="false"
        >
          <div className="caption-text-area">
            {isSpeaking && <SpeakingVisualizer size="sm" />}
            {previewSentence ? (
              <span className="caption-word confirmed">
                {previewSentence}
              </span>
            ) : confirmedCaptions.length === 0 && !tentativeCaption ? (
              <span className="caption-placeholder">
                Captions appear here when you sign.
              </span>
            ) : (
              <>
                {confirmedCaptions.map((word, index) => (
                  <span key={`${word}-${index}`} className="caption-word confirmed">
                    {word}{' '}
                  </span>
                ))}
                {tentativeCaption && (
                  <span className="caption-word tentative">
                    {tentativeCaption}
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
