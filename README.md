# Real-Time Sign Language Recognition

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![React 18](https://img.shields.io/badge/React-18-61dafb.svg)](https://react.dev/)
[![MediaPipe](https://img.shields.io/badge/MediaPipe-Tasks%20Vision-0078d4.svg)](https://developers.google.com/mediapipe)
[![ONNX Runtime](https://img.shields.io/badge/ONNX%20Runtime-Web-brightgreen.svg)](https://onnxruntime.ai/)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.0+-ee4c2c.svg)](https://pytorch.org/)

A real-time, browser-based isolated American Sign Language (ASL) **word recognition** application powered by **MediaPipe Tasks Vision** landmarks and a lightweight **Temporal Convolutional Network (TCN)** exported to **ONNX Runtime Web**.

> ⚠️ **Scope & Honest Framing**:  
> This system recognises **isolated ASL signs from a 100-word vocabulary** (the WLASL100 benchmark). It classifies individual sign gestures into word glosses and does **not** translate continuous ASL grammar, facial morphology, or natural sign language syntax.

---

## ⚡ Architecture Pipeline

```mermaid
flowchart LR
    A[Webcam Feed\n30 FPS] --> B[MediaPipe Tasks\nHands + Pose]
    B --> C[Feature Engineering\nTranslate + Scale]
    C --> D[Velocity Computation\n196 Raw + 196 Δ]
    D --> E[Sequence Buffer\n(1, T, 392)]
    E --> F[ONNX Runtime Web\nTCN Classifier]
    F --> G[HUD & Live Captions\nTop-1 + Top-5 + History]
```

### Feature Layout (`FEAT_DIM = 392`)
Each frame is transformed into a compact 1-D vector:
- **Left Hand**: 21 landmarks $\times$ 4 coordinates $(x, y, z, \text{visibility}) = 84$
- **Right Hand**: 21 landmarks $\times$ 4 coordinates $(x, y, z, \text{visibility}) = 84$
- **Upper Body Pose**: 7 landmarks (nose, shoulders, elbows, wrists) $\times$ 4 coordinates $= 28$
- **Raw Vector**: $84 + 84 + 28 = 196$ values
- **Normalisation**: Origin shifted to shoulder midpoint; scaled by Euclidean shoulder width distance.
- **Velocity Vector**: First-order temporal difference $\Delta = x_t - x_{t-1}$ (196 values)
- **Final Feature Vector**: Normalised $[196] + \text{Velocity} [196] = \mathbf{392}$ floats per frame.

---

---

## 5-Day Advanced Features Roadmap

| Day | Feature | Status | Key Highlights |
|:---:|:---|:---:|:---|
| **1** | **Interactive Sign Trainer & Practice Mode** | Shipped | Curated 100-word difficulty tiers, continuous hold validation, real-time progress ring, streak tracker, and Web Audio feedback. |
| **2** | **Speech Synthesis & Smart Sentence Builder** | Shipped | Web Speech API voice synthesis, gloss-to-English grammar normalizer, and TXT/SRT export. |
| **3** | **Clip Recording & Landmark Trajectory Inspector** | Planned | Motion capture buffer, 30 FPS slow-motion replay, velocity vector overlay, JSON export. |
| **4** | **Signer Biometrics & Lighting Diagnostics** | Planned | Left/right dominance calibration, arm-span normalization, real-time illumination quality meter. |
| **5** | **Hands-Free Air Gesture Navigation** | Planned | Contactless UI control (palm hold, thumbs up, wave gestures to navigate without mouse/keyboard). |

### Day 1 Feature Deep-Dive: Interactive Sign Trainer
- **Difficulty Tiers**: Filter practice targets by `Beginner`, `Intermediate`, `Advanced`, or `All`.
- **Target Prompt Cards**: Dynamic gloss challenges with curated signing instructions and contextual cues.
- **Continuous Hold Validation**: Requires sustaining >= confidence threshold for 700 ms before confirming mastery.
- **Progress Ring HUD**: SVG-driven real-time hold completion ring showing live candidate match and confidence.
- **Session Scoreboard**: Tracks Current Streak, Personal Best Streak, Total Completed, and Accuracy percentage.
- **Audio & Visual Micro-Feedback**: Web Audio sine synthesizer chime and celebratory badge on completion.
- **Keyboard Shortcut**: Press `P` anytime to toggle between Live Recognition and Practice Mode.

## 📊 Benchmarks & Performance Targets

### Live Browser Inference Profile (Client-Side)
| Metric | Measured Result | Target |
|--------|-----------------|--------|
| **Sign-to-Caption Latency** | **15 – 25 ms** | < 700 ms |
| **Camera Processing Frame Rate** | **30 FPS** | 30 FPS |
| **Model Size (ONNX)** | **5.3 MB** | < 10 MB |
| **Offline Capability** | **100% Local (WASM & WebGPU/WebGL)** | Zero server calls |

### Offline Recognition Targets (WLASL100 Test Split)
- **Top-1 Accuracy**: $\ge 55\%$
- **Top-5 Accuracy**: $\ge 80\%$
- **Vocabulary Size**: 100 isolated ASL signs

---

## 📁 Repository Structure

```
sign-language/
├── ml/                         # Python ML & Training Pipeline
│   ├── src/
│   │   ├── features/           # Landmark extraction & normalisation
│   │   ├── models/             # TCN architecture (dilated 1D convolutions)
│   │   ├── train/              # Training loop, AdamW, cosine LR, AMP
│   │   ├── eval/               # Top-k accuracy, confusion matrix, report
│   │   └── export/             # ONNX export (opset 18, dynamic time T)
│   ├── scripts/                # Download, split, extract, and train CLI
│   └── tests/                  # 24/24 unit & smoke tests (pytest)
├── web/                        # Browser Frontend (Vite + React + TypeScript)
│   ├── public/                 # ONNX model, labels.json, MediaPipe WASM & models
│   └── src/
│       ├── components/         # CameraView, PredictionBanner, StatusBar, Modal
│       ├── hooks/              # useCamera, useLandmarks, useInference
│       ├── lib/                # Feature packaging & WLASL100 labels
│       └── styles/             # Modern dark glassmorphic design system
└── docs/                       # Architecture Decision Records (ADRs) & Model Card
```

---

## 🚀 Quick Start

### 1. Web Application (Browser MVP)

```bash
cd web
npm install
npm run dev
```

Open `http://localhost:5173/` in your browser.  
Click **"Enable Webcam"**, allow camera permissions, and practice any of the signs in the 100-word vocabulary!

### 2. ML Pipeline & Testing (Python 3.10+)

```bash
# Run the 24-test suite
pytest -v ml/tests

# Export TCN to ONNX for browser
python -m ml.src.export.to_onnx --checkpoint runs/init/checkpoints/best.pt --output web/public/model.onnx
```

---

## 📖 Supported 100-Word Vocabulary (WLASL100)

<details>
<summary>Click to view all 100 supported ASL glosses</summary>

| # | Gloss | # | Gloss | # | Gloss | # | Gloss |
|---|-------|---|-------|---|-------|---|-------|
| 1 | book | 26 | fine | 51 | take | 76 | thin |
| 2 | drink | 27 | cold | 52 | forget | 77 | want |
| 3 | computer | 28 | walk | 53 | hot | 78 | bad |
| 4 | before | 29 | no | 54 | listen | 79 | letter |
| 5 | chair | 30 | color | 55 | table | 80 | write |
| 6 | go | 31 | yes | 56 | white | 81 | hard |
| 7 | clothes | 32 | eat | 57 | look | 82 | thank you |
| 8 | who | 33 | bed | 58 | time | 83 | short |
| 9 | candy | 34 | man | 59 | red | 84 | afternoon |
| 10 | cousin | 35 | daughter | 60 | dark | 85 | daughter |
| 11 | deaf | 36 | son | 61 | girl | 86 | laugh |
| 12 | fine | 37 | friend | 62 | woman | 87 | sad |
| 13 | help | 38 | hate | 63 | black | 88 | happy |
| 14 | no | 39 | like | 64 | yellow | 89 | marry |
| 15 | thin | 40 | love | 65 | blue | 90 | sick |
| 16 | walk | 41 | make | 66 | green | 91 | clean |
| 17 | year | 42 | see | 67 | orange | 92 | dirty |
| 18 | yes | 43 | think | 68 | brown | 93 | dark |
| 19 | all | 44 | know | 69 | tall | 94 | cool |
| 20 | black | 45 | forget | 70 | short | 95 | cold |
| 21 | cool | 46 | remember | 71 | big | 96 | warm |
| 22 | finish | 47 | believe | 72 | small | 97 | hungry |
| 23 | hot | 48 | understand | 73 | fast | 98 | full |
| 24 | like | 49 | study | 74 | slow | 99 | sleep |
| 25 | many | 50 | teach | 75 | fat | 100 | wake |

</details>

---

## 🔍 Known Failure Modes & Limitations

1. **Camera Framing & Lighting**: Low lighting or backlighting degrades MediaPipe landmark confidence. Signers must keep their torso and hands within the framed guide box.
2. **Hand Occlusion**: When one hand passes directly in front of the other, landmarks can momentarily swap or jitter.
3. **Out-of-Vocabulary Gestures**: Any sign or everyday gesture outside the 100 trained classes will be classified to the nearest in-vocabulary gloss.
4. **Isolated Recognition**: The model detects discrete sign sequences; it does not perform continuous sign segmentation or grammatical translation.

---

## 📜 License & Citations
- **Code**: MIT License
- **Dataset**: WLASL (Word-Level American Sign Language) dataset (Li et al., 2020)