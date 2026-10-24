# Model Card — WLASL100 TCN

**Task**: Isolated ASL sign word recognition  
**Vocabulary**: 100 ASL glosses (WLASL100 subset)  
**Architecture**: Temporal Convolutional Network (TCN, 3 residual blocks)  
**Input**: Normalised MediaPipe landmark sequence, T × 392 float32  
**Output**: 100-class logit vector  

## Intended Use
- Educational / research demonstrations
- NOT for accessibility-critical applications without further validation

## Performance (target, Phase 2)
| Metric | Target |
|--------|--------|
| Top-1 accuracy | = 55 % |
| Top-5 accuracy | = 80 % |
| Live latency   | < 700 ms |

## Out-of-Scope
- Connected ASL sentences or grammar
- Non-WLASL100 vocabulary signs
- Signers with significantly different body proportions from training data

## Evaluation Data
Official WLASL100 test split (see dataset card).
