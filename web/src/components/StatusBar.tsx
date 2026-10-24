import React from 'react';

interface StatusBarProps {
  isStreaming: boolean;
  isMediaPipeReady: boolean;
  isModelReady: boolean;
  fps: number;
  latencyMs: number;
  numClasses: number;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  isStreaming,
  isMediaPipeReady,
  isModelReady,
  fps,
  latencyMs,
  numClasses,
}) => {
  return (
    <footer className="status-bar">
      <div className="status-indicators">
        <div className="status-item">
          <span
            className={`status-indicator ${
              isStreaming ? 'active-green' : 'inactive'
            }`}
          />
          <span className="status-text">
            Webcam: <strong>{isStreaming ? 'Active' : 'Off'}</strong>
          </span>
        </div>

        <div className="status-item">
          <span
            className={`status-indicator ${
              isMediaPipeReady ? 'active-green' : 'loading-yellow'
            }`}
          />
          <span className="status-text">
            MediaPipe:{' '}
            <strong>{isMediaPipeReady ? 'Ready' : 'Initializing...'}</strong>
          </span>
        </div>

        <div className="status-item">
          <span
            className={`status-indicator ${
              isModelReady ? 'active-green' : 'loading-yellow'
            }`}
          />
          <span className="status-text">
            ONNX Runtime:{' '}
            <strong>{isModelReady ? 'Ready' : 'Loading model...'}</strong>
          </span>
        </div>

        <div className="status-item">
          <span className="status-text">
            Model: <strong>TCN ({numClasses} ASL classes)</strong>
          </span>
        </div>
      </div>

      <div className="status-metrics">
        <span className="metric-chip">FPS: <strong>{fps}</strong></span>
        <span className="metric-chip">
          Latency: <strong>{latencyMs > 0 ? `${latencyMs} ms` : '--'}</strong>
        </span>
      </div>
    </footer>
  );
};