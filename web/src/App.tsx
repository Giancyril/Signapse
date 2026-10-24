import { useState } from 'react';
import './styles/App.css';

/**
 * App shell — Phase 3 will replace this placeholder with the full inference UI.
 * Panels:
 *   - CameraView   : live webcam feed with landmark overlay
 *   - PredictionBanner : top-1 + confidence + top-5 list
 *   - StatusBar    : model loading state, FPS, latency
 */
export default function App() {
  const [status] = useState<'idle' | 'loading' | 'ready'>('idle');

  return (
    <div className="app">
      <header className="app-header">
        <h1>ASL Sign Recogniser</h1>
        <span className="badge">Phase 0 — Scaffold</span>
      </header>

      <main className="app-main">
        <div className="camera-placeholder">
          <p>Camera feed will appear here (Phase 3)</p>
          <p className="status">Status: <strong>{status}</strong></p>
        </div>

        <div className="prediction-placeholder">
          <p>Predictions will appear here (Phase 3)</p>
        </div>
      </main>

      <footer className="app-footer">
        <p>
          Recognises isolated ASL signs — does <em>not</em> translate ASL grammar.
        </p>
      </footer>
    </div>
  );
}
