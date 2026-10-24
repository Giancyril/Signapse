import React from 'react';
import { Info } from 'lucide-react';

interface StatusBarProps {
  isStreaming: boolean;
  isMediaPipeReady: boolean;
  isModelReady: boolean;
  modelError: string | null;
  cameraError: string | null;
  fps: number;
  latencyMs: number;
  onOpenSystemDetails: () => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  isStreaming,
  isMediaPipeReady,
  isModelReady,
  modelError,
  cameraError,
  fps,
  latencyMs,
  onOpenSystemDetails,
}) => {
  // Determine single status summary with dot
  let statusText = 'Ready';
  let dotClass: 'ok' | 'warn' | 'error' = 'ok';

  if (modelError || cameraError) {
    statusText = 'System warning';
    dotClass = 'error';
  } else if (!isMediaPipeReady || !isModelReady) {
    statusText = 'Loading models';
    dotClass = 'warn';
  } else if (isStreaming) {
    statusText = 'Pipeline active';
    dotClass = 'ok';
  } else {
    statusText = 'Ready';
    dotClass = 'ok';
  }

  return (
    <footer className="app-status-bar" aria-label="System status bar">
      <div className="status-left">
        <button
          type="button"
          className="status-summary-btn"
          onClick={onOpenSystemDetails}
          title="View system runtime details"
        >
          <span className={`status-dot ${dotClass}`} aria-hidden="true" />
          <span className="status-summary-text">{statusText}</span>
          <Info size={14} strokeWidth={1.75} className="status-info-icon" />
        </button>
      </div>

      <div className="status-right">
        {/* FPS and latency shown ONLY while camera is live */}
        {isStreaming && (
          <div className="live-metrics-group">
            <span className="metric-item">
              <span className="metric-label">FPS</span>
              <span className="mono-val metric-value">{fps}</span>
            </span>
            <span className="metric-separator" aria-hidden="true">•</span>
            <span className="metric-item">
              <span className="metric-label">Latency</span>
              <span className="mono-val metric-value">
                {latencyMs > 0 ? `${latencyMs}ms` : '--'}
              </span>
            </span>
          </div>
        )}
      </div>
    </footer>
  );
};