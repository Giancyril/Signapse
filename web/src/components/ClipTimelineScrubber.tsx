import React from 'react';
import { Play, Pause, SkipBack, SkipForward, Repeat } from 'lucide-react';
import { PlaybackSpeed } from '../types/recorder';

interface ClipTimelineScrubberProps {
  currentFrameIndex: number;
  totalFrames: number;
  currentTimestampMs: number;
  totalDurationMs: number;
  isPlaying: boolean;
  playbackSpeed: PlaybackSpeed;
  isLooping: boolean;
  onTogglePlay: () => void;
  onSeekFrame: (index: number) => void;
  onStepFrame: (delta: number) => void;
  onChangeSpeed: (speed: PlaybackSpeed) => void;
  onToggleLoop: () => void;
}

export const ClipTimelineScrubber: React.FC<ClipTimelineScrubberProps> = ({
  currentFrameIndex,
  totalFrames,
  currentTimestampMs,
  totalDurationMs,
  isPlaying,
  playbackSpeed,
  isLooping,
  onTogglePlay,
  onSeekFrame,
  onStepFrame,
  onChangeSpeed,
  onToggleLoop,
}) => {
  const formatTime = (ms: number) => {
    const sec = (ms / 1000).toFixed(2);
    return `${sec}s`;
  };

  return (
    <div className="clip-timeline-scrubber" role="region" aria-label="Playback timeline scrubber">
      {/* Upper Timeline Slider Row */}
      <div className="scrubber-track-row">
        <input
          type="range"
          min={0}
          max={Math.max(0, totalFrames - 1)}
          value={currentFrameIndex}
          onChange={(e) => onSeekFrame(parseInt(e.target.value, 10))}
          className="timeline-slider"
          aria-label="Seek frame slider"
        />
        <div className="scrubber-time-badge mono-val">
          <span>Frame {currentFrameIndex + 1}/{totalFrames}</span>
          <span className="time-divider">·</span>
          <span>{formatTime(currentTimestampMs)} / {formatTime(totalDurationMs)}</span>
        </div>
      </div>

      {/* Controls Bar Row */}
      <div className="scrubber-controls-row">
        {/* Playback action buttons */}
        <div className="playback-btn-group">
          <button
            type="button"
            className="btn-ghost btn-icon"
            onClick={() => onStepFrame(-1)}
            title="Previous frame (Left arrow)"
            aria-label="Previous frame"
          >
            <SkipBack size={15} strokeWidth={1.75} />
          </button>

          <button
            type="button"
            className="btn-primary play-pause-btn"
            onClick={onTogglePlay}
            title={isPlaying ? 'Pause playback (Space)' : 'Play clip (Space)'}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause size={15} strokeWidth={2} />
            ) : (
              <Play size={15} strokeWidth={2} />
            )}
          </button>

          <button
            type="button"
            className="btn-ghost btn-icon"
            onClick={() => onStepFrame(1)}
            title="Next frame (Right arrow)"
            aria-label="Next frame"
          >
            <SkipForward size={15} strokeWidth={1.75} />
          </button>

          <button
            type="button"
            className={`btn-ghost btn-icon loop-btn ${isLooping ? 'active' : ''}`}
            onClick={onToggleLoop}
            aria-pressed={isLooping}
            title={isLooping ? 'Looping enabled' : 'Looping disabled'}
          >
            <Repeat size={14} strokeWidth={1.75} />
          </button>
        </div>

        {/* Speed Selector */}
        <div className="playback-speed-group" role="group" aria-label="Playback speed">
          {([0.25, 0.5, 1.0] as PlaybackSpeed[]).map((spd) => (
            <button
              key={spd}
              type="button"
              className={`speed-pill-btn ${playbackSpeed === spd ? 'active' : ''}`}
              onClick={() => onChangeSpeed(spd)}
              aria-pressed={playbackSpeed === spd}
            >
              {spd}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};