/**
 * LightingQualityMeter.tsx - HUD indicator component for camera lighting, contrast, and backlighting diagnostics
 */

import React, { useState } from 'react';
import { Sun, SunDim, SunMedium, AlertCircle, CheckCircle2, ChevronDown } from 'lucide-react';
import { LightingMetrics } from '../types/biometrics';

interface LightingQualityMeterProps {
  metrics: LightingMetrics;
  compact?: boolean;
}

export const LightingQualityMeter: React.FC<LightingQualityMeterProps> = ({
  metrics,
  compact = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusBadge = () => {
    switch (metrics.qualityScore) {
      case 'optimal':
        return {
          icon: <Sun size={13} className="text-emerald-400" />,
          label: 'Good Lighting',
          badgeClass: 'lighting-good',
          color: 'var(--success)',
        };
      case 'low-light':
        return {
          icon: <SunDim size={13} className="text-amber-400" />,
          label: 'Dim Light',
          badgeClass: 'lighting-warn',
          color: 'var(--warning)',
        };
      case 'overexposed':
        return {
          icon: <SunMedium size={13} className="text-rose-400" />,
          label: 'Too Bright',
          badgeClass: 'lighting-danger',
          color: 'var(--danger)',
        };
      case 'backlit':
        return {
          icon: <AlertCircle size={13} className="text-amber-400" />,
          label: 'Backlit',
          badgeClass: 'lighting-warn',
          color: 'var(--warning)',
        };
      case 'high-contrast':
        return {
          icon: <AlertCircle size={13} className="text-amber-400" />,
          label: 'Low Contrast',
          badgeClass: 'lighting-warn',
          color: 'var(--warning)',
        };
    }
  };

  const badge = getStatusBadge();

  if (compact) {
    return (
      <div
        className={`lighting-meter-compact ${badge.badgeClass}`}
        title={`Lighting: ${badge.label} (${metrics.averageLuminance}/255 lum)${metrics.warningMessage ? ` - ${metrics.warningMessage}` : ''}`}
        role="status"
        aria-label={`Lighting status: ${badge.label}`}
      >
        {badge.icon}
        <span className="lighting-compact-label">{badge.label}</span>
      </div>
    );
  }

  return (
    <div className={`lighting-meter-container ${badge.badgeClass}`}>
      <button
        type="button"
        className="lighting-meter-header"
        onClick={() => setIsExpanded((prev) => !prev)}
        aria-expanded={isExpanded}
        title="Toggle lighting diagnostics breakdown"
      >
        <div className="lighting-meter-title">
          {badge.icon}
          <span className="lighting-title-text">{badge.label}</span>
          <span className="lighting-lum-val mono-val">{metrics.averageLuminance} lum</span>
        </div>
        <ChevronDown
          size={12}
          className={`lighting-chevron ${isExpanded ? 'rotated' : ''}`}
        />
      </button>

      {/* Expanded detailed breakdown */}
      {isExpanded && (
        <div className="lighting-meter-details">
          {/* Progress bar of luminance */}
          <div className="lighting-bar-wrapper">
            <div className="lighting-bar-label">
              <span>Brightness</span>
              <span className="mono-val">{metrics.averageLuminance} / 255</span>
            </div>
            <div className="lighting-bar-track">
              <div
                className="lighting-bar-fill"
                style={{ width: `${Math.min(100, Math.max(0, (metrics.averageLuminance / 255) * 100))}%` }}
              />
              {/* Optimal zone markers (50 - 210) */}
              <div className="lighting-zone-optimal" style={{ left: '20%', width: '65%' }} />
            </div>
          </div>

          <div className="lighting-stats-grid">
            <div className="lighting-stat-item">
              <span className="lighting-stat-label">RMS Contrast</span>
              <span className="lighting-stat-value mono-val">{metrics.rmsContrast}</span>
            </div>
            <div className="lighting-stat-item">
              <span className="lighting-stat-label">Dynamic Range</span>
              <span className="lighting-stat-value mono-val">{metrics.dynamicRange}</span>
            </div>
            <div className="lighting-stat-item">
              <span className="lighting-stat-label">Backlight</span>
              <span className="lighting-stat-value mono-val">{metrics.backlightRatio}x</span>
            </div>
          </div>

          {/* Actionable recommendation */}
          {metrics.recommendedAction ? (
            <div className="lighting-recommendation">
              <AlertCircle size={12} className="flex-shrink-0" />
              <span>{metrics.recommendedAction}</span>
            </div>
          ) : (
            <div className="lighting-recommendation optimal">
              <CheckCircle2 size={12} className="flex-shrink-0" />
              <span>Optimal framing illumination for 30 FPS gesture capture.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
