/**
 * recorder.ts - Types for Clip Recording, Landmark Motion Capture, and Trajectory Inspection
 */

export interface LandmarkPoint {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface FrameLandmarks {
  leftHand: LandmarkPoint[] | null;
  rightHand: LandmarkPoint[] | null;
  pose: LandmarkPoint[] | null;
}

export interface RecordedFrame {
  frameIndex: number;
  timestamp: number; // relative ms from recording start
  landmarks: FrameLandmarks;
  featureVector?: number[]; // 392-dim normalized feature vector
  wristVelocity: {
    left: number;
    right: number;
  };
}

export interface RecordedClip {
  id: string;
  name: string;
  recordedAt: number; // epoch ms
  durationMs: number;
  fps: number;
  frameCount: number;
  frames: RecordedFrame[];
  predictedGloss?: string;
  confidence?: number;
}

export type PlaybackSpeed = 0.25 | 0.5 | 1.0;

export interface TrajectoryPoint {
  x: number;
  y: number;
  timestamp: number;
  velocity: number;
}