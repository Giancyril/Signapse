/**
 * transcriptExporter.ts - Exports ASL transcript sentences to TXT and SRT subtitle files
 */

import { SentenceSegment, ExportFormat } from '../types/speech';

// Format millisecond duration into SRT timestamp: 00:00:00,000
function formatSrtTimestamp(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const milliseconds = ms % 1000;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number, z = 2) => String(n).padStart(z, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)},${pad(milliseconds, 3)}`;
}

/**
 * Generate formatted plain text transcript
 */
export function generateTxtTranscript(sentences: SentenceSegment[]): string {
  const dateStr = new Date().toLocaleDateString();
  const header = `# Chereme ASL Recognition Transcript\n# Date: ${dateStr}\n# Total Sentences: ${sentences.length}\n\n`;

  const lines = sentences.map((s) => `[${s.formattedTime}] ${s.naturalizedText}`);
  return header + lines.join('\n');
}

/**
 * Generate standard SubRip (.srt) subtitle content
 */
export function generateSrtSubtitles(sentences: SentenceSegment[], sessionStartTime: number): string {
  if (sentences.length === 0) return '';

  return sentences
    .map((s, index) => {
      const startMs = Math.max(0, s.startTimestamp - sessionStartTime);
      const endMs = Math.max(startMs + 1200, s.endTimestamp - sessionStartTime);

      return `${index + 1}\n${formatSrtTimestamp(startMs)} --> ${formatSrtTimestamp(endMs)}\n${s.naturalizedText}\n`;
    })
    .join('\n');
}

/**
 * Triggers a client-side file download
 */
export function downloadTranscriptFile(
  sentences: SentenceSegment[],
  sessionStartTime: number,
  format: ExportFormat = 'txt'
): void {
  if (sentences.length === 0) return;

  let content = '';
  let filename = '';
  let mimeType = '';

  const timestamp = new Date().toISOString().slice(0, 10);

  if (format === 'srt') {
    content = generateSrtSubtitles(sentences, sessionStartTime);
    filename = `chereme_asl_captions_${timestamp}.srt`;
    mimeType = 'text/plain;charset=utf-8';
  } else {
    content = generateTxtTranscript(sentences);
    filename = `chereme_asl_transcript_${timestamp}.txt`;
    mimeType = 'text/plain;charset=utf-8';
  }

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}