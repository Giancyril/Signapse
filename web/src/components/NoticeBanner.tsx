import React, { useState, useEffect } from 'react';
import { X, Info } from 'lucide-react';

interface NoticeBannerProps {
  onOpenLimitations: () => void;
}

export const NoticeBanner: React.FC<NoticeBannerProps> = ({ onOpenLimitations }) => {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const isDismissed = localStorage.getItem('chereme_dismiss_notice');
    if (!isDismissed) {
      setDismissed(false);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('chereme_dismiss_notice', 'true');
    setDismissed(true);
  };

  if (dismissed) return null;

  return (
    <aside className="notice-banner" aria-label="Research prototype notice">
      <div className="notice-content">
        <Info size={16} strokeWidth={1.75} className="notice-icon" />
        <span className="notice-text">
          Research prototype: recognizes isolated signs from a 100-word ASL vocabulary. Does not translate continuous grammar.
        </span>
        <button
          type="button"
          className="notice-link"
          onClick={onOpenLimitations}
        >
          Limitations
        </button>
      </div>
      <button
        type="button"
        className="notice-close-btn"
        onClick={handleDismiss}
        aria-label="Dismiss notice"
        title="Dismiss notice"
      >
        <X size={16} strokeWidth={1.75} />
      </button>
    </aside>
  );
};