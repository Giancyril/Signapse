import React, { useRef, useEffect } from 'react';
import { FrameLandmarks, TrajectoryPoint, LandmarkPoint } from '../types/recorder';
import { getRecentTrail } from '../lib/trajectoryEngine';

interface LandmarkTrajectoryViewerProps {
  landmarks: FrameLandmarks | null;
  wristTrails: {
    left: TrajectoryPoint[];
    right: TrajectoryPoint[];
  };
  currentTimestampMs: number;
  showGhostTrails?: boolean;
}

// MediaPipe Hand connections (21 joints, 5 fingers)
const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],       // Thumb
  [0, 5], [5, 6], [6, 7], [7, 8],       // Index
  [5, 9], [9, 10], [10, 11], [11, 12],  // Middle
  [9, 13], [13, 14], [14, 15], [15, 16],// Ring
  [13, 17], [17, 18], [18, 19], [19, 20],// Pinky
  [0, 17],                              // Palm base
];

// Pose upper body connections (nose: 0, shoulders: 11/12, elbows: 13/14, wrists: 15/16)
const POSE_CONNECTIONS = [
  [11, 12], // Shoulder to shoulder
  [11, 13], [13, 15], // Left arm
  [12, 14], [14, 16], // Right arm
];

export const LandmarkTrajectoryViewer: React.FC<LandmarkTrajectoryViewerProps> = ({
  landmarks,
  wristTrails,
  currentTimestampMs,
  showGhostTrails = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear background
    ctx.fillStyle = '#0E1116';
    ctx.fillRect(0, 0, width, height);

    // Draw grid background for mocap technical look
    ctx.strokeStyle = '#1E242D';
    ctx.lineWidth = 1;
    const step = 40;
    for (let x = 0; x < width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    if (!landmarks) return;

    // Helper: draw single hand
    const drawHand = (joints: LandmarkPoint[] | null, strokeColor: string, jointColor: string) => {
      if (!joints || joints.length < 21) return;

      // Draw bone connections
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2.5;
      HAND_CONNECTIONS.forEach(([startIdx, endIdx]) => {
        const start = joints[startIdx];
        const end = joints[endIdx];
        if (start && end) {
          ctx.beginPath();
          ctx.moveTo(start.x * width, start.y * height);
          ctx.lineTo(end.x * width, end.y * height);
          ctx.stroke();
        }
      });

      // Draw joint dots
      ctx.fillStyle = jointColor;
      joints.forEach((pt) => {
        ctx.beginPath();
        ctx.arc(pt.x * width, pt.y * height, 3, 0, 2 * Math.PI);
        ctx.fill();
      });
    };

    // Helper: draw upper body pose
    const drawPose = (poseJoints: LandmarkPoint[] | null) => {
      if (!poseJoints || poseJoints.length < 17) return;

      ctx.strokeStyle = '#64748B'; // Muted slate
      ctx.lineWidth = 2;
      POSE_CONNECTIONS.forEach(([startIdx, endIdx]) => {
        const start = poseJoints[startIdx];
        const end = poseJoints[endIdx];
        if (start && end) {
          ctx.beginPath();
          ctx.moveTo(start.x * width, start.y * height);
          ctx.lineTo(end.x * width, end.y * height);
          ctx.stroke();
        }
      });

      // Draw pose joints
      ctx.fillStyle = '#94A3B8';
      [11, 12, 13, 14, 15, 16].forEach((idx) => {
        const pt = poseJoints[idx];
        if (pt) {
          ctx.beginPath();
          ctx.arc(pt.x * width, pt.y * height, 3.5, 0, 2 * Math.PI);
          ctx.fill();
        }
      });
    };

    // Helper: draw ghost motion trail
    const drawTrail = (trail: { point: TrajectoryPoint; opacity: number }[], colorRgb: string) => {
      if (trail.length < 2) return;

      for (let i = 1; i < trail.length; i++) {
        const p1 = trail[i - 1].point;
        const p2 = trail[i].point;
        const opacity = trail[i].opacity;

        ctx.strokeStyle = `rgba(${colorRgb}, ${opacity})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(p1.x * width, p1.y * height);
        ctx.lineTo(p2.x * width, p2.y * height);
        ctx.stroke();
      }
    };

    // 1. Draw ghost trails first (behind hands)
    if (showGhostTrails) {
      const leftTrail = getRecentTrail(wristTrails.left, currentTimestampMs, 400);
      const rightTrail = getRecentTrail(wristTrails.right, currentTimestampMs, 400);

      drawTrail(leftTrail, '59, 130, 246');   // Blue trail for Left Hand
      drawTrail(rightTrail, '245, 158, 11'); // Amber trail for Right Hand
    }

    // 2. Draw Pose
    drawPose(landmarks.pose);

    // 3. Draw Left Hand (Blue Accent)
    drawHand(landmarks.leftHand, 'rgba(59, 130, 246, 0.85)', '#60A5FA');

    // 4. Draw Right Hand (Amber Accent)
    drawHand(landmarks.rightHand, 'rgba(245, 158, 11, 0.85)', '#FBBF24');
  }, [landmarks, wristTrails, currentTimestampMs, showGhostTrails]);

  return (
    <div className="trajectory-canvas-container" aria-label="Landmark motion capture canvas">
      <canvas
        ref={canvasRef}
        width={640}
        height={360}
        className="trajectory-canvas"
      />
      <div className="trajectory-legend">
        <span className="legend-item left"><span className="legend-dot left" /> Left Hand</span>
        <span className="legend-item right"><span className="legend-dot right" /> Right Hand</span>
        <span className="legend-item pose"><span className="legend-dot pose" /> Upper Pose</span>
      </div>
    </div>
  );
};