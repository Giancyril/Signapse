# Real-Time Sign Language Recognition

A browser-based isolated ASL **word recognition** system using MediaPipe landmarks and a lightweight sequence model exported to ONNX.

> **Scope**: This system recognises isolated ASL signs from a 100-word vocabulary (WLASL100). It does **not** translate ASL grammar or connected sentences.

## Repository Structure

```
.
+-- ml/          Python: data pipeline, model training, ONNX export
+-- web/         Vite + React + TypeScript: browser inference UI
+-- docs/        ADRs, model card, dataset card
```

## Quick Start

### ML (Python 3.10+)
```bash
cd ml
python -m venv .venv
.venv\Scripts\activate      # Windows
pip install -r requirements.txt
```

### Web
```bash
cd web
npm install
npm run dev
```

## Success Criteria
- **Offline**: top-1 = 55 %, top-5 = 80 % on the WLASL100 official test split
- **Live**: sign-to-caption latency < 700 ms at 30 FPS camera

## Phases
| Phase | Goal |
|-------|------|
| 0 | Monorepo scaffolding (this commit) |
| 1 | Data pipeline — download, landmark extraction, split |
| 2 | Baseline model — training, evaluation, ONNX export |
| 3 | Web MVP — MediaPipe + ONNX Runtime Web inference |
| 4 | Smoothing, debounce, UI polish |
| 5 | Evaluation dashboard |
| 6 | Performance optimisation |
| 7 | Documentation & release |

## License
MIT
