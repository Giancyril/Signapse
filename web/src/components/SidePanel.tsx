import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Copy, Trash2, Search, Check } from 'lucide-react';
import { InferenceResult } from '../hooks/useInference';
import { LABELS } from '../lib/labels';

export interface TranscriptItem {
  id: string;
  word: string;
  timestamp: string; // HH:MM:SS
}

interface SidePanelProps {
  prediction: InferenceResult | null;
  confidenceThreshold: number;
  transcript: TranscriptItem[];
  onClearTranscript: () => void;
  activeTab: 'transcript' | 'vocabulary';
  onTabChange: (tab: 'transcript' | 'vocabulary') => void;
  isStreaming: boolean;
}

export const SidePanel: React.FC<SidePanelProps> = ({
  prediction,
  confidenceThreshold,
  transcript,
  onClearTranscript,
  activeTab,
  onTabChange,
  isStreaming,
}) => {
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut '/' to focus vocabulary search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        onTabChange('vocabulary');
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onTabChange]);

  const top1 = prediction?.top1;
  const isConfident = top1 ? top1.confidence >= confidenceThreshold : false;
  const top3 = prediction?.top5.slice(0, 3) || [];

  const filteredLabels = useMemo(() => {
    if (!search.trim()) return LABELS;
    const q = search.toLowerCase();
    return LABELS.filter((w) => w.toLowerCase().includes(q));
  }, [search]);

  const handleCopyTranscript = () => {
    if (transcript.length === 0) return;
    const text = transcript.map((t) => `${t.timestamp} ${t.word}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <aside className="side-panel" aria-label="Sign prediction and vocabulary details">
      {/* Card 1: Prediction */}
      <section className="panel-card prediction-card">
        <div className="card-header">
          <h2 className="panel-title">Prediction</h2>
          {isStreaming && top1 && (
            <span className="mono-val text-muted-small">
              Threshold: {Math.round(confidenceThreshold * 100)}%
            </span>
          )}
        </div>

        <div className="prediction-body">
          {!isStreaming ? (
            <div className="prediction-idle-state">
              <span className="idle-label">Waiting for camera</span>
            </div>
          ) : top1 ? (
            <>
              {/* Primary Top Word */}
              <div className="prediction-hero-row">
                <span className="hero-word">
                  {isConfident ? top1.gloss : 'Not sure'}
                </span>
                <span className="mono-val hero-percent">
                  {top1.percentage}
                </span>
              </div>

              {/* Top 3 candidate rows with flat 4px bars and vertical tick */}
              <div className="candidate-rows-container">
                {top3.map((cand, idx) => {
                  const widthPct = Math.min(Math.max(cand.confidence * 100, 0), 100);
                  const thresholdPct = Math.min(Math.max(confidenceThreshold * 100, 0), 100);

                  return (
                    <div key={`${cand.gloss}-${idx}`} className="candidate-item">
                      <div className="candidate-labels">
                        <span className="candidate-gloss">{cand.gloss}</span>
                        <span className="mono-val candidate-confidence">
                          {cand.percentage}
                        </span>
                      </div>

                      {/* 4px flat bar with threshold vertical tick */}
                      <div className="candidate-bar-track">
                        <div
                          className="candidate-bar-fill"
                          style={{ width: `${widthPct}%` }}
                        />
                        <div
                          className="candidate-bar-tick"
                          style={{ left: `${thresholdPct}%` }}
                          title={`Acceptance threshold (${Math.round(thresholdPct)}%)`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="prediction-idle-state">
              <span className="idle-label">Detecting sign gestures...</span>
            </div>
          )}
        </div>
      </section>

      {/* Card 2: Tabs (Transcript / Vocabulary) */}
      <section className="panel-card tabs-card">
        <div className="tabs-header" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'transcript'}
            className={`tab-btn ${activeTab === 'transcript' ? 'active' : ''}`}
            onClick={() => onTabChange('transcript')}
          >
            Transcript
            {transcript.length > 0 && (
              <span className="tab-badge">{transcript.length}</span>
            )}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'vocabulary'}
            className={`tab-btn ${activeTab === 'vocabulary' ? 'active' : ''}`}
            onClick={() => onTabChange('vocabulary')}
          >
            Vocabulary
            <span className="tab-badge">100</span>
          </button>
        </div>

        {/* Tab 1: Transcript */}
        {activeTab === 'transcript' && (
          <div className="tab-content transcript-tab" role="tabpanel">
            <div className="transcript-actions">
              <span className="transcript-count text-muted-small">
                {transcript.length} {transcript.length === 1 ? 'word' : 'words'}
              </span>
              <div className="action-buttons-group">
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={handleCopyTranscript}
                  disabled={transcript.length === 0}
                  title="Copy transcript to clipboard"
                >
                  {copied ? (
                    <>
                      <Check size={14} strokeWidth={1.75} />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} strokeWidth={1.75} />
                      <span>Copy</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={onClearTranscript}
                  disabled={transcript.length === 0}
                  title="Clear transcript"
                >
                  <Trash2 size={14} strokeWidth={1.75} />
                  <span>Clear</span>
                </button>
              </div>
            </div>

            <div className="transcript-scroll-area">
              {transcript.length > 0 ? (
                <ul className="transcript-list">
                  {transcript.map((item) => (
                    <li key={item.id} className="transcript-row">
                      <span className="mono-val transcript-time">{item.timestamp}</span>
                      <span className="transcript-word">{item.word}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="transcript-empty">
                  <span>Confirmed signs will be logged here with timestamps.</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Vocabulary */}
        {activeTab === 'vocabulary' && (
          <div className="tab-content vocabulary-tab" role="tabpanel">
            <div className="vocabulary-search-box">
              <Search size={14} strokeWidth={1.75} className="search-icon" />
              <input
                ref={searchInputRef}
                type="search"
                className="vocab-search-input"
                placeholder="Search 100 signs... (Press /)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="vocabulary-scroll-area">
              <ul className="vocabulary-list">
                {filteredLabels.map((gloss) => {
                  const originalIndex = LABELS.indexOf(gloss) + 1;
                  return (
                    <li key={gloss} className="vocabulary-item">
                      <span className="mono-val vocab-idx">
                        {String(originalIndex).padStart(2, '0')}
                      </span>
                      <span className="vocab-word">{gloss}</span>
                    </li>
                  );
                })}
                {filteredLabels.length === 0 && (
                  <li className="vocab-no-results">
                    No signs matching &quot;{search}&quot;.
                  </li>
                )}
              </ul>
            </div>
          </div>
        )}
      </section>
    </aside>
  );
};