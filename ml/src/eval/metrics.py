"""
metrics.py
Evaluation metrics for isolated sign recognition.

Exports:
  topk_accuracy(logits, targets, k)  -> float
  compute_metrics(logits, targets)   -> dict
  confusion_matrix_tensor(...)       -> np.ndarray
"""
from __future__ import annotations

import numpy as np
import torch


@torch.no_grad()
def topk_accuracy(
    logits: torch.Tensor,
    targets: torch.Tensor,
    k: int = 1,
) -> float:
    """Return top-k accuracy in [0, 1].

    Args:
        logits:  (N, C) float tensor of raw model outputs.
        targets: (N,)   long tensor of ground-truth class indices.
        k:       Number of top predictions to consider.
    """
    _, pred = logits.topk(k, dim=1, largest=True, sorted=True)  # (N, k)
    correct = pred.eq(targets.unsqueeze(1).expand_as(pred))
    return correct.any(dim=1).float().mean().item()


@torch.no_grad()
def compute_metrics(
    logits: torch.Tensor,
    targets: torch.Tensor,
) -> dict[str, float]:
    """Return a dict with top-1, top-5, and mean class accuracy."""
    top1 = topk_accuracy(logits, targets, k=1)
    top5 = topk_accuracy(logits, targets, k=5)

    # Per-class accuracy (mean of per-class recall)
    num_classes = logits.size(1)
    preds = logits.argmax(dim=1)
    per_class_correct = torch.zeros(num_classes)
    per_class_total   = torch.zeros(num_classes)
    for c in range(num_classes):
        mask = targets == c
        per_class_total[c]   = mask.sum().float()
        per_class_correct[c] = (preds[mask] == c).sum().float()

    # Only count classes that appear in this batch
    has_samples = per_class_total > 0
    mean_cls_acc = (
        (per_class_correct[has_samples] / per_class_total[has_samples]).mean().item()
        if has_samples.any() else 0.0
    )

    return {
        "top1": top1,
        "top5": top5,
        "mean_class_acc": mean_cls_acc,
    }


@torch.no_grad()
def confusion_matrix_np(
    logits: torch.Tensor,
    targets: torch.Tensor,
    num_classes: int,
) -> np.ndarray:
    """Return a (num_classes, num_classes) int32 confusion matrix."""
    preds = logits.argmax(dim=1).cpu().numpy()
    tgts  = targets.cpu().numpy()
    cm    = np.zeros((num_classes, num_classes), dtype=np.int32)
    for p, t in zip(preds, tgts):
        cm[t, p] += 1
    return cm
