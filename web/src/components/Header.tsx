import React from 'react';
import { BookOpen, Settings as SettingsIcon, Activity, Target } from 'lucide-react';

export type AppMode = 'recognize' | 'practice';

interface HeaderProps {
  appMode: AppMode;
  onChangeAppMode: (mode: AppMode) => void;
  onOpenVocabulary: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  appMode,
  onChangeAppMode,
  onOpenVocabulary,
  onOpenSettings,
}) => {
  return (
    <header className="app-header">
      <div className="header-brand">
        <div className="brand-mark" aria-hidden="true">
          <span>C</span>
        </div>
        <div className="brand-text">
          <span className="brand-title">Chereme</span>
          <span className="brand-subtitle">ASL Sign Recognizer</span>
        </div>
      </div>

      <div className="header-mode-toggle" role="group" aria-label="Application mode">
        <button
          type="button"
          className={`mode-toggle-btn ${appMode === 'recognize' ? 'active' : ''}`}
          onClick={() => onChangeAppMode('recognize')}
          aria-pressed={appMode === 'recognize'}
          title="Live Sign Recognition Mode (P)"
        >
          <Activity size={15} strokeWidth={1.75} />
          <span>Recognize</span>
        </button>
        <button
          type="button"
          className={`mode-toggle-btn ${appMode === 'practice' ? 'active' : ''}`}
          onClick={() => onChangeAppMode('practice')}
          aria-pressed={appMode === 'practice'}
          title="Interactive Sign Practice Mode (P)"
        >
          <Target size={15} strokeWidth={1.75} />
          <span>Practice</span>
        </button>
      </div>

      <nav className="header-actions" aria-label="Quick actions">
        <button
          type="button"
          className="btn-ghost"
          onClick={onOpenVocabulary}
          title="Browse 100 signs (/)"
        >
          <BookOpen size={16} strokeWidth={1.75} />
          <span>Vocabulary</span>
        </button>

        <a
          href="https://github.com/Giancyril/sign-language"
          target="_blank"
          rel="noreferrer"
          className="btn-ghost"
          title="View GitHub repository"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
            <path d="M9 18c-4.51 2-5-2-7-2" />
          </svg>
          <span>GitHub</span>
        </a>

        <button
          type="button"
          className="btn-ghost btn-icon"
          onClick={onOpenSettings}
          title="Settings"
          aria-label="Settings"
        >
          <SettingsIcon size={18} strokeWidth={1.75} />
        </button>
      </nav>
    </header>
  );
};