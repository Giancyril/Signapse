import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Copy, Trash2, Search, Check, FileText, Download, Volume2 } from 'lucide-react';
import { InferenceResult } from '../hooks/useInference';
import { LABELS } from '../lib/labels';
import { TargetPromptCard } from './TargetPromptCard';
import { PracticeScoreboard } from './PracticeScoreboard';
import { SentenceBuilderCard } from './SentenceBuilderCard';
import { PracticeTarget, DifficultyTier, PracticeStats, PracticeFeedback } from '../types/practice';
import { SentenceSegment } from '../types/speech';

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

  // Practice Mode props
  appMode?: 'recognize' | 'practice';
  practiceTarget?: PracticeTarget;
  practiceDifficulty?: DifficultyTier;
  onChangePracticeDifficulty?: (tier: DifficultyTier) => void;
  onSkipPracticeTarget?: () => void;
  onNextPracticeTarget?: () => void;
  isHoldingPractice?: boolean;
  practiceStats?: PracticeStats;
  practiceHistory?: PracticeFeedback[];
  onResetPracticeSession?: () => void;

  // Sentence Builder & Speech props
  currentGlosses?: string[];
  previewSentence?: string;
  isSpeaking?: boolean;
  autoSpeak?: boolean;
  onSpeak?: (text: string) => void;
  onCommitSentence?: () => void;
  onClearSentence?: () => void;
  onRemoveLastGloss?: () => void;
  onOpenSpeechSettings?: () => void;
  onCustomEditSentence?: (text: string) => void;
  onExportTranscript?: (format: 'txt' | 'srt') => void;
  sentenceHistory?: SentenceSegment[];
}

export const SidePanel: React.FC<SidePanelProps> = ({
  prediction: _prediction,
  confidenceThreshold: _confidenceThreshold,
  transcript,
  onClearTranscript,
  activeTab,
  onTabChange,
  isStreaming: _isStreaming,
  appMode = 'recognize',
  practiceTarget,
  practiceDifficulty = 'all',
  onChangePracticeDifficulty,
  onSkipPracticeTarget,
  onNextPracticeTarget,
  isHoldingPractice = false,
  practiceStats,
  practiceHistory = [],
  onResetPracticeSession,
  currentGlosses = [],
  previewSentence = '',
  isSpeaking = false,
  autoSpeak = true,
  onSpeak,
  onCommitSentence,
  onClearSentence,
  onRemoveLastGloss,
  onOpenSpeechSettings,
  onCustomEditSentence,
  onExportTranscript,
  sentenceHistory = [],
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

  const filteredLabels = useMemo(() => {
    if (!search.trim()) return LABELS;
    const q = search.toLowerCase();
    return LABELS.filter((w) => w.toLowerCase().includes(q));
  }, [search]);

  const handleCopyTranscript = () => {
    if (sentenceHistory.length > 0) {
      const text = sentenceHistory.map((s) => `[${s.formattedTime}] ${s.naturalizedText}`).join('\n');
      navigator.clipboard.writeText(text);
    } else if (transcript.length > 0) {
      const text = transcript.map((t) => `${t.timestamp} ${t.word}`).join('\n');
      navigator.clipboard.writeText(text);
    } else {
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasContent = sentenceHistory.length > 0 || transcript.length > 0;

  return (
    <aside className="side-panel" aria-label="Sign prediction and vocabulary details">
      {/* Card 1: Practice Target Prompt OR Smart Sentence Builder */}
      {appMode === 'practice' && practiceTarget ? (
        <TargetPromptCard
          target={practiceTarget}
          difficulty={practiceDifficulty}
          onChangeDifficulty={onChangePracticeDifficulty ?? (() => {})}
          onSkip={onSkipPracticeTarget ?? (() => {})}
          onNext={onNextPracticeTarget ?? (() => {})}
          isHolding={isHoldingPractice}
        />
      ) : (
        <SentenceBuilderCard
          currentGlosses={currentGlosses}
          previewSentence={previewSentence}
          isSpeaking={isSpeaking}
          autoSpeak={autoSpeak}
          onSpeak={onSpeak ?? (() => {})}
          onCommit={onCommitSentence ?? (() => {})}
          onClear={onClearSentence ?? (() => {})}
          onRemoveLastGloss={onRemoveLastGloss ?? (() => {})}
          onOpenSpeechSettings={onOpenSpeechSettings ?? (() => {})}
          onCustomEdit={onCustomEditSentence ?? (() => {})}
        />
      )}

      {/* Card 2: Tabs (Transcript / Practice Stats / Vocabulary) */}
      <section className="panel-card tabs-card">
        <div className="tabs-header" role="tablist">
          {appMode === 'practice' ? (
            <button
              type="button"
              role="tab"
              aria-selected={activeTab !== 'vocabulary'}
              className={`tab-btn ${activeTab !== 'vocabulary' ? 'active' : ''}`}
              onClick={() => onTabChange('transcript')}
            >
              Practice Stats
              {practiceStats && practiceStats.completedCount > 0 && (
                <span className="tab-badge">{practiceStats.completedCount}</span>
              )}
            </button>
          ) : (
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'transcript'}
              className={`tab-btn ${activeTab === 'transcript' ? 'active' : ''}`}
              onClick={() => onTabChange('transcript')}
            >
              Transcript
              {sentenceHistory.length > 0 ? (
                <span className="tab-badge">{sentenceHistory.length}</span>
              ) : transcript.length > 0 ? (
                <span className="tab-badge">{transcript.length}</span>
              ) : null}
            </button>
          )}

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

        {/* Tab 1: Practice Stats or Transcript */}
        {activeTab !== 'vocabulary' && (
          appMode === 'practice' && practiceStats ? (
            <div className="tab-content practice-tab" role="tabpanel">
              <PracticeScoreboard
                stats={practiceStats}
                recentHistory={practiceHistory}
                onResetSession={onResetPracticeSession ?? (() => {})}
              />
            </div>
          ) : (
            <div className="tab-content transcript-tab" role="tabpanel">
              <div className="transcript-actions">
                <span className="transcript-count text-muted-small">
                  {sentenceHistory.length > 0
                    ? `${sentenceHistory.length} ${sentenceHistory.length === 1 ? 'sentence' : 'sentences'}`
                    : `${transcript.length} ${transcript.length === 1 ? 'word' : 'words'}`}
                </span>

                <div className="action-buttons-group">
                  {/* Export TXT */}
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => onExportTranscript?.('txt')}
                    disabled={!hasContent}
                    title="Export transcript as text file (.txt)"
                  >
                    <FileText size={13} strokeWidth={1.75} />
                    <span>TXT</span>
                  </button>

                  {/* Export SRT */}
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => onExportTranscript?.('srt')}
                    disabled={!hasContent}
                    title="Export timed subtitles (.srt)"
                  >
                    <Download size={13} strokeWidth={1.75} />
                    <span>SRT</span>
                  </button>

                  {/* Copy */}
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={handleCopyTranscript}
                    disabled={!hasContent}
                    title="Copy transcript to clipboard"
                  >
                    {copied ? (
                      <>
                        <Check size={13} strokeWidth={1.75} />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy size={13} strokeWidth={1.75} />
                        <span>Copy</span>
                      </>
                    )}
                  </button>

                  {/* Clear */}
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={onClearTranscript}
                    disabled={!hasContent}
                    title="Clear transcript"
                  >
                    <Trash2 size={13} strokeWidth={1.75} />
                    <span>Clear</span>
                  </button>
                </div>
              </div>

              <div className="transcript-scroll-area">
                {sentenceHistory.length > 0 ? (
                  <ul className="transcript-list sentence-list">
                    {sentenceHistory.map((s) => (
                      <li key={s.id} className="transcript-sentence-row">
                        <div className="sentence-row-top">
                          <span className="mono-val transcript-time">{s.formattedTime}</span>
                          <button
                            type="button"
                            className="btn-ghost btn-icon replay-speech-btn"
                            onClick={() => onSpeak?.(s.naturalizedText)}
                            title="Replay speech audio"
                          >
                            <Volume2 size={12} strokeWidth={1.75} />
                          </button>
                        </div>
                        <p className="sentence-row-text">{s.naturalizedText}</p>
                      </li>
                    ))}
                  </ul>
                ) : transcript.length > 0 ? (
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
                    <span>Sentences will be logged here as you sign.</span>
                  </div>
                )}
              </div>
            </div>
          )
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