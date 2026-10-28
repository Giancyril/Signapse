import { useState, useRef, useCallback, useEffect } from 'react';
import { useCamera } from './hooks/useCamera';
import { useInference, InferenceResult } from './hooks/useInference';
import { useLandmarks } from './hooks/useLandmarks';
import { usePracticeEngine } from './hooks/usePracticeEngine';
import { useSpeechSynthesis } from './hooks/useSpeechSynthesis';
import { useSentenceBuilder } from './hooks/useSentenceBuilder';
import { useClipRecorder } from './hooks/useClipRecorder';
import { useLightingDiagnostics } from './hooks/useLightingDiagnostics';
import { useSignerBiometrics } from './hooks/useSignerBiometrics';
import { BiometricsCalibrationModal } from './components/BiometricsCalibrationModal';
import { Header, AppMode } from './components/Header';
import { NoticeBanner } from './components/NoticeBanner';
import { Stage } from './components/Stage';
import { SidePanel, TranscriptItem } from './components/SidePanel';
import { StatusBar } from './components/StatusBar';
import { SettingsModal, ThemeOption, CaptionSize } from './components/SettingsModal';
import { SpeechSettingsModal } from './components/SpeechSettingsModal';
import { LimitationsModal } from './components/LimitationsModal';
import { SystemModal } from './components/SystemModal';
import { downloadTranscriptFile } from './lib/transcriptExporter';
import './styles/App.css';

export default function App() {
  // Theme state
  const [theme, setTheme] = useState<ThemeOption>(() => {
    return (localStorage.getItem('chereme_theme') as ThemeOption) || 'system';
  });

  // Caption size state
  const [captionSize, setCaptionSize] = useState<CaptionSize>(() => {
    return (localStorage.getItem('chereme_caption_size') as CaptionSize) || 'S';
  });

  // Confidence threshold state
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(() => {
    const saved = localStorage.getItem('chereme_threshold');
    return saved ? parseFloat(saved) : 0.40;
  });

  // Developer stats toggle
  const [showDebugStats, setShowDebugStats] = useState(false);

  // Application Mode state (Recognize vs Practice)
  const [appMode, setAppMode] = useState<AppMode>('recognize');

  // Modals state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSpeechSettingsOpen, setIsSpeechSettingsOpen] = useState(false);
  const [isBiometricsModalOpen, setIsBiometricsModalOpen] = useState(false);
  const [isLimitationsOpen, setIsLimitationsOpen] = useState(false);
  const [isSystemOpen, setIsSystemOpen] = useState(false);

  // SidePanel active tab state
  const [sidePanelTab, setSidePanelTab] = useState<'transcript' | 'vocabulary' | 'motion'>('transcript');

  // Display toggles
  const [showOverlay, setShowOverlay] = useState(true);

  // Prediction and caption state machine
  const [prediction, setPrediction] = useState<InferenceResult | null>(null);
  const [confirmedCaptions, setConfirmedCaptions] = useState<string[]>([]);
  const [tentativeCaption, setTentativeCaption] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastConfirmedWordRef = useRef<string>('');
  const lastConfirmedTimeRef = useRef<number>(0);
  const sessionStartTimeRef = useRef<number>(Date.now());

  // Apply theme to html root element
  useEffect(() => {
    localStorage.setItem('chereme_theme', theme);
    if (theme === 'system') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme]);

  // Apply caption size preference
  const handleChangeCaptionSize = (size: CaptionSize) => {
    setCaptionSize(size);
    localStorage.setItem('chereme_caption_size', size);
  };

  // Apply confidence threshold preference
  const handleChangeThreshold = (val: number) => {
    setConfidenceThreshold(val);
    localStorage.setItem('chereme_threshold', val.toString());
  };

  // Camera hook
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

  // ONNX inference hook
  const { isModelReady, modelError, predict } = useInference();

  // Speech synthesis hook
  const {
    isSpeaking,
    voices,
    config: speechConfig,
    updateConfig: updateSpeechConfig,
    speak,
  } = useSpeechSynthesis();

  // Smart Sentence Builder hook
  const sentenceBuilder = useSentenceBuilder({
    isEnabled: appMode === 'recognize',
    onSentenceFinalized: (sentenceText) => {
      if (speechConfig.autoSpeak && speechConfig.enabled) {
        speak(sentenceText);
      }
    },
  });

  // Practice Mode engine hook
  const practiceEngine = usePracticeEngine({
    confidenceThreshold,
    prediction,
    isEnabled: appMode === 'practice' && isStreaming,
  });

  // Format timestamp helper
  const getFormattedTime = () => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };

  // Process incoming frame sequence
  const handleSequenceReady = useCallback(
    async (sequenceData: Float32Array, numFrames: number) => {
      if (!isModelReady) return;

      const result = await predict(sequenceData, numFrames);
      if (!result) return;

      setPrediction(result);
      const top = result.top1;
      const now = performance.now();

      if (top && top.confidence >= confidenceThreshold) {
        setTentativeCaption(top.gloss);

        // Keep each new word on screen at least 1.3 seconds (1300ms) before it can be confirmed/replaced
        if (
          top.gloss !== lastConfirmedWordRef.current ||
          now - lastConfirmedTimeRef.current >= 1300
        ) {
          lastConfirmedWordRef.current = top.gloss;
          lastConfirmedTimeRef.current = now;

          // Append to confirmed captions (keeping last 8 words in caption strip)
          setConfirmedCaptions((prev) => [...prev.slice(-7), top.gloss]);
          setTentativeCaption(null);

          // Feed into Sentence Builder
          if (appMode === 'recognize') {
            sentenceBuilder.addGloss(top.gloss);
          }

          // Append to side panel transcript
          const newItem: TranscriptItem = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            word: top.gloss,
            timestamp: getFormattedTime(),
          };
          setTranscript((prev) => [...prev.slice(-49), newItem]);
        }
      } else {
        setTentativeCaption(null);
      }
    },
    [isModelReady, predict, confidenceThreshold, appMode, sentenceBuilder]
  );

  // Diagnostics & Biometrics hooks
  const { metrics: lightingMetrics } = useLightingDiagnostics(videoRef, isStreaming);
  const signerBiometrics = useSignerBiometrics();

  // Clip Recorder hook - wired to Stage toolbar and SidePanel Motion Capture tab
  const clipRecorder = useClipRecorder({
    defaultDurationLimitMs: 4000,
    onClipFinished: (clip) => {
      console.log('[Chereme] Clip recorded:', clip.name, clip.frameCount, 'frames');
      setSidePanelTab('motion');
    },
  });

  // Landmark tracking hook
  const { isMediaPipeReady, isMediaPipeLoading, error: mpError, trackingState } =
    useLandmarks({
      videoRef,
      canvasRef,
      isStreaming,
      showOverlay,
      onFrameSequenceReady: handleSequenceReady,
      onLandmarksReady: (frame) => {
        if (clipRecorder.isRecording) {
          clipRecorder.recordFrame(frame);
        }
        if (signerBiometrics.isCalibrating) {
          signerBiometrics.processCalibrationFrame(frame.pose, frame.leftHand, frame.rightHand);
        }
      },
      inferenceIntervalMs: 200,
    });

  // Keyboard navigation & shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      const isInput = activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select';

      if (e.key === 'Escape') {
        setIsSettingsOpen(false);
        setIsSpeechSettingsOpen(false);
        setIsLimitationsOpen(false);
        setIsSystemOpen(false);
        return;
      }

      if (isInput) return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (isStreaming) {
          stopCamera();
        } else {
          startCamera();
        }
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        toggleMirror();
      } else if (e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        setShowOverlay((v) => !v);
      } else if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        setAppMode((prev) => (prev === 'recognize' ? 'practice' : 'recognize'));
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        if (sentenceBuilder.previewSentence) {
          speak(sentenceBuilder.previewSentence);
        }
      } else if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        sentenceBuilder.finalizeCurrentSentence();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        if (isStreaming) {
          if (clipRecorder.isRecording) {
            clipRecorder.stopRecording();
          } else {
            clipRecorder.startRecording();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isStreaming, startCamera, stopCamera, toggleMirror, sentenceBuilder, speak, clipRecorder]);

  const handleClearTranscript = () => {
    setTranscript([]);
    setConfirmedCaptions([]);
    setTentativeCaption(null);
    lastConfirmedWordRef.current = '';
    sentenceBuilder.clearAllSentences();
  };

  const handleExportTranscript = (format: 'txt' | 'srt') => {
    downloadTranscriptFile(sentenceBuilder.sentenceHistory, sessionStartTimeRef.current, format);
  };

  return (
    <div className="chereme-app">
      {/* 56px Header */}
      <Header
        appMode={appMode}
        onChangeAppMode={setAppMode}
        onOpenVocabulary={() => setSidePanelTab('vocabulary')}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenSpeechSettings={() => setIsSpeechSettingsOpen(true)}
      />

      {/* Dismissible Notice Banner */}
      <NoticeBanner onOpenLimitations={() => setIsLimitationsOpen(true)} />

      {/* Main Grid: Stage (flex) + SidePanel (360-400px) */}
      <main className="main-stage-grid">
        <Stage
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
          onOpenSettings={() => setIsSettingsOpen(true)}
          trackingState={trackingState}
          confirmedCaptions={confirmedCaptions}
          tentativeCaption={tentativeCaption}
          captionSize={captionSize}
          appMode={appMode}
          practiceTarget={practiceEngine.target}
          holdProgress={practiceEngine.holdProgress}
          isHolding={practiceEngine.isHolding}
          isSuccessCelebrating={practiceEngine.isSuccessCelebrating}
          celebrationFeedback={practiceEngine.feedback}
          practiceStreak={practiceEngine.stats.streak}
          currentConfidence={prediction?.top1?.confidence ?? 0}
          isSpeaking={isSpeaking}
          previewSentence={sentenceBuilder.previewSentence}
          isRecording={clipRecorder.isRecording}
          onStartRecording={clipRecorder.startRecording}
          onStopRecording={clipRecorder.stopRecording}
          recordingElapsedMs={clipRecorder.recordingElapsedMs}
          recordingDurationLimitMs={clipRecorder.durationLimitMs}
          onSelectRecordingDuration={clipRecorder.setDurationLimitMs}
          lightingMetrics={lightingMetrics}
          onOpenCalibration={() => setIsBiometricsModalOpen(true)}
          isCalibrated={signerBiometrics.isCalibrated}
        />

        <SidePanel
          prediction={prediction}
          confidenceThreshold={confidenceThreshold}
          transcript={transcript}
          onClearTranscript={handleClearTranscript}
          activeTab={sidePanelTab}
          onTabChange={setSidePanelTab}
          isStreaming={isStreaming}
          appMode={appMode}
          practiceTarget={practiceEngine.target}
          practiceDifficulty={practiceEngine.difficulty}
          onChangePracticeDifficulty={practiceEngine.setDifficulty}
          onSkipPracticeTarget={practiceEngine.skipTarget}
          onNextPracticeTarget={practiceEngine.nextTarget}
          isHoldingPractice={practiceEngine.isHolding}
          practiceStats={practiceEngine.stats}
          practiceHistory={practiceEngine.recentHistory}
          onResetPracticeSession={practiceEngine.resetSession}
          currentGlosses={sentenceBuilder.currentGlosses}
          previewSentence={sentenceBuilder.previewSentence}
          isSpeaking={isSpeaking}
          autoSpeak={speechConfig.autoSpeak}
          onSpeak={speak}
          onCommitSentence={sentenceBuilder.finalizeCurrentSentence}
          onClearSentence={sentenceBuilder.clearActiveBuffer}
          onRemoveLastGloss={sentenceBuilder.removeLastGloss}
          onOpenSpeechSettings={() => setIsSpeechSettingsOpen(true)}
          onCustomEditSentence={sentenceBuilder.setCustomEditedText}
          onExportTranscript={handleExportTranscript}
          sentenceHistory={sentenceBuilder.sentenceHistory}
          recordedClips={clipRecorder.recordedClips}
          activeClip={clipRecorder.activeClip}
          onSelectClip={clipRecorder.setActiveClip}
          onDeleteClip={clipRecorder.deleteClip}
          onClearAllClips={clipRecorder.clearAllClips}
        />
      </main>

      {/* 32px Status Bar */}
      <StatusBar
        isStreaming={isStreaming}
        isMediaPipeReady={isMediaPipeReady}
        isModelReady={isModelReady}
        modelError={modelError}
        cameraError={cameraError || mpError}
        fps={trackingState.fps}
        latencyMs={prediction?.latencyMs ?? 0}
        onOpenSystemDetails={() => setIsSystemOpen(true)}
      />

      {/* Dialog Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        devices={devices}
        activeDeviceId={activeDeviceId}
        onSelectDevice={(id) => startCamera(id)}
        confidenceThreshold={confidenceThreshold}
        onChangeThreshold={handleChangeThreshold}
        captionSize={captionSize}
        onChangeCaptionSize={handleChangeCaptionSize}
        theme={theme}
        onChangeTheme={setTheme}
        showDebugStats={showDebugStats}
        onToggleDebugStats={() => setShowDebugStats((v) => !v)}
      />

      <SpeechSettingsModal
        isOpen={isSpeechSettingsOpen}
        onClose={() => setIsSpeechSettingsOpen(false)}
        config={speechConfig}
        onUpdateConfig={updateSpeechConfig}
        voices={voices}
        onTestVoice={speak}
        isSpeaking={isSpeaking}
      />

      <BiometricsCalibrationModal
        isOpen={isBiometricsModalOpen}
        onClose={() => setIsBiometricsModalOpen(false)}
        isStreaming={isStreaming}
        onStartCamera={startCamera}
        calibration={signerBiometrics.calibration}
        isCalibrating={signerBiometrics.isCalibrating}
        calibrationProgress={signerBiometrics.calibrationProgress}
        onStartCalibration={signerBiometrics.startCalibration}
        onCancelCalibration={signerBiometrics.cancelCalibration}
        onResetCalibration={signerBiometrics.resetCalibration}
        onUpdateDominance={signerBiometrics.updateDominance}
        lightingMetrics={lightingMetrics}
      />

      <LimitationsModal
        isOpen={isLimitationsOpen}
        onClose={() => setIsLimitationsOpen(false)}
      />

      <SystemModal
        isOpen={isSystemOpen}
        onClose={() => setIsSystemOpen(false)}
        isMediaPipeReady={isMediaPipeReady}
        isModelReady={isModelReady}
        modelError={modelError}
        cameraError={cameraError || mpError}
        fps={trackingState.fps}
        latencyMs={prediction?.latencyMs ?? 0}
      />
    </div>
  );
}
