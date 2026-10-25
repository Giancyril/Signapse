import React from 'react';
import { Check, ShieldCheck } from 'lucide-react';

interface HoldProgressRingProps {
  progress: number; // 0 to 1
  isHolding: boolean;
  isCelebrating: boolean;
  targetGloss: string;
  currentDetectedGloss?: string | null;
  confidence?: number;
}

export const HoldProgressRing: React.FC<HoldProgressRingProps> = ({
  progress,
  isHolding,
  isCelebrating,
  targetGloss,
  currentDetectedGloss,
  confidence = 0,
}) => {
  // SVG circular calculation
  const size = 76;
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - progress * circumference;

  const isMatched =
    currentDetectedGloss &&
    currentDetectedGloss.toLowerCase() === targetGloss.toLowerCase();

  return (
    <div
      className={`hold-progress-card ${isCelebrating ? 'celebrating' : isHolding ? 'holding' : ''}`}
      aria-label="Pose hold validation"
    >
      <div className="progress-ring-wrapper">
        <svg
          className="progress-ring-svg"
          width={size}
          height={size}
          aria-hidden="true"
        >
          {/* Background Track */}
          <circle
            className="ring-bg"
            stroke="var(--border)"
            strokeWidth={strokeWidth}
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
          {/* Animated Progress Stroke */}
          <circle
            className="ring-bar"
            stroke={isCelebrating ? 'var(--status-ok)' : 'var(--accent)'}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
        </svg>

        {/* Center Indicator */}
        <div className="ring-center-content">
          {isCelebrating ? (
            <Check size={26} strokeWidth={2.5} className="ring-icon-check" />
          ) : (
            <span className="ring-percentage font-mono">
              {Math.round(progress * 100)}%
            </span>
          )}
        </div>
      </div>

      <div className="hold-info-group">
        <div className="hold-status-headline">
          {isCelebrating ? (
            <span className="hold-badge ok">Sign Mastered!</span>
          ) : isHolding ? (
            <span className="hold-badge active">Holding steady...</span>
          ) : isMatched ? (
            <span className="hold-badge matched">Sign detected</span>
          ) : (
            <span className="hold-badge idle">Ready for sign</span>
          )}
        </div>

        <p className="hold-helper-text">
          {isCelebrating ? (
            'Target reached with clean pose hold.'
          ) : isHolding ? (
            'Keep holding hand landmarks in frame.'
          ) : (
            <span>
              Hold <strong className="highlight-gloss">{targetGloss}</strong> for 0.7s to confirm.
            </span>
          )}
        </p>

        {currentDetectedGloss && (
          <div className="live-match-chip">
            <ShieldCheck size={13} strokeWidth={1.75} className="match-icon" />
            <span className="match-label">Live detect:</span>
            <span className="match-val">{currentDetectedGloss}</span>
            <span className="match-conf mono-val">({Math.round(confidence * 100)}%)</span>
          </div>
        )}
      </div>
    </div>
  );
};