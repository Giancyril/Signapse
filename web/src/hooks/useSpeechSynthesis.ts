import { useState, useEffect, useCallback, useRef } from 'react';
import { SpeechConfig, SpeechVoiceOption } from '../types/speech';

const DEFAULT_CONFIG: SpeechConfig = {
  enabled: true,
  autoSpeak: true,
  voiceURI: null,
  rate: 1.0,
  pitch: 1.0,
  volume: 1.0,
};

export function useSpeechSynthesis() {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [voices, setVoices] = useState<SpeechVoiceOption[]>([]);

  const [config, setConfigState] = useState<SpeechConfig>(() => {
    try {
      const saved = localStorage.getItem('signapse_speech_config') || localStorage.getItem('chereme_speech_config');
      if (saved) {
        return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
      }
    } catch {
      // Fallback
    }
    return DEFAULT_CONFIG;
  });

  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Check support & load voices
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsSupported(false);
      return;
    }

    setIsSupported(true);

    const loadVoices = () => {
      const available = window.speechSynthesis.getVoices();
      const mapped: SpeechVoiceOption[] = available.map((v) => ({
        voiceURI: v.voiceURI,
        name: v.name,
        lang: v.lang,
        isDefault: v.default,
        localService: v.localService,
      }));
      setVoices(mapped);

      // Default voice selection: pick English voice or default
      setConfigState((prev) => {
        if (!prev.voiceURI && mapped.length > 0) {
          const enVoice = mapped.find((v) => v.lang.startsWith('en') && v.isDefault) ||
            mapped.find((v) => v.lang.startsWith('en')) ||
            mapped[0];
          return { ...prev, voiceURI: enVoice ? enVoice.voiceURI : mapped[0].voiceURI };
        }
        return prev;
      });
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Update config and persist to localStorage
  const updateConfig = useCallback((partial: Partial<SpeechConfig>) => {
    setConfigState((prev) => {
      const updated = { ...prev, ...partial };
      try {
        localStorage.setItem('signapse_speech_config', JSON.stringify(updated));
      } catch {
        // Storage fail ignored
      }
      return updated;
    });
  }, []);

  // Speak text
  const speak = useCallback((text: string) => {
    if (!text || !text.trim() || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    try {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = config.rate;
      utterance.pitch = config.pitch;
      utterance.volume = config.volume;

      if (config.voiceURI) {
        const selected = window.speechSynthesis.getVoices().find((v) => v.voiceURI === config.voiceURI);
        if (selected) {
          utterance.voice = selected;
        }
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
        setIsPaused(false);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setIsPaused(false);
        activeUtteranceRef.current = null;
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
        setIsPaused(false);
        activeUtteranceRef.current = null;
      };

      activeUtteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    } catch {
      setIsSpeaking(false);
      setIsPaused(false);
    }
  }, [config]);

  // Stop speaking
  const stop = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
    }
  }, []);

  // Pause speaking
  const pause = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  }, []);

  // Resume speaking
  const resume = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  }, []);

  return {
    isSupported,
    isSpeaking,
    isPaused,
    voices,
    config,
    updateConfig,
    speak,
    stop,
    pause,
    resume,
  };
}
