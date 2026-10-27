/**
 * speech.ts - Types and configuration for Speech Synthesis & Smart Sentence Builder
 */

export interface SpeechVoiceOption {
  voiceURI: string;
  name: string;
  lang: string;
  isDefault: boolean;
  localService: boolean;
}

export interface SpeechConfig {
  enabled: boolean;
  autoSpeak: boolean; // Speak automatically when a sentence is finalized
  voiceURI: string | null;
  rate: number; // 0.5 to 2.0 (default: 1.0)
  pitch: number; // 0.5 to 1.5 (default: 1.0)
  volume: number; // 0.0 to 1.0 (default: 1.0)
}

export interface SentenceSegment {
  id: string;
  rawGlosses: string[];
  naturalizedText: string;
  startTimestamp: number;
  endTimestamp: number;
  formattedTime: string; // HH:MM:SS
  isSpoken: boolean;
}

export interface NaturalizerOptions {
  capitalizeFirstLetter?: boolean;
  addTerminalPunctuation?: boolean;
  expandPronouns?: boolean;
  insertArticles?: boolean;
}

export type ExportFormat = 'txt' | 'srt' | 'json';