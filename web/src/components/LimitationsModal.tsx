import React from 'react';
import { X } from 'lucide-react';

interface LimitationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LimitationsModal: React.FC<LimitationsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal-box limitations-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="limitations-dialog-title"
      >
        <div className="modal-header">
          <h2 id="limitations-dialog-title" className="modal-title">
            Scope & Limitations
          </h2>
          <button
            type="button"
            className="btn-ghost btn-icon"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={16} strokeWidth={1.75} />
          </button>
        </div>

        <div className="modal-body limitations-body">
          <div className="limitations-section">
            <h3 className="section-heading">Word recognition, not translation</h3>
            <p className="section-text">
              This system classifies isolated ASL sign gestures from a 100-word vocabulary (WLASL100). It does not translate American Sign Language grammar, topicalization, directional verbs, or facial non-manual markers.
            </p>
          </div>

          <div className="limitations-section">
            <h3 className="section-heading">Framing and lighting conditions</h3>
            <p className="section-text">
              MediaPipe landmark detection requires reasonable front lighting and an unobstructed view of the upper torso and both hands. Backlighting or holding hands outside the frame prevents classification.
            </p>
          </div>

          <div className="limitations-section">
            <h3 className="section-heading">Hand occlusion</h3>
            <p className="section-text">
              Signs where one hand crosses directly in front of the other can cause temporary landmark swapping. Two-handed symmetrical signs function best when both hands remain distinct.
            </p>
          </div>

          <div className="limitations-section">
            <h3 className="section-heading">Client-side privacy</h3>
            <p className="section-text">
              All MediaPipe landmark extraction and ONNX model evaluation run locally inside your browser via WebAssembly. Camera video is never recorded or transmitted to any remote server.
            </p>
          </div>
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