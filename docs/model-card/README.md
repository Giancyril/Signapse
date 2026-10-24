# Model Card — WLASL100 TCN

**Task**: Isolated ASL sign word recognition
**Vocabulary**: 100 ASL glosses (WLASL100 subset)
**Architecture**: Temporal Convolutional Network (TCN)
**Input**: Normalised MediaPipe landmark sequence — `(T, 392)` float32
**Output**: 100-class logit vector

## Architecture Details

```
Input  (B, T, 392)
  └─ Permute → (B, 392, T)
      └─ ResidualBlock(392, 256, dilation=1)
          └─ ResidualBlock(256, 256, dilation=2)
              └─ ResidualBlock(256, 256, dilation=4)
                  └─ GlobalAvgPool → (B, 256)
                      └─ Linear(256, 100) → logits (B, 100)

ResidualBlock: Conv1d → BN → ReLU → Conv1d → BN + skip connection
```

**Parameter count**: ~800 K
**ONNX size (estimated)**: ~3.5 MB (float32)

## Training

| Hyper-parameter | Value |
|-----------------|-------|
| Optimiser | AdamW |
| Learning rate | 3e-4 |
| Weight decay | 1e-4 |
| Scheduler | CosineAnnealingWarmRestarts (T0=20) |
| Label smoothing | 0.1 |
| Max epochs | 60 |
| Early stopping patience | 15 |
| Batch size | 32 |
| Augmentation | Temporal jitter ±10%, horizontal mirror |

## Performance (target — Phase 2)

| Metric | Target |
|--------|--------|
| Top-1 accuracy (test) | ≥ 55 % |
| Top-5 accuracy (test) | ≥ 80 % |
| Inference latency (browser) | < 700 ms |

> Actual results will be filled in after training on the full WLASL100 dataset.

## Intended Use
- Educational / research demonstrations of real-time ASL word recognition
- NOT for accessibility-critical or production applications without further validation

## Out-of-Scope
- Connected ASL sentences or ASL grammar
- Signs outside the 100-word WLASL100 vocabulary
- Real-time translation of ASL

## Evaluation Data
Official WLASL100 test split — see [dataset card](../dataset-card/README.md).
