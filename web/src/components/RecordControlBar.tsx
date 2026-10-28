import React from 'react';
import { Circle, Square, Timer } from 'lucide-react';

interface RecordControlBarProps {
  isRecording: boolean;
  elapsedMs: number;
  durationLimitMs: number;
  isStreaming: boolean;
  onStartRecording: (limitMs?: number) => void;
  onStopRecording: () => void;
  onSelectDuration: (ms: number) => void;
}

export const RecordControlBar: React.FC<RecordControlBarProps> = ({
  isRecording,
  elapsedMs,
  durationLimitMs,
  isStreaming,
  onStartRecording,
  onStopRecording,
  onSelectDuration,
}) => {
  const formatTime = (ms: number) => {
    const sec = (ms / 1000).toFixed(1);
    return `${sec}s`;
  };

  const progressPct = Math.min(100, Math.round((elapsedMs / durationLimitMs) * 100));

  return (
    <div className={`record-control-bar ${isRecording ? 'recording' : ''}`} role="region" aria-label="Clip recording controls">
      {isRecording ? (
        <div className="active-recording-view">
          <div className="recording-indicator-group">
            <span className="recording-live-dot" />
            <span className="recording-title">REC</span>
            <span className="recording-timer mono-val">
              {formatTime(elapsedMs)} / {formatTime(durationLimitMs)}
            </span>
          </div>

          {/* Linear Countdown Progress Track */}
          <div className="recording-progress-track">
            <div
              className="recording-progress-bar"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <button
            type="button"
            className="btn-secondary stop-rec-btn"
            onClick={onStopRecording}
            title="Stop recording clip (R)"
          >
            <Square size={13} strokeWidth={2} />
            <span>Stop</span>
          </button>
        </div>
      ) : (
        <div className="idle-recording-view">
          <button
            type="button"
            className="btn-secondary start-rec-btn"
            onClick={() => onStartRecording()}
            disabled={!isStreaming}
            title={isStreaming ? 'Record sign clip (R)' : 'Start camera first to record'}
          >
            <Circle size={12} strokeWidth={3} className="rec-dot-icon" />
            <span>Record Clip</span>
          </button>

          <div className="duration-pill-group" role="group" aria-label="Recording length">
            <Timer size={13} strokeWidth={1.75} className="timer-icon" />
            {[3000, 4000, 6000].map((dur) => (
              <button
                key={dur}
                type="button"
                className={`duration-pill-btn ${durationLimitMs === dur ? 'active' : ''}`}
                onClick={() => onSelectDuration(dur)}
                aria-pressed={durationLimitMs === dur}
                disabled={isRecording}
                title={`Set clip duration limit to ${dur / 1000} seconds`}
              >
                {dur / 1000}s
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};