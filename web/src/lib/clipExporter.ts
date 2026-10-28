/**
 * clipExporter.ts - Exports recorded landmark clips to JSON (raw frame landmarks) and CSV (wrist trajectory dynamics)
 */

import { RecordedClip } from '../types/recorder';

/**
 * Format full clip data as formatted JSON
 */
export function exportClipToJson(clip: RecordedClip): string {
  const exportPayload = {
    schemaVersion: '1.0',
    generator: 'Chereme ASL Motion Capture Engine',
    clip: {
      id: clip.id,
      name: clip.name,
      recordedAt: new Date(clip.recordedAt).toISOString(),
      durationMs: clip.durationMs,
      fps: clip.fps,
      frameCount: clip.frameCount,
      predictedGloss: clip.predictedGloss ?? null,
      confidence: clip.confidence ?? null,
    },
    frames: clip.frames.map((f) => ({
      frameIndex: f.frameIndex,
      timestampMs: f.timestamp,
      wristVelocity: f.wristVelocity,
      landmarks: {
        leftHand: f.landmarks.leftHand,
        rightHand: f.landmarks.rightHand,
        pose: f.landmarks.pose,
      },
    })),
  };

  return JSON.stringify(exportPayload, null, 2);
}

/**
 * Format clip landmark trajectories into CSV table
 */
export function exportClipToCsv(clip: RecordedClip): string {
  const lines: string[] = [];

  // Metadata comments
  lines.push('# Chereme ASL Landmark Motion Capture Trajectory');
  lines.push(`# Clip: ${clip.name}`);
  lines.push(`# RecordedAt: ${new Date(clip.recordedAt).toISOString()}`);
  lines.push(`# DurationMs: ${clip.durationMs}`);
  lines.push(`# PredictedGloss: ${clip.predictedGloss ?? 'None'}`);
  lines.push(`# Confidence: ${clip.confidence ? (clip.confidence * 100).toFixed(1) + '%' : 'N/A'}`);
  lines.push('# -------------------------------------------------------------');

  // CSV Columns
  lines.push(
    [
      'frame_index',
      'timestamp_ms',
      'left_wrist_x',
      'left_wrist_y',
      'left_wrist_z',
      'left_velocity',
      'right_wrist_x',
      'right_wrist_y',
      'right_wrist_z',
      'right_velocity',
    ].join(',')
  );

  for (const frame of clip.frames) {
    const leftWrist = frame.landmarks.leftHand?.[0] ?? null;
    const rightWrist = frame.landmarks.rightHand?.[0] ?? null;

    const row = [
      frame.frameIndex,
      frame.timestamp,
      leftWrist ? leftWrist.x.toFixed(4) : '',
      leftWrist ? leftWrist.y.toFixed(4) : '',
      leftWrist ? leftWrist.z.toFixed(4) : '',
      frame.wristVelocity.left.toFixed(4),
      rightWrist ? rightWrist.x.toFixed(4) : '',
      rightWrist ? rightWrist.y.toFixed(4) : '',
      rightWrist ? rightWrist.z.toFixed(4) : '',
      frame.wristVelocity.right.toFixed(4),
    ];

    lines.push(row.join(','));
  }

  return lines.join('\n');
}

/**
 * Triggers client-side browser download of the recorded clip
 */
export function downloadClipFile(clip: RecordedClip, format: 'json' | 'csv' = 'json'): void {
  const safeName = clip.name.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  let content = '';
  let filename = '';
  let mimeType = '';

  if (format === 'csv') {
    content = exportClipToCsv(clip);
    filename = `${safeName}_trajectory.csv`;
    mimeType = 'text/csv;charset=utf-8';
  } else {
    content = exportClipToJson(clip);
    filename = `${safeName}_mocap.json`;
    mimeType = 'application/json;charset=utf-8';
  }

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
