import { useState, useRef, useCallback } from 'react';
import { useCamera } from './hooks/useCamera';
import { useInference, InferenceResult } from './hooks/useInference';
import { useLandmarks } from './hooks/useLandmarks';
import { CameraView } from './components/CameraView';
import { PredictionBanner } from './components/PredictionBanner';
import { StatusBar } from './components/StatusBar';
import { VocabularyModal } from './components/VocabularyModal';
import { NUM_CLASSES } from './lib/labels';
import './styles/App.css';

export default function App() {
  const [showOverlay, setShowOverlay] = useState(true);
  const [isVocabOpen, setIsVocabOpen] = useState(false);
  const [prediction, setPrediction] = useState<InferenceResult | null>(null);
  const [history, setHistory] = useState<string[]>([]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastAddedWordRef = useRef<string>('');
  const lastAddedTimeRef = useRef<number>(0);

  // 1. Camera Hook
  const {
    videoRef,
    isStreaming,
    isLoading: isCameraLoading,
    error: cameraError,
    startCamera,
    stopCamera,
    toggleMirror,
    isMirrored,
    devices,
    activeDeviceId,
  } = useCamera();

  // 2. ONNX Inference Hook
  const { isModelReady, isModelLoading, modelError, predict } = useInference();

  // 3. Landmark Extraction & Canvas Rendering Hook
  const handleSequenceReady = useCallback(
    async (sequenceData: Float32Array, numFrames: number) => {
      if (!isModelReady) return;

      const result = await predict(sequenceData, numFrames);
      if (result) {
        setPrediction(result);

        // If high-confidence prediction detected, append to history (debounced)
        const top = result.top1;
        const now = performance.now();
        if (
          top &&
          top.confidence >= 0.45 &&
          (top.gloss !== lastAddedWordRef.current || now - lastAddedTimeRef.current > 2500)
        ) {
          lastAddedWordRef.current = top.gloss;
          lastAddedTimeRef.current = now;
          setHistory((prev) => [...prev.slice(-15), top.gloss]);
        }
      }
    },
    [isModelReady, predict]
  );

  const { isMediaPipeReady, isMediaPipeLoading, error: mpError, trackingState } =
    useLandmarks({
      videoRef,
      canvasRef,
      isStreaming,
      showOverlay,
      onFrameSequenceReady: handleSequenceReady,
      inferenceIntervalMs: 200,
    });

  const handleClearHistory = () => {
    setHistory([]);
    lastAddedWordRef.current = '';
  };

  return (
    <div className="app-container">
      {/* Top Header */}
      <header className="app-header">
        <div className="header-left">
          <div className="logo-badge">ASL</div>
          <div>
            <h1 className="header-title">Real-Time Sign Language Recogniser</h1>
            <p className="header-subtitle">
              Webcam to live captions • MediaPipe Landmarks + Temporal Convolutional Network
            </p>
          </div>
        </div>

        <div className="header-right">
          <button
            type="button"
            className="vocab-nav-btn"
            onClick={() => setIsVocabOpen(true)}
          >
            100-Word Vocabulary
          </button>
          <a
            href="https://github.com/Giancyril/sign-language"
            target="_blank"
            rel="noreferrer"
            className="github-link-btn"
          >
            GitHub
          </a>
        </div>
      </header>

      {/* Scope and Disclaimer Alert */}
      <div className="disclaimer-banner">
        <span className="disclaimer-tag">RESEARCH PROTOTYPE</span>
        <span>
          Recognises <strong>isolated ASL signs</strong> from the WLASL100 vocabulary.
          Does <em>not</em> translate ASL grammar or facial morphology. All inference runs client-side.
        </span>
      </div>

      {/* Main Grid Content */}
      <main className="app-main-grid">
        <div className="grid-left">
          <CameraView
            videoRef={videoRef}
            canvasRef={canvasRef}
            isStreaming={isStreaming}
            isLoading={isCameraLoading || isMediaPipeLoading}
            error={cameraError || mpError || modelError}
            onStartCamera={() => startCamera()}
            onStopCamera={stopCamera}
            isMirrored={isMirrored}
            onToggleMirror={toggleMirror}
            showOverlay={showOverlay}
            onToggleOverlay={() => setShowOverlay((v) => !v)}
            trackingState={trackingState}
            devices={devices}
            activeDeviceId={activeDeviceId}
            onSelectDevice={(id) => startCamera(id)}
          />
        </div>

        <div className="grid-right">
          <PredictionBanner
            prediction={prediction}
            isStreaming={isStreaming}
            isModelReady={isModelReady && !isModelLoading}
            history={history}
            onClearHistory={handleClearHistory}
            onOpenVocabulary={() => setIsVocabOpen(true)}
            confidenceThreshold={0.4}
          />
        </div>
      </main>

      {/* Bottom Status Bar */}
      <StatusBar
        isStreaming={isStreaming}
        isMediaPipeReady={isMediaPipeReady}
        isModelReady={isModelReady}
        fps={trackingState.fps}
        latencyMs={prediction?.latencyMs ?? 0}
        numClasses={NUM_CLASSES}
      />

      {/* Vocabulary Modal */}
      <VocabularyModal
        isOpen={isVocabOpen}
        onClose={() => setIsVocabOpen(false)}
      />
    </div>
  );
}