import React, { useEffect, useState } from 'react';
import { Flame, Trophy, Award, Target, RotateCcw, Clock } from 'lucide-react';
import { PracticeStats, PracticeFeedback } from '../types/practice';

interface PracticeScoreboardProps {
  stats: PracticeStats;
  recentHistory: PracticeFeedback[];
  onResetSession: () => void;
}

export const PracticeScoreboard: React.FC<PracticeScoreboardProps> = ({
  stats,
  recentHistory,
  onResetSession,
}) => {
  const [elapsedSec, setElapsedSec] = useState(0);

  // Session timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - stats.sessionStartTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [stats.sessionStartTime]);

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="practice-scoreboard" aria-label="Practice session stats">
      {/* Metrics Row Grid */}
      <div className="scoreboard-grid">
        {/* Current Streak */}
        <div className="stat-card">
          <div className="stat-header">
            <Flame size={15} strokeWidth={1.75} className="stat-icon flame" />
            <span className="stat-label">Current Streak</span>
          </div>
          <div className="stat-val-group">
            <span className="stat-number mono-val">{stats.streak}</span>
            <span className="stat-unit">signs</span>
          </div>
        </div>

        {/* Best Streak */}
        <div className="stat-card">
          <div className="stat-header">
            <Trophy size={15} strokeWidth={1.75} className="stat-icon trophy" />
            <span className="stat-label">Best Streak</span>
          </div>
          <div className="stat-val-group">
            <span className="stat-number mono-val">{stats.bestStreak}</span>
            <span className="stat-unit">record</span>
          </div>
        </div>

        {/* Completed Total */}
        <div className="stat-card">
          <div className="stat-header">
            <Award size={15} strokeWidth={1.75} className="stat-icon award" />
            <span className="stat-label">Completed</span>
          </div>
          <div className="stat-val-group">
            <span className="stat-number mono-val">{stats.completedCount}</span>
            <span className="stat-unit">signs</span>
          </div>
        </div>

        {/* Accuracy */}
        <div className="stat-card">
          <div className="stat-header">
            <Target size={15} strokeWidth={1.75} className="stat-icon target" />
            <span className="stat-label">Accuracy</span>
          </div>
          <div className="stat-val-group">
            <span className="stat-number mono-val">{stats.accuracy}%</span>
            <span className="stat-unit">{stats.totalAttempts} tries</span>
          </div>
        </div>
      </div>

      {/* Session Details Bar */}
      <div className="session-meta-bar">
        <div className="session-duration">
          <Clock size={13} strokeWidth={1.75} className="session-time-icon" />
          <span className="duration-label">Session:</span>
          <span className="duration-val mono-val">{formatTimer(elapsedSec)}</span>
        </div>

        <button
          type="button"
          className="btn-ghost reset-session-btn"
          onClick={onResetSession}
          title="Reset practice session statistics"
        >
          <RotateCcw size={13} strokeWidth={1.75} />
          <span>Reset Stats</span>
        </button>
      </div>

      {/* Recent Mastered Signs */}
      <div className="history-section">
        <h3 className="history-title">Mastered This Session</h3>
        {recentHistory.length === 0 ? (
          <div className="history-empty">
            <span>Hold your first target sign to see it logged here.</span>
          </div>
        ) : (
          <ul className="history-list">
            {recentHistory.map((item, idx) => (
              <li key={`${item.matchedWord}-${item.timestamp}-${idx}`} className="history-item">
                <span className="history-gloss">{item.matchedWord}</span>
                <span className="history-confidence mono-val">
                  {Math.round(item.confidence * 100)}%
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};