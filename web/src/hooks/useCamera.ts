import { useState, useEffect, useRef, useCallback } from 'react';

export interface UseCameraResult {
  videoRef: React.RefObject<HTMLVideoElement>;
  isStreaming: boolean;
  isLoading: boolean;
  error: string | null;
  startCamera: (deviceId?: string) => Promise<void>;
  stopCamera: () => void;
  toggleMirror: () => void;
  isMirrored: boolean;
  devices: MediaDeviceInfo[];
  activeDeviceId: string | null;
}

export function useCamera(): UseCameraResult {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMirrored, setIsMirrored] = useState(true);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [activeDeviceId, setActiveDeviceId] = useState<string | null>(null);

  // List available video devices
  const refreshDevices = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) return;
      const all = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = all.filter((d) => d.kind === 'videoinput');
      setDevices(videoInputs);
    } catch (err) {
      console.warn('Unable to enumerate media devices:', err);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  }, []);

  const startCamera = useCallback(
    async (deviceId?: string) => {
      setIsLoading(true);
      setError(null);
      stopCamera();

      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('Webcam access is not supported by your browser.');
        }

        const constraints: MediaStreamConstraints = {
          video: {
            deviceId: deviceId ? { exact: deviceId } : undefined,
            width: { ideal: 640 },
            height: { ideal: 480 },
            frameRate: { ideal: 30, max: 30 },
            facingMode: deviceId ? undefined : 'user',
          },
          audio: false,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;

        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          video.playsInline = true;
          video.muted = true;

          await new Promise<void>((resolve) => {
            if (video.readyState >= 2) {
              resolve();
            } else {
              video.onloadeddata = () => resolve();
            }
          });

          await video.play();
          setIsStreaming(true);

          const track = stream.getVideoTracks()[0];
          if (track) {
            const settings = track.getSettings();
            if (settings.deviceId) {
              setActiveDeviceId(settings.deviceId);
            }
          }
        }

        await refreshDevices();
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : 'Failed to access camera. Please allow camera permissions.';
        setError(message);
        setIsStreaming(false);
      } finally {
        setIsLoading(false);
      }
    },
    [stopCamera, refreshDevices]
  );

  const toggleMirror = useCallback(() => {
    setIsMirrored((prev) => !prev);
  }, []);

  useEffect(() => {
    refreshDevices();
    return () => {
      stopCamera();
    };
  }, [refreshDevices, stopCamera]);

  return {
    videoRef,
    isStreaming,
    isLoading,
    error,
    startCamera,
    stopCamera,
    toggleMirror,
    isMirrored,
    devices,
    activeDeviceId,
  };
}