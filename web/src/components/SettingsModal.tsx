import React from 'react';
import { X } from 'lucide-react';

export type ThemeOption = 'system' | 'light' | 'dark' | 'high-contrast';
export type CaptionSize = 'S' | 'M' | 'L';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  devices: MediaDeviceInfo[];
  activeDeviceId: string | null;
  onSelectDevice: (id: string) => void;
  confidenceThreshold: number;
  onChangeThreshold: (val: number) => void;
  captionSize: CaptionSize;
  onChangeCaptionSize: (size: CaptionSize) => void;
  theme: ThemeOption;
  onChangeTheme: (theme: ThemeOption) => void;
  showDebugStats: boolean;
  onToggleDebugStats: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  devices,
  activeDeviceId,
  onSelectDevice,
  confidenceThreshold,
  onChangeThreshold,
  captionSize,
  onChangeCaptionSize,
  theme,
  onChangeTheme,
  showDebugStats,
  onToggleDebugStats,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal-box settings-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-dialog-title"
      >
        <div className="modal-header">
          <h2 id="settings-dialog-title" className="modal-title">Settings</h2>
          <button
            type="button"
            className="btn-ghost btn-icon"
            onClick={onClose}
            aria-label="Close settings dialog"
          >
            <X size={16} strokeWidth={1.75} />
          </button>
        </div>

        <div className="modal-body settings-body">
          {/* Theme Option */}
          <div className="setting-row">
            <div className="setting-label-col">
              <span className="setting-name">Theme</span>
              <span className="setting-desc">Color palette and contrast mode</span>
            </div>
            <div className="segmented-control" role="radiogroup" aria-label="Theme selection">
              {(['system', 'light', 'dark', 'high-contrast'] as ThemeOption[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  role="radio"
                  aria-checked={theme === t}
                  className={`segment-btn ${theme === t ? 'active' : ''}`}
                  onClick={() => onChangeTheme(t)}
                >
                  {t === 'system'
                    ? 'System'
                    : t === 'light'
                    ? 'Light'
                    : t === 'dark'
                    ? 'Dark'
                    : 'Contrast'}
                </button>
              ))}
            </div>
          </div>

          {/* Camera Select */}
          {devices.length > 0 && (
            <div className="setting-row">
              <div className="setting-label-col">
                <span className="setting-name">Camera device</span>
                <span className="setting-desc">Select input video source</span>
              </div>
              <select
                aria-label="Camera device"
                value={activeDeviceId || ''}
                onChange={(e) => onSelectDevice(e.target.value)}
                className="setting-select"
              >
                {devices.map((d, idx) => (
                  <option key={d.deviceId || idx} value={d.deviceId}>
                    {d.label || `Camera ${idx + 1}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Confidence Acceptance Threshold */}
          <div className="setting-row">
            <div className="setting-label-col">
              <span className="setting-name">Confidence threshold</span>
              <span className="setting-desc">
                Minimum score to confirm a sign in captions
              </span>
            </div>
            <div className="slider-container">
              <input
                type="range"
                min="0.10"
                max="0.80"
                step="0.05"
                value={confidenceThreshold}
                onChange={(e) => onChangeThreshold(parseFloat(e.target.value))}
                className="setting-slider"
                aria-label="Confidence threshold"
              />
              <span className="mono-val slider-val">
                {Math.round(confidenceThreshold * 100)}%
              </span>
            </div>
          </div>

          {/* Caption Size */}
          <div className="setting-row">
            <div className="setting-label-col">
              <span className="setting-name">Caption size</span>
              <span className="setting-desc">Text size in the main caption strip</span>
            </div>
            <div className="segmented-control" role="radiogroup" aria-label="Caption size">
              {(['S', 'M', 'L'] as CaptionSize[]).map((sz) => (
                <button
                  key={sz}
                  type="button"
                  role="radio"
                  aria-checked={captionSize === sz}
                  className={`segment-btn ${captionSize === sz ? 'active' : ''}`}
                  onClick={() => onChangeCaptionSize(sz)}
                >
                  {sz === 'S' ? 'Small' : sz === 'M' ? 'Medium' : 'Large'}
                </button>
              ))}
            </div>
          </div>

          {/* Debug Stats Toggle */}
          <div className="setting-row">
            <div className="setting-label-col">
              <span className="setting-name">Developer stats</span>
              <span className="setting-desc">Show tensor shape and latency metrics</span>
            </div>
            <button
              type="button"
              className="btn-toggle"
              aria-pressed={showDebugStats}
              onClick={onToggleDebugStats}
            >
              {showDebugStats ? 'Visible' : 'Hidden'}
            </button>
          </div>

          {/* Keyboard Shortcuts Reference */}
          <div className="shortcuts-section">
            <span className="shortcuts-title">Keyboard shortcuts</span>
            <div className="shortcuts-grid">
              <div className="shortcut-item">
                <kbd>Space</kbd>
                <span>Start or stop camera</span>
              </div>
              <div className="shortcut-item">
                <kbd>M</kbd>
                <span>Mirror video</span>
              </div>
              <div className="shortcut-item">
                <kbd>L</kbd>
                <span>Toggle landmarks</span>
              </div>
              <div className="shortcut-item">
                <kbd>/</kbd>
                <span>Focus vocabulary search</span>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};