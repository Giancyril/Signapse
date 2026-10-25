import React from 'react';
import { Target, SkipForward, RefreshCw, HelpCircle } from 'lucide-react';
import { PracticeTarget, DifficultyTier } from '../types/practice';

interface TargetPromptCardProps {
  target: PracticeTarget;
  difficulty: DifficultyTier;
  onChangeDifficulty: (tier: DifficultyTier) => void;
  onSkip: () => void;
  onNext: () => void;
  isHolding: boolean;
}

export const TargetPromptCard: React.FC<TargetPromptCardProps> = ({
  target,
  difficulty,
  onChangeDifficulty,
  onSkip,
  onNext,
  isHolding,
}) => {
  return (
    <section className="target-prompt-card" aria-label="Practice target sign">
      {/* Top Bar with Difficulty Tabs */}
      <div className="prompt-header">
        <div className="prompt-label-group">
          <Target size={15} strokeWidth={1.75} className="prompt-target-icon" />
          <span className="prompt-title">Target Sign</span>
          <span className={`difficulty-badge ${target.difficulty}`}>
            {target.difficulty}
          </span>
          <span className="category-pill">{target.category}</span>
        </div>

        {/* Tier Selector */}
        <div className="difficulty-segmented-control" role="group" aria-label="Difficulty level">
          {(['all', 'beginner', 'intermediate', 'advanced'] as DifficultyTier[]).map((tier) => (
            <button
              key={tier}
              type="button"
              className={`tier-btn ${difficulty === tier ? 'active' : ''}`}
              onClick={() => onChangeDifficulty(tier)}
              aria-pressed={difficulty === tier}
            >
              {tier === 'all' ? 'All' : tier.charAt(0).toUpperCase() + tier.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Target Word Hero */}
      <div className="prompt-word-hero">
        <h2 className="target-word" aria-live="polite">
          {target.gloss}
        </h2>
        {isHolding && (
          <span className="holding-feedback-pill">
            Holding sign...
          </span>
        )}
      </div>

      {/* Signing Cue / Hint */}
      <div className="prompt-hint-box">
        <HelpCircle size={15} strokeWidth={1.75} className="hint-icon" />
        <p className="hint-text">
          <strong className="hint-prefix">How to sign:</strong> {target.hint}
        </p>
      </div>

      {/* Action Footer */}
      <div className="prompt-actions-footer">
        <button
          type="button"
          className="btn-secondary prompt-skip-btn"
          onClick={onSkip}
          title="Skip to next word (breaks current streak)"
        >
          <SkipForward size={15} strokeWidth={1.75} />
          <span>Skip</span>
        </button>

        <button
          type="button"
          className="btn-ghost"
          onClick={onNext}
          title="Roll another random word in this tier"
        >
          <RefreshCw size={15} strokeWidth={1.75} />
          <span>Shuffle</span>
        </button>
      </div>
    </section>
  );
};