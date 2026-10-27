import React from 'react';

interface SpeakingVisualizerProps {
  size?: 'sm' | 'md';
}

export const SpeakingVisualizer: React.FC<SpeakingVisualizerProps> = ({ size = 'md' }) => {
  return (
    <div className={`speaking-visualizer ${size}`} aria-label="Speaking audio visualizer">
      <span className="wave-bar bar-1" />
      <span className="wave-bar bar-2" />
      <span className="wave-bar bar-3" />
      <span className="wave-bar bar-4" />
    </div>
  );
};