import React, { useState, useMemo } from 'react';
import { LABELS } from '../lib/labels';

interface VocabularyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectWord?: (word: string) => void;
}

export const VocabularyModal: React.FC<VocabularyModalProps> = ({
  isOpen,
  onClose,
  onSelectWord,
}) => {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return LABELS;
    const q = search.toLowerCase();
    return LABELS.filter((w) => w.toLowerCase().includes(q));
  }, [search]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-header">
          <div className="modal-title-group">
            <h3>WLASL100 Vocabulary Reference</h3>
            <span className="vocab-badge">{LABELS.length} Signs</span>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <div className="modal-subtext">
          This model is trained on 100 isolated American Sign Language words from the WLASL dataset. Practice any of these signs in front of the camera:
        </div>

        <div className="modal-search-wrapper">
          <input
            type="text"
            className="modal-search-input"
            placeholder="Search sign vocabulary (e.g., 'book', 'drink', 'help')..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
          {search && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => setSearch('')}
            >
              ✕
            </button>
          )}
        </div>

        <div className="vocab-grid">
          {filtered.length > 0 ? (
            filtered.map((word) => (
              <button
                key={word}
                type="button"
                className="vocab-card"
                onClick={() => {
                  if (onSelectWord) onSelectWord(word);
                  onClose();
                }}
              >
                <span className="vocab-idx">#{LABELS.indexOf(word) + 1}</span>
                <span className="vocab-word">{word}</span>
              </button>
            ))
          ) : (
            <div className="vocab-no-results">
              No signs match &quot;{search}&quot;.
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};