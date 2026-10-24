# ADR-001: Browser-First Inference with ONNX Runtime Web

**Status**: Accepted  
**Date**: 2024

## Context
We need to run real-time sign recognition at ~30 FPS in a browser without a server round-trip.

## Decision
Use **ONNX Runtime Web** (WASM backend) to run the trained TCN model entirely in the browser.

## Consequences
- **Good**: No server required; works offline after first load.
- **Good**: Model < 2 MB (landmarks, not pixels).
- **Bad**: WASM is slower than native GPU; we cap model complexity accordingly.
- **Bad**: Requires COOP/COEP headers for SharedArrayBuffer (multi-threaded WASM).
