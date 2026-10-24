import React from 'react';
import { LandmarkTrackingState } from '../hooks/useLandmarks';

interface CameraViewProps {
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
  trackingState: LandmarkTrackingState;
  devices: MediaDeviceInfo[];
  activeDeviceId: string | null;
  onSelectDevice: (deviceId: string) => void;
}

export const CameraView: React.FC<CameraViewProps> = ({
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
  trackingState,
  devices,
  activeDeviceId,
  onSelectDevice,
}) => {
  return (
    <div className="camera-card">
      <div className="camera-header">
        <div className="camera-title-group">
          <span className={`status-pill ${isStreaming ? 'online' : 'offline'}`}>
            <span className="dot" />
            {isStreaming ? 'LIVE CAMERA' : 'CAMERA OFF'}
          </span>
          <span className="camera-fps">{trackingState.fps} FPS</span>
        </div>

        <div className="camera-quick-controls">
          {devices.length > 1 && (
            <select
              aria-label="Select camera device"
              className="device-select"
              value={activeDeviceId || ''}
              onChange={(e) => onSelectDevice(e.target.value)}
            >
              {devices.map((d, i) => (
                <option key={d.deviceId || i} value={d.deviceId}>
                  {d.label || `Camera ${i + 1}`}
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            className={`icon-btn ${isMirrored ? 'active' : ''}`}
            onClick={onToggleMirror}
            title={isMirrored ? 'Mirror mode ON' : 'Mirror mode OFF'}
          >
            ↔ Flip
          </button>

          <button
            type="button"
            className={`icon-btn ${showOverlay ? 'active' : ''}`}
            onClick={onToggleOverlay}
            title={showOverlay ? 'Hide skeleton' : 'Show skeleton'}
          >
            🦴 Skeleton
          </button>
        </div>
      </div>

      <div className="video-viewport">
        <video
          ref={videoRef}
          className={`camera-video ${isMirrored ? 'mirrored' : ''}`}
          playsInline
          muted
        />
        <canvas
          ref={canvasRef}
          className={`camera-canvas ${isMirrored ? 'mirrored' : ''}`}
        />

        {/* Framing Guide for the User */}
        {isStreaming && (
          <div className="framing-guide">
            <div className="guide-box">
              <span className="guide-label">Keep hands & chest in frame</span>
            </div>
          </div>
        )}

        {/* Active Landmark Detection Badges */}
        {isStreaming && (
          <div className="tracking-badges">
            <span
              className={`tracking-badge ${trackingState.hasLeftHand ? 'active cyan' : ''}`}
            >
              Left Hand
            </span>
            <span
              className={`tracking-badge ${trackingState.hasRightHand ? 'active amber' : ''}`}
            >
              Right Hand
            </span>
            <span
              className={`tracking-badge ${trackingState.hasPose ? 'active violet' : ''}`}
            >
              Upper Body
            </span>
          </div>
        )}

        {/* Not Streaming / Start State */}
        {!isStreaming && (
          <div className="camera-offline-overlay">
            <div className="offline-content">
              <div className="camera-icon-large">📹</div>
              <h3>Webcam Feed Inactive</h3>
              <p>
                Enable your camera to track MediaPipe landmarks and classify ASL signs in real-time.
              </p>
              {error && <div className="error-alert">{error}</div>}
              <button
                type="button"
                className="btn-primary start-btn"
                onClick={onStartCamera}
                disabled={isLoading}
              >
                {isLoading ? 'Starting Camera...' : 'Enable Webcam'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="camera-footer">
        {isStreaming ? (
          <button
            type="button"
            className="btn-secondary stop-btn"
            onClick={onStopCamera}
          >
            ⏹ Stop Camera
          </button>
        ) : (
          <button
            type="button"
            className="btn-primary"
            onClick={onStartCamera}
            disabled={isLoading}
          >
            ▶ Start Camera
          </button>
        )}
        <span className="footer-hint">
          Processed locally in your browser via WebAssembly & WebGPU/WebGL. No video is ever sent to a server.
        </span>
      </div>
    </div>
  );
};