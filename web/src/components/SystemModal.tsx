import React from 'react';
import { X } from 'lucide-react';
import { NUM_CLASSES } from '../lib/labels';

interface SystemModalProps {
  isOpen: boolean;
  onClose: () => void;
  isMediaPipeReady: boolean;
  isModelReady: boolean;
  modelError: string | null;
  cameraError: string | null;
  fps: number;
  latencyMs: number;
}

export const SystemModal: React.FC<SystemModalProps> = ({
  isOpen,
  onClose,
  isMediaPipeReady,
  isModelReady,
  modelError,
  cameraError,
  fps,
  latencyMs,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal-box system-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="system-dialog-title"
      >
        <div className="modal-header">
          <h2 id="system-dialog-title" className="modal-title">
            System Runtime
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

        <div className="modal-body system-body">
          <div className="runtime-table">
            <div className="runtime-row">
              <span className="runtime-label">Vision engine</span>
              <span className="runtime-val">
                MediaPipe Tasks Vision 0.10.14 ({isMediaPipeReady ? 'Ready' : 'Initializing'})
              </span>
            </div>

            <div className="runtime-row">
              <span className="runtime-label">Inference runtime</span>
              <span className="runtime-val">
                ONNX Runtime Web WASM ({isModelReady ? 'Ready' : 'Loading model'})
              </span>
            </div>

            <div className="runtime-row">
              <span className="runtime-label">Model architecture</span>
              <span className="runtime-val">
                Temporal Convolutional Network (3 residual blocks, dilation 1-2-4)
              </span>
            </div>

            <div className="runtime-row">
              <span className="runtime-label">Feature representation</span>
              <span className="runtime-val mono-val">
                (1, T, 392) • 196 normalized + 196 velocity
              </span>
            </div>

            <div className="runtime-row">
              <span className="runtime-label">Vocabulary scale</span>
              <span className="runtime-val">
                {NUM_CLASSES} isolated ASL glosses (WLASL100)
              </span>
            </div>

            <div className="runtime-row">
              <span className="runtime-label">Client frame rate</span>
              <span className="runtime-val mono-val">
                {fps > 0 ? `${fps} FPS` : 'Inactive'}
              </span>
            </div>

            <div className="runtime-row">
              <span className="runtime-label">Forward pass latency</span>
              <span className="runtime-val mono-val">
                {latencyMs > 0 ? `${latencyMs} ms` : 'Inactive'}
              </span>
            </div>

            {(modelError || cameraError) && (
              <div className="runtime-row error-row">
                <span className="runtime-label">Errors</span>
                <span className="runtime-val error-val">
                  {modelError || cameraError}
                </span>
              </div>
            )}
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