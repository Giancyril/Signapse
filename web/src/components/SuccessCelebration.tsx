import React from 'react';
import { CheckCircle2, Flame } from 'lucide-react';
import { PracticeFeedback } from '../types/practice';

interface SuccessCelebrationProps {
  feedback: PracticeFeedback | null;
  streak: number;
}

export const SuccessCelebration: React.FC<SuccessCelebrationProps> = ({
  feedback,
  streak,
}) => {
  if (!feedback || !feedback.success) return null;

  return (
    <aside className="celebration-badge-overlay" role="status" aria-live="polite">
      <div className="celebration-badge-content">
        <CheckCircle2 size={18} strokeWidth={2.25} className="celebration-icon" />
        <div className="celebration-text-group">
          <span className="celebration-title">Mastered!</span>
          <span className="celebration-gloss">{feedback.matchedWord}</span>
        </div>
        <div className="celebration-streak-chip">
          <Flame size={13} strokeWidth={2} className="streak-flame-icon" />
          <span className="streak-count font-mono">{streak} streak</span>
        </div>
      </div>
    </aside>
  );
};