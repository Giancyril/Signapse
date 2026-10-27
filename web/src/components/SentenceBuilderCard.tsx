import React, { useState } from 'react';
import { Sparkles, Volume2, CornerDownLeft, Trash2, Delete, Settings2, Check, Edit2 } from 'lucide-react';
import { SpeakingVisualizer } from './SpeakingVisualizer';

interface SentenceBuilderCardProps {
  currentGlosses: string[];
  previewSentence: string;
  isSpeaking: boolean;
  autoSpeak: boolean;
  onSpeak: (text: string) => void;
  onCommit: () => void;
  onClear: () => void;
  onRemoveLastGloss: () => void;
  onOpenSpeechSettings: () => void;
  onCustomEdit: (text: string) => void;
}

export const SentenceBuilderCard: React.FC<SentenceBuilderCardProps> = ({
  currentGlosses,
  previewSentence,
  isSpeaking,
  autoSpeak,
  onSpeak,
  onCommit,
  onClear,
  onRemoveLastGloss,
  onOpenSpeechSettings,
  onCustomEdit,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');

  const handleStartEdit = () => {
    setEditValue(previewSentence);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    onCustomEdit(editValue);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  return (
    <section className="sentence-builder-card" aria-label="Smart Sentence Builder">
      {/* Header */}
      <div className="builder-header">
        <div className="builder-title-group">
          <Sparkles size={15} strokeWidth={1.75} className="builder-icon" />
          <h2 className="builder-title">Sentence Builder</h2>
          <span className={`builder-tts-badge ${autoSpeak ? 'active' : ''}`}>
            TTS: {autoSpeak ? 'Auto' : 'Manual'}
          </span>
        </div>

        <div className="builder-header-actions">
          {isSpeaking && <SpeakingVisualizer size="sm" />}
          <button
            type="button"
            className="btn-ghost btn-icon builder-settings-btn"
            onClick={onOpenSpeechSettings}
            title="Speech synthesis & voice settings"
            aria-label="Speech settings"
          >
            <Settings2 size={15} strokeWidth={1.75} />
          </button>
        </div>
      </div>

      {/* Raw Gloss Stream Pills */}
      <div className="gloss-stream-container">
        <span className="gloss-stream-label">Glosses:</span>
        {currentGlosses.length === 0 ? (
          <span className="gloss-stream-placeholder">Sign words appear here...</span>
        ) : (
          <div className="gloss-pills-row">
            {currentGlosses.map((gloss, idx) => (
              <span key={`${gloss}-${idx}`} className="gloss-pill">
                {gloss}
              </span>
            ))}
            <button
              type="button"
              className="gloss-undo-btn"
              onClick={onRemoveLastGloss}
              title="Remove last signed word"
              aria-label="Remove last signed word"
            >
              <Delete size={12} strokeWidth={1.75} />
            </button>
          </div>
        )}
      </div>

      {/* Naturalized Sentence Hero */}
      <div className="naturalized-sentence-hero">
        {isEditing ? (
          <div className="sentence-edit-row">
            <input
              type="text"
              className="sentence-edit-input"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
            <button
              type="button"
              className="btn-primary edit-done-btn"
              onClick={handleSaveEdit}
              title="Save edited sentence"
            >
              <Check size={14} strokeWidth={2} />
            </button>
          </div>
        ) : (
          <div className="sentence-display-row">
            <p className="naturalized-text" aria-live="polite">
              {previewSentence || <span className="text-muted">Naturalized sentence appears as you sign.</span>}
            </p>
            {previewSentence && (
              <button
                type="button"
                className="btn-ghost btn-icon sentence-edit-btn"
                onClick={handleStartEdit}
                title="Edit sentence text"
                aria-label="Edit sentence text"
              >
                <Edit2 size={13} strokeWidth={1.75} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Controls Bar */}
      <div className="builder-actions-bar">
        <div className="left-actions">
          <button
            type="button"
            className="btn-primary speak-action-btn"
            onClick={() => onSpeak(previewSentence)}
            disabled={!previewSentence.trim()}
            title="Speak sentence aloud (S)"
          >
            <Volume2 size={15} strokeWidth={1.75} />
            <span>Speak</span>
          </button>

          <button
            type="button"
            className="btn-secondary commit-action-btn"
            onClick={onCommit}
            disabled={currentGlosses.length === 0}
            title="Finalize sentence to transcript (Enter)"
          >
            <CornerDownLeft size={14} strokeWidth={1.75} />
            <span>Commit</span>
          </button>
        </div>

        <button
          type="button"
          className="btn-ghost builder-clear-btn"
          onClick={onClear}
          disabled={currentGlosses.length === 0 && !previewSentence}
          title="Clear current sentence"
        >
          <Trash2 size={14} strokeWidth={1.75} />
          <span>Clear</span>
        </button>
      </div>
    </section>
  );
};