import React, { useState } from 'react';
import { InferenceResult } from '../hooks/useInference';

interface PredictionBannerProps {
  prediction: InferenceResult | null;
  isStreaming: boolean;
  isModelReady: boolean;
  history: string[];
  onClearHistory: () => void;
  onOpenVocabulary: () => void;
  confidenceThreshold?: number;
}

export const PredictionBanner: React.FC<PredictionBannerProps> = ({
  prediction,
  isStreaming,
  isModelReady,
  history,
  onClearHistory,
  onOpenVocabulary,
  confidenceThreshold = 0.35,
}) => {
  const [copied, setCopied] = useState(false);

  const top1 = prediction?.top1;
  const isConfident = top1 ? top1.confidence >= confidenceThreshold : false;

  const handleCopyTranscript = () => {
    if (history.length === 0) return;
    navigator.clipboard.writeText(history.join(' '));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="prediction-panel">
      {/* Primary Top-1 Prediction Card */}
      <div className="card top1-card">
        <div className="card-header">
          <span className="card-title">CURRENT SIGN PREDICTION</span>
          {prediction && (
            <span className="latency-badge">
              ⚡ {prediction.latencyMs} ms
            </span>
          )}
        </div>

        <div className="top1-body">
          {!isStreaming ? (
            <div className="prediction-empty">
              <span className="empty-icon">🖐️</span>
              <p>Start webcam to begin sign recognition</p>
            </div>
          ) : !isModelReady ? (
            <div className="prediction-empty">
              <span className="loading-spinner" />
              <p>Loading ONNX inference engine...</p>
            </div>
          ) : top1 ? (
            <div className="top1-content">
              <div className="top1-word-row">
                <h2 className="top1-gloss">{top1.gloss.toUpperCase()}</h2>
                <div
                  className={`confidence-pill ${
                    isConfident ? 'high' : 'low'
                  }`}
                >
                  {top1.percentage}
                </div>
              </div>

              {/* Confidence progress bar */}
              <div className="confidence-track">
                <div
                  className={`confidence-fill ${
                    isConfident ? 'high' : 'low'
                  }`}
                  style={{ width: `${Math.min(top1.confidence * 100, 100)}%` }}
                />
              </div>

              <div className="confidence-label">
                <span>Confidence score</span>
                <span>{isConfident ? 'Confident match' : 'Low confidence (holding)'}</span>
              </div>
            </div>
          ) : (
            <div className="prediction-empty">
              <span className="empty-icon">⏳</span>
              <p>Make an ASL sign in front of the camera...</p>
            </div>
          )}
        </div>
      </div>

      {/* Top 5 Candidates Breakdown */}
      <div className="card top5-card">
        <div className="card-header">
          <span className="card-title">TOP CANDIDATES</span>
          <button
            type="button"
            className="text-btn"
            onClick={onOpenVocabulary}
            title="Browse all 100 signs"
          >
            📖 100-Sign Vocabulary
          </button>
        </div>

        <div className="top5-list">
          {prediction && prediction.top5.length > 0 ? (
            prediction.top5.map((item, index) => {
              const widthPct = Math.max(item.confidence * 100, 2);
              return (
                <div key={item.gloss} className="candidate-row">
                  <div className="candidate-rank">#{index + 1}</div>
                  <div className="candidate-name">{item.gloss}</div>
                  <div className="candidate-bar-wrapper">
                    <div
                      className="candidate-bar"
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                  <div className="candidate-score">{item.percentage}</div>
                </div>
              );
            })
          ) : (
            <div className="top5-placeholder">
              <span>Candidate probabilities will rank here</span>
            </div>
          )}
        </div>
      </div>

      {/* Recognized Words Transcript / History */}
      <div className="card history-card">
        <div className="card-header">
          <span className="card-title">CAPTIONS / TRANSCRIPT</span>
          <div className="history-actions">
            {history.length > 0 && (
              <>
                <button
                  type="button"
                  className="action-btn"
                  onClick={handleCopyTranscript}
                >
                  {copied ? '✓ Copied' : '📋 Copy'}
                </button>
                <button
                  type="button"
                  className="action-btn"
                  onClick={onClearHistory}
                >
                  🗑 Clear
                </button>
              </>
            )}
          </div>
        </div>

        <div className="history-body">
          {history.length > 0 ? (
            <div className="history-chips">
              {history.map((word, i) => (
                <span key={`${word}-${i}`} className="word-chip">
                  {word}
                </span>
              ))}
            </div>
          ) : (
            <p className="history-empty">
              Detected confident signs are automatically appended here as live captions.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};