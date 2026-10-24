# ADR-002: MediaPipe Landmarks as Input Features

**Status**: Accepted  
**Date**: 2024

## Context
Pixel-based models are large and slow in the browser. We need a compact representation.

## Decision
Use **MediaPipe Tasks Vision** (Holistic / Hand Landmarker + Pose Landmarker) to extract 
per-frame landmark coordinates. Feed normalised (x, y, z, visibility) + velocity to the model.

## Consequences
- **Good**: Input is ~392 floats/frame vs thousands of pixels.
- **Good**: Same MediaPipe API available in Python (training) and JS (inference) — parity.
- **Bad**: MediaPipe may fail on low-light or fast motion; model sees only what MP detects.
