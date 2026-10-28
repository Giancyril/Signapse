import { useState, useCallback, useRef, useEffect } from 'react';
import { RecordedClip, RecordedFrame, FrameLandmarks } from '../types/recorder';

interface UseClipRecorderOptions {
  defaultDurationLimitMs?: number; // Default 4 seconds
  onClipFinished?: (clip: RecordedClip) => void;
}

export function useClipRecorder({
  defaultDurationLimitMs = 4000,
  onClipFinished,
}: UseClipRecorderOptions = {}) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingElapsedMs, setRecordingElapsedMs] = useState(0);
  const [durationLimitMs, setDurationLimitMs] = useState(defaultDurationLimitMs);
  const [recordedClips, setRecordedClips] = useState<RecordedClip[]>([]);
  const [activeClip, setActiveClip] = useState<RecordedClip | null>(null);

  const framesBufferRef = useRef<RecordedFrame[]>([]);
  const recordingStartTimeRef = useRef<number>(0);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const prevWristRef = useRef<{ left: { x: number; y: number } | null; right: { x: number; y: number } | null }>({
    left: null,
    right: null,
  });

  const onClipFinishedRef = useRef(onClipFinished);
  onClipFinishedRef.current = onClipFinished;

  // Stop recording and compile clip
  const stopRecording = useCallback((): RecordedClip | null => {
    if (!isRecording) return null;

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    const endTime = performance.now();
    const duration = Math.max(100, Math.round(endTime - recordingStartTimeRef.current));
    const frames = [...framesBufferRef.current];
    const frameCount = frames.length;
    const fps = frameCount > 0 ? Math.round((frameCount / (duration / 1000)) * 10) / 10 : 30;

    const newClip: RecordedClip = {
      id: `clip-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: `Sign Clip ${new Date().toLocaleTimeString()}`,
      recordedAt: Date.now(),
      durationMs: duration,
      fps: fps || 30,
      frameCount,
      frames,
    };

    setIsRecording(false);
    setRecordingElapsedMs(0);
    framesBufferRef.current = [];
    prevWristRef.current = { left: null, right: null };

    setRecordedClips((prev) => [newClip, ...prev.slice(0, 9)]); // Keep last 10 clips
    setActiveClip(newClip);

    if (onClipFinishedRef.current) {
      onClipFinishedRef.current(newClip);
    }

    return newClip;
  }, [isRecording]);

  // Start recording
  const startRecording = useCallback((limitMs?: number) => {
    if (isRecording) return;

    const limit = limitMs || durationLimitMs;
    setDurationLimitMs(limit);
    framesBufferRef.current = [];
    prevWristRef.current = { left: null, right: null };
    recordingStartTimeRef.current = performance.now();

    setIsRecording(true);
    setRecordingElapsedMs(0);

    timerIntervalRef.current = setInterval(() => {
      const elapsed = Math.round(performance.now() - recordingStartTimeRef.current);
      setRecordingElapsedMs(elapsed);

      if (elapsed >= limit) {
        stopRecording();
      }
    }, 50);
  }, [isRecording, durationLimitMs, stopRecording]);

  // Record a single frame from the live video stream
  const recordFrame = useCallback((landmarks: FrameLandmarks, featureVector?: number[]) => {
    if (!isRecording) return;

    const now = performance.now();
    const relativeTimestamp = Math.round(now - recordingStartTimeRef.current);

    // Compute instantaneous wrist velocity
    let leftVel = 0;
    let rightVel = 0;

    if (landmarks.leftHand && landmarks.leftHand.length > 0) {
      const wrist = landmarks.leftHand[0];
      if (prevWristRef.current.left) {
        const dx = wrist.x - prevWristRef.current.left.x;
        const dy = wrist.y - prevWristRef.current.left.y;
        leftVel = Math.sqrt(dx * dx + dy * dy);
      }
      prevWristRef.current.left = { x: wrist.x, y: wrist.y };
    }

    if (landmarks.rightHand && landmarks.rightHand.length > 0) {
      const wrist = landmarks.rightHand[0];
      if (prevWristRef.current.right) {
        const dx = wrist.x - prevWristRef.current.right.x;
        const dy = wrist.y - prevWristRef.current.right.y;
        rightVel = Math.sqrt(dx * dx + dy * dy);
      }
      prevWristRef.current.right = { x: wrist.x, y: wrist.y };
    }

    const frame: RecordedFrame = {
      frameIndex: framesBufferRef.current.length,
      timestamp: relativeTimestamp,
      landmarks,
      featureVector,
      wristVelocity: {
        left: leftVel,
        right: rightVel,
      },
    };

    framesBufferRef.current.push(frame);
  }, [isRecording]);

  // Delete clip by id
  const deleteClip = useCallback((id: string) => {
    setRecordedClips((prev) => prev.filter((c) => c.id !== id));
    setActiveClip((prev) => (prev?.id === id ? null : prev));
  }, []);

  // Clear all clips
  const clearAllClips = useCallback(() => {
    setRecordedClips([]);
    setActiveClip(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  return {
    isRecording,
    recordingElapsedMs,
    durationLimitMs,
    recordedClips,
    activeClip,
    setActiveClip,
    startRecording,
    stopRecording,
    recordFrame,
    deleteClip,
    clearAllClips,
    setDurationLimitMs,
  };
}