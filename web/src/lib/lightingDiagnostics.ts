/**
 * lightingDiagnostics.ts - Lightweight computer vision engine for video lighting, contrast, and backlighting analysis
 */

import { LightingMetrics, LightingQualityScore } from '../types/biometrics';

// Shared offscreen canvas for high-performance low-res sampling (64x48 = 3072 pixels)
const SAMPLE_WIDTH = 64;
const SAMPLE_HEIGHT = 48;

let sharedCanvas: HTMLCanvasElement | null = null;
let sharedCtx: CanvasRenderingContext2D | null = null;

function getSampleContext(): CanvasRenderingContext2D | null {
  if (typeof document === 'undefined') return null;
  if (!sharedCanvas) {
    sharedCanvas = document.createElement('canvas');
    sharedCanvas.width = SAMPLE_WIDTH;
    sharedCanvas.height = SAMPLE_HEIGHT;
    sharedCtx = sharedCanvas.getContext('2d', { willReadFrequently: true });
  }
  return sharedCtx;
}

/**
 * Analyzes video element illumination, contrast, and backlight distribution
 */
export function analyzeVideoLighting(video: HTMLVideoElement): LightingMetrics {
  const ctx = getSampleContext();
  const now = Date.now();

  if (!ctx || video.videoWidth === 0 || video.videoHeight === 0 || video.readyState < 2) {
    return {
      averageLuminance: 128,
      rmsContrast: 50,
      dynamicRange: 200,
      backlightRatio: 1.0,
      qualityScore: 'optimal',
      warningMessage: null,
      recommendedAction: null,
      measuredAt: now,
    };
  }

  // Draw scaled video frame onto sampling canvas
  ctx.drawImage(video, 0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT);
  const imgData = ctx.getImageData(0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT);
  const data = imgData.data;
  const totalPixels = SAMPLE_WIDTH * SAMPLE_HEIGHT;

  let sumLuminance = 0;
  let minLuminance = 255;
  let maxLuminance = 0;

  // Track center vs perimeter luminance to detect backlighting
  let centerSum = 0;
  let centerCount = 0;
  let perimeterSum = 0;
  let perimeterCount = 0;

  const centerMinX = Math.floor(SAMPLE_WIDTH * 0.25);
  const centerMaxX = Math.floor(SAMPLE_WIDTH * 0.75);
  const centerMinY = Math.floor(SAMPLE_HEIGHT * 0.2);
  const centerMaxY = Math.floor(SAMPLE_HEIGHT * 0.8);

  const luminances = new Float32Array(totalPixels);

  for (let i = 0; i < totalPixels; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];

    // Standard ITU-R BT.601 perceptual luminance
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    luminances[i] = lum;

    sumLuminance += lum;
    if (lum < minLuminance) minLuminance = lum;
    if (lum > maxLuminance) maxLuminance = lum;

    const x = i % SAMPLE_WIDTH;
    const y = Math.floor(i / SAMPLE_WIDTH);

    if (x >= centerMinX && x <= centerMaxX && y >= centerMinY && y <= centerMaxY) {
      centerSum += lum;
      centerCount++;
    } else {
      perimeterSum += lum;
      perimeterCount++;
    }
  }

  const avgLum = sumLuminance / totalPixels;

  // Calculate RMS Contrast (Standard Deviation of luminance)
  let sumSqDiff = 0;
  for (let i = 0; i < totalPixels; i++) {
    const diff = luminances[i] - avgLum;
    sumSqDiff += diff * diff;
  }
  const rmsContrast = Math.sqrt(sumSqDiff / totalPixels);
  const dynamicRange = maxLuminance - minLuminance;

  const centerAvg = centerCount > 0 ? centerSum / centerCount : avgLum;
  const perimeterAvg = perimeterCount > 0 ? perimeterSum / perimeterCount : avgLum;
  const backlightRatio = centerAvg > 5 ? perimeterAvg / centerAvg : 2.0;

  // Determine quality classification and guidance
  let qualityScore: LightingQualityScore = 'optimal';
  let warningMessage: string | null = null;
  let recommendedAction: string | null = null;

  if (avgLum < 48) {
    qualityScore = 'low-light';
    warningMessage = 'Low lighting environment detected';
    recommendedAction = 'Increase front-facing lighting to improve hand tracking clarity.';
  } else if (avgLum > 218) {
    qualityScore = 'overexposed';
    warningMessage = 'Camera is overexposed or washed out';
    recommendedAction = 'Reduce intense direct lights or lower camera exposure.';
  } else if (backlightRatio > 1.45 && centerAvg < 115) {
    qualityScore = 'backlit';
    warningMessage = 'Backlighting detected behind signer';
    recommendedAction = 'Close background window shades or position a light in front of you.';
  } else if (rmsContrast < 16) {
    qualityScore = 'high-contrast';
    warningMessage = 'Low dynamic contrast between subject and background';
    recommendedAction = 'Ensure your clothing contrasts with your background.';
  }

  return {
    averageLuminance: Math.round(avgLum),
    rmsContrast: Math.round(rmsContrast),
    dynamicRange: Math.round(dynamicRange),
    backlightRatio: parseFloat(backlightRatio.toFixed(2)),
    qualityScore,
    warningMessage,
    recommendedAction,
    measuredAt: now,
  };
}
