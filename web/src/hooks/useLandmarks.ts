import { useState, useEffect, useRef, useCallback } from 'react';
import {
  FilesetResolver,
  HandLandmarker,
  PoseLandmarker,
} from '@mediapipe/tasks-vision';
import {
  packRawFrame,
  buildFeatureSequence,
  LandmarkPoint,
  POSE_SUBSET,
} from '../lib/landmarks';
import { FrameLandmarks } from '../types/recorder';

export interface LandmarkTrackingState {
  hasLeftHand: boolean;
  hasRightHand: boolean;
  hasPose: boolean;
  fps: number;
}

export interface UseLandmarksOptions {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isStreaming: boolean;
  showOverlay?: boolean;
  onFrameSequenceReady?: (sequence: Float32Array, numFrames: number) => void;
  onLandmarksReady?: (landmarks: FrameLandmarks) => void;
  inferenceIntervalMs?: number;
}

// Hand connections for canvas rendering
const HAND_CONNECTIONS = [
  // Thumb
  [0, 1], [1, 2], [2, 3], [3, 4],
  // Index
  [0, 5], [5, 6], [6, 7], [7, 8],
  // Middle
  [0, 9], [9, 10], [10, 11], [11, 12],
  // Ring
  [0, 13], [13, 14], [14, 15], [15, 16],
  // Pinky
  [0, 17], [17, 18], [18, 19], [19, 20],
  // Palm base
  [5, 9], [9, 13], [13, 17],
];

// Pose connections for upper body
const POSE_CONNECTIONS: [number, number][] = [
  [11, 12], // shoulders
  [11, 13], [13, 15], // left arm
  [12, 14], [14, 16], // right arm
  [0, 11], [0, 12], // nose to shoulders
];

export function useLandmarks({
  videoRef,
  canvasRef,
  isStreaming,
  showOverlay = true,
  onFrameSequenceReady,
  onLandmarksReady,
  inferenceIntervalMs = 250,
}: UseLandmarksOptions) {
  const [isMediaPipeLoading, setIsMediaPipeLoading] = useState(true);
  const [isMediaPipeReady, setIsMediaPipeReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [trackingState, setTrackingState] = useState<LandmarkTrackingState>({
    hasLeftHand: false,
    hasRightHand: false,
    hasPose: false,
    fps: 0,
  });

  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Sliding window buffer of raw frames (up to 64 frames = ~2 seconds at 30fps)
  const MAX_BUFFER_FRAMES = 60;
  const frameBufferRef = useRef<Float32Array[]>([]);
  const lastInferenceTimeRef = useRef<number>(0);
  const onLandmarksReadyRef = useRef(onLandmarksReady);
  onLandmarksReadyRef.current = onLandmarksReady;
  const fpsCountRef = useRef<number>(0);
  const fpsTimeRef = useRef<number>(performance.now());

  // Initialize MediaPipe Tasks
  useEffect(() => {
    let cancelled = false;

    async function initMediaPipe() {
      setIsMediaPipeLoading(true);
      setError(null);

      try {
        // Try local wasm first, fallback to CDN if needed
        let vision;
        try {
          vision = await FilesetResolver.forVisionTasks('/wasm');
        } catch {
          vision = await FilesetResolver.forVisionTasks(
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
          );
        }

        if (cancelled) return;

        // Initialize Hand Landmarker
        const handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: '/models/hand_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numHands: 2,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        if (cancelled) return;

        // Initialize Pose Landmarker
        const poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: '/models/pose_landmarker_lite.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          minPoseDetectionConfidence: 0.5,
          minPosePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        if (cancelled) return;

        handLandmarkerRef.current = handLandmarker;
        poseLandmarkerRef.current = poseLandmarker;
        setIsMediaPipeReady(true);
      } catch (err: unknown) {
        if (!cancelled) {
          const msg =
            err instanceof Error
              ? err.message
              : 'Failed to initialize MediaPipe vision tasks.';
          console.error('MediaPipe init error:', err);
          setError(msg);
        }
      } finally {
        if (!cancelled) {
          setIsMediaPipeLoading(false);
        }
      }
    }

    initMediaPipe();

    return () => {
      cancelled = true;
      if (handLandmarkerRef.current) {
        handLandmarkerRef.current.close();
        handLandmarkerRef.current = null;
      }
      if (poseLandmarkerRef.current) {
        poseLandmarkerRef.current.close();
        poseLandmarkerRef.current = null;
      }
    };
  }, []);

  // Drawing helper
  const drawLandmarks = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      width: number,
      height: number,
      leftHand: LandmarkPoint[] | null,
      rightHand: LandmarkPoint[] | null,
      poseLandmarks: LandmarkPoint[] | null
    ) => {
      ctx.clearRect(0, 0, width, height);

      if (!showOverlay) return;

      // Draw Pose Skeleton (upper body subset)
      if (poseLandmarks && poseLandmarks.length > 16) {
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(154, 166, 178, 0.4)'; // Violet accent

        for (const [i1, i2] of POSE_CONNECTIONS) {
          const p1 = poseLandmarks[i1];
          const p2 = poseLandmarks[i2];
          if (p1 && p2 && (p1.visibility ?? 1) > 0.4 && (p2.visibility ?? 1) > 0.4) {
            ctx.beginPath();
            ctx.moveTo(p1.x * width, p1.y * height);
            ctx.lineTo(p2.x * width, p2.y * height);
            ctx.stroke();
          }
        }

        // Draw upper body keypoint nodes
        for (const idx of POSE_SUBSET) {
          const p = poseLandmarks[idx];
          if (p && (p.visibility ?? 1) > 0.4) {
            const px = p.x * width;
            const py = p.y * height;
            ctx.fillStyle = '#9AA6B2';
            ctx.beginPath();
            ctx.arc(px, py, 5, 0, 2 * Math.PI);
            ctx.fill();
            ctx.strokeStyle = '#151A21';
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }
        }
      }

      // Draw Hand helper
      const drawHand = (
        landmarks: LandmarkPoint[] | null,
        boneColor: string,
        jointColor: string
      ) => {
        if (!landmarks || landmarks.length < 21) return;

        // Draw bones
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = boneColor;

        for (const [from, to] of HAND_CONNECTIONS) {
          const p1 = landmarks[from];
          const p2 = landmarks[to];
          if (p1 && p2) {
            ctx.beginPath();
            ctx.moveTo(p1.x * width, p1.y * height);
            ctx.lineTo(p2.x * width, p2.y * height);
            ctx.stroke();
          }
        }

        // Draw joints
        for (let i = 0; i < landmarks.length; i++) {
          const lm = landmarks[i];
          const px = lm.x * width;
          const py = lm.y * height;

          const isFingertip = [4, 8, 12, 16, 20].includes(i);
          const radius = isFingertip ? 4.5 : 3.0;

          ctx.fillStyle = isFingertip ? '#ffffff' : jointColor;
          ctx.beginPath();
          ctx.arc(px, py, radius, 0, 2 * Math.PI);
          ctx.fill();
        }
      };

      // Draw Left Hand (cyan) & Right Hand (amber / coral)
      drawHand(leftHand, 'rgba(37, 99, 235, 0.85)', '#6EA0FF');
      drawHand(rightHand, 'rgba(37, 99, 235, 0.85)', '#6EA0FF');
    },
    [showOverlay]
  );

  // Main Detection Loop
  useEffect(() => {
    if (!isStreaming || !isMediaPipeReady) {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = null;
      }
      return;
    }

    let isRunning = true;

    const processFrame = () => {
      if (!isRunning) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const handLandmarker = handLandmarkerRef.current;
      const poseLandmarker = poseLandmarkerRef.current;

      if (
        video &&
        video.readyState >= 2 &&
        canvas &&
        handLandmarker &&
        poseLandmarker
      ) {
        const videoWidth = video.videoWidth || 640;
        const videoHeight = video.videoHeight || 480;

        if (canvas.width !== videoWidth || canvas.height !== videoHeight) {
          canvas.width = videoWidth;
          canvas.height = videoHeight;
        }

        const ctx = canvas.getContext('2d');
        const now = performance.now();

        // 1. Detect Hands
        const handResults = handLandmarker.detectForVideo(video, now);

        let leftHand: LandmarkPoint[] | null = null;
        let rightHand: LandmarkPoint[] | null = null;

        if (handResults && handResults.landmarks.length > 0) {
          handResults.landmarks.forEach((lms, idx) => {
            const handedness = handResults.handednesses[idx]?.[0]?.categoryName;
            // Note: In selfie mode, MediaPipe labels might be mirrored
            if (handedness === 'Left') {
              leftHand = lms;
            } else if (handedness === 'Right') {
              rightHand = lms;
            } else {
              // fallback if handedness unknown
              if (!leftHand) leftHand = lms;
              else if (!rightHand) rightHand = lms;
            }
          });
        }

        // 2. Detect Pose
        const poseResults = poseLandmarker.detectForVideo(video, now);
        const poseLandmarks: LandmarkPoint[] | null =
          poseResults && poseResults.landmarks.length > 0
            ? poseResults.landmarks[0]
            : null;

        // 3. Render Canvas
        if (ctx) {
          drawLandmarks(
            ctx,
            canvas.width,
            canvas.height,
            leftHand,
            rightHand,
            poseLandmarks
          );
        }

        // 4. Live landmark callback (for clip recorder)
        if (onLandmarksReadyRef.current) {
          onLandmarksReadyRef.current({
            leftHand: leftHand as import('../types/recorder').LandmarkPoint[] | null,
            rightHand: rightHand as import('../types/recorder').LandmarkPoint[] | null,
            pose: poseLandmarks as import('../types/recorder').LandmarkPoint[] | null,
          });
        }

        // 4. Feature sequence packing
        const rawFrame = packRawFrame(leftHand, rightHand, poseLandmarks);
        const buffer = frameBufferRef.current;
        buffer.push(rawFrame);
        if (buffer.length > MAX_BUFFER_FRAMES) {
          buffer.shift();
        }

        // 5. Trigger inference callback at inferenceIntervalMs
        if (
          onFrameSequenceReady &&
          buffer.length >= 12 && // need at least ~12 frames of gesture
          (leftHand !== null || rightHand !== null) && // at least one hand visible
          now - lastInferenceTimeRef.current >= inferenceIntervalMs
        ) {
          lastInferenceTimeRef.current = now;
          const { data, numFrames } = buildFeatureSequence(buffer, 64);
          if (numFrames > 0) {
            onFrameSequenceReady(data, numFrames);
          }
        }

        // FPS calculation
        fpsCountRef.current++;
        if (now - fpsTimeRef.current >= 1000) {
          const fps = Math.round(
            (fpsCountRef.current * 1000) / (now - fpsTimeRef.current)
          );
          setTrackingState({
            hasLeftHand: leftHand !== null,
            hasRightHand: rightHand !== null,
            hasPose: poseLandmarks !== null,
            fps,
          });
          fpsCountRef.current = 0;
          fpsTimeRef.current = now;
        }
      }

      animFrameIdRef.current = requestAnimationFrame(processFrame);
    };

    animFrameIdRef.current = requestAnimationFrame(processFrame);

    return () => {
      isRunning = false;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = null;
      }
    };
  }, [
    isStreaming,
    isMediaPipeReady,
    drawLandmarks,
    onFrameSequenceReady,
    inferenceIntervalMs,
    videoRef,
    canvasRef,
  ]);

  const clearBuffer = useCallback(() => {
    frameBufferRef.current = [];
  }, []);

  return {
    isMediaPipeLoading,
    isMediaPipeReady,
    error,
    trackingState,
    clearBuffer,
  };
}
