/**
 * trajectoryEngine.ts - Landmark trajectory smoothing, velocity vectors, and motion curves
 */

import { RecordedClip, TrajectoryPoint, LandmarkPoint } from '../types/recorder';

export interface TrajectorySeries {
  leftWrist: TrajectoryPoint[];
  rightWrist: TrajectoryPoint[];
  leftIndexTip: TrajectoryPoint[];
  rightIndexTip: TrajectoryPoint[];
  maxVelocity: number;
  averageVelocity: number;
}

/**
 * Extracts smoothed trajectory paths and velocity profiles from a recorded clip
 */
export function extractClipTrajectories(clip: RecordedClip): TrajectorySeries {
  const leftWrist: TrajectoryPoint[] = [];
  const rightWrist: TrajectoryPoint[] = [];
  const leftIndexTip: TrajectoryPoint[] = [];
  const rightIndexTip: TrajectoryPoint[] = [];

  let maxVel = 0;
  let totalVel = 0;
  let velCount = 0;

  const getPt = (points: LandmarkPoint[] | null, index: number): { x: number; y: number } | null => {
    if (!points || !points[index]) return null;
    return { x: points[index].x, y: points[index].y };
  };

  clip.frames.forEach((frame, idx) => {
    const prevFrame = idx > 0 ? clip.frames[idx - 1] : null;
    const dt = prevFrame ? Math.max(1, frame.timestamp - prevFrame.timestamp) : 33;

    // Left Hand: Wrist (0), Index Tip (8)
    const lw = getPt(frame.landmarks.leftHand, 0);
    if (lw) {
      let v = 0;
      if (prevFrame) {
        const plw = getPt(prevFrame.landmarks.leftHand, 0);
        if (plw) {
          const dx = lw.x - plw.x;
          const dy = lw.y - plw.y;
          v = (Math.sqrt(dx * dx + dy * dy) / dt) * 1000;
        }
      }
      leftWrist.push({ x: lw.x, y: lw.y, timestamp: frame.timestamp, velocity: v });
      if (v > maxVel) maxVel = v;
      totalVel += v;
      velCount++;
    }

    const rw = getPt(frame.landmarks.rightHand, 0);
    if (rw) {
      let v = 0;
      if (prevFrame) {
        const prw = getPt(prevFrame.landmarks.rightHand, 0);
        if (prw) {
          const dx = rw.x - prw.x;
          const dy = rw.y - prw.y;
          v = (Math.sqrt(dx * dx + dy * dy) / dt) * 1000;
        }
      }
      rightWrist.push({ x: rw.x, y: rw.y, timestamp: frame.timestamp, velocity: v });
      if (v > maxVel) maxVel = v;
      totalVel += v;
      velCount++;
    }

    // Index Fingertips
    const li = getPt(frame.landmarks.leftHand, 8);
    if (li) {
      leftIndexTip.push({ x: li.x, y: li.y, timestamp: frame.timestamp, velocity: 0 });
    }

    const ri = getPt(frame.landmarks.rightHand, 8);
    if (ri) {
      rightIndexTip.push({ x: ri.x, y: ri.y, timestamp: frame.timestamp, velocity: 0 });
    }
  });

  return {
    leftWrist: smoothPoints(leftWrist),
    rightWrist: smoothPoints(rightWrist),
    leftIndexTip: smoothPoints(leftIndexTip),
    rightIndexTip: smoothPoints(rightIndexTip),
    maxVelocity: Math.round(maxVel * 100) / 100,
    averageVelocity: velCount > 0 ? Math.round((totalVel / velCount) * 100) / 100 : 0,
  };
}

/**
 * 3-point moving average smoothing
 */
function smoothPoints(points: TrajectoryPoint[]): TrajectoryPoint[] {
  if (points.length < 3) return points;

  const result: TrajectoryPoint[] = [];
  result.push(points[0]);

  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const next = points[i + 1];

    result.push({
      x: (prev.x + curr.x + next.x) / 3,
      y: (prev.y + curr.y + next.y) / 3,
      timestamp: curr.timestamp,
      velocity: curr.velocity,
    });
  }

  result.push(points[points.length - 1]);
  return result;
}

/**
 * Get ghost trail points leading up to a specific frame
 */
export function getRecentTrail(
  points: TrajectoryPoint[],
  currentTimestamp: number,
  trailWindowMs = 350
): { point: TrajectoryPoint; opacity: number }[] {
  const filtered = points.filter(
    (p) => p.timestamp <= currentTimestamp && p.timestamp >= currentTimestamp - trailWindowMs
  );

  return filtered.map((p) => {
    const age = currentTimestamp - p.timestamp;
    const opacity = Math.max(0.08, 0.85 * (1 - age / trailWindowMs));
    return { point: p, opacity };
  });
}