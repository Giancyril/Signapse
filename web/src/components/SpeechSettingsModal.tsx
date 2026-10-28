import React from 'react';
import { X, Volume2, Play } from 'lucide-react';
import { SpeechConfig, SpeechVoiceOption } from '../types/speech';

interface SpeechSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SpeechConfig;
  onUpdateConfig: (partial: Partial<SpeechConfig>) => void;
  voices: SpeechVoiceOption[];
  onTestVoice: (sampleText: string) => void;
  isSpeaking: boolean;
}

export const SpeechSettingsModal: React.FC<SpeechSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
  voices,
  onTestVoice,
  isSpeaking,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="speech-modal-title">
      <div className="modal-box speech-modal-box" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <Volume2 size={16} strokeWidth={1.75} className="modal-title-icon" />
            <h2 id="speech-modal-title" className="modal-title">Speech Synthesis Settings</h2>
          </div>
          <button
            type="button"
            className="btn-ghost btn-icon"
            onClick={onClose}
            aria-label="Close speech settings dialog"
          >
            <X size={16} strokeWidth={1.75} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Auto-Speak Toggle */}
          <div className="setting-row">
            <div className="setting-label-col">
              <span className="setting-name">Auto-Speak Sentences</span>
              <span className="setting-desc">
                Automatically read sentences aloud when finalized by silence or punctuation
              </span>
            </div>
            <button
              type="button"
              className="btn-toggle"
              aria-pressed={config.autoSpeak}
              onClick={() => onUpdateConfig({ autoSpeak: !config.autoSpeak })}
            >
              {config.autoSpeak ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          {/* Voice Selector */}
          <div className="setting-row voice-select-row">
            <div className="setting-label-col">
              <span className="setting-name">Voice</span>
              <span className="setting-desc">
                Select your preferred system synthesizer voice
              </span>
            </div>
            <select
              aria-label="Synthesizer voice"
              className="speech-voice-select"
              value={config.voiceURI || ''}
              onChange={(e) => onUpdateConfig({ voiceURI: e.target.value })}
            >
              {voices.length === 0 ? (
                <option value="">Default system voice</option>
              ) : (
                voices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang})
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Speech Rate Slider */}
          <div className="setting-row">
            <div className="setting-label-col">
              <span className="setting-name">Speech Rate</span>
              <span className="setting-desc">Playback speed: {config.rate}x</span>
            </div>
            <div className="slider-container">
              <input
                type="range"
                min="0.75"
                max="1.5"
                step="0.05"
                value={config.rate}
                onChange={(e) => onUpdateConfig({ rate: parseFloat(e.target.value) })}
                className="setting-slider"
                aria-label="Speech rate slider"
              />
              <span className="slider-val mono-val">{config.rate}x</span>
            </div>
          </div>

          {/* Speech Pitch Slider */}
          <div className="setting-row">
            <div className="setting-label-col">
              <span className="setting-name">Voice Pitch</span>
              <span className="setting-desc">Voice pitch level: {config.pitch}</span>
            </div>
            <div className="slider-container">
              <input
                type="range"
                min="0.7"
                max="1.3"
                step="0.05"
                value={config.pitch}
                onChange={(e) => onUpdateConfig({ pitch: parseFloat(e.target.value) })}
                className="setting-slider"
                aria-label="Voice pitch slider"
              />
              <span className="slider-val mono-val">{config.pitch}</span>
            </div>
          </div>

          {/* Volume Slider */}
          <div className="setting-row">
            <div className="setting-label-col">
              <span className="setting-name">Volume</span>
              <span className="setting-desc">Output loudness: {Math.round(config.volume * 100)}%</span>
            </div>
            <div className="slider-container">
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={config.volume}
                onChange={(e) => onUpdateConfig({ volume: parseFloat(e.target.value) })}
                className="setting-slider"
                aria-label="Speech volume slider"
              />
              <span className="slider-val mono-val">{Math.round(config.volume * 100)}%</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer speech-modal-footer">
          <button
            type="button"
            className="btn-secondary test-voice-btn"
            onClick={() => onTestVoice('Signapse speech synthesis is active and ready.')}
            disabled={isSpeaking}
            title="Play sample speech voice test"
          >
            <Play size={13} strokeWidth={2} />
            <span>{isSpeaking ? 'Playing...' : 'Test Voice'}</span>
          </button>

          <button
            type="button"
            className="btn-primary"
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
