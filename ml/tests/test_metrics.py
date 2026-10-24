"""
test_metrics.py
Unit tests for ml/src/eval/metrics.py
"""
from __future__ import annotations

import numpy as np
import pytest
import torch

from ml.src.eval.metrics import topk_accuracy, compute_metrics, confusion_matrix_np


def _perfect_logits(n: int, c: int) -> tuple[torch.Tensor, torch.Tensor]:
    """Returns logits and targets where every prediction is correct."""
    targets = torch.arange(n) % c
    logits = torch.zeros(n, c)
    logits.scatter_(1, targets.unsqueeze(1), 10.0)  # huge logit at correct class
    return logits, targets


def _worst_logits(n: int, c: int) -> tuple[torch.Tensor, torch.Tensor]:
    """Returns logits and targets where predictions are always wrong (off by 1)."""
    targets = torch.zeros(n, dtype=torch.long)          # all class 0
    logits = torch.zeros(n, c)
    logits[:, 1] = 10.0  # always predicts class 1
    return logits, targets


# ── topk_accuracy ──────────────────────────────────────────────────────────

def test_top1_perfect():
    logits, targets = _perfect_logits(20, 10)
    assert topk_accuracy(logits, targets, k=1) == pytest.approx(1.0)


def test_top1_zero():
    logits, targets = _worst_logits(20, 10)
    assert topk_accuracy(logits, targets, k=1) == pytest.approx(0.0)


def test_top5_can_recover():
    """Top-5 should be 1.0 even when top-1 is 0 if correct class is in top-5."""
    n, c = 20, 10
    targets = torch.zeros(n, dtype=torch.long)   # all class 0
    logits = torch.zeros(n, c)
    # Rank class 0 at position 4 (index 4 when sorted desc)
    logits[:, 1] = 5.0
    logits[:, 2] = 4.0
    logits[:, 3] = 3.0
    logits[:, 4] = 2.0
    logits[:, 0] = 1.0   # class 0 is 5th highest
    assert topk_accuracy(logits, targets, k=1) == pytest.approx(0.0)
    assert topk_accuracy(logits, targets, k=5) == pytest.approx(1.0)


# ── compute_metrics ────────────────────────────────────────────────────────

def test_compute_metrics_perfect():
    logits, targets = _perfect_logits(50, 10)
    m = compute_metrics(logits, targets)
    assert m["top1"] == pytest.approx(1.0)
    assert m["top5"] == pytest.approx(1.0)
    assert m["mean_class_acc"] == pytest.approx(1.0)


def test_compute_metrics_keys():
    logits, targets = _perfect_logits(10, 5)
    m = compute_metrics(logits, targets)
    assert {"top1", "top5", "mean_class_acc"} == set(m.keys())


# ── confusion_matrix_np ────────────────────────────────────────────────────

def test_confusion_matrix_shape():
    logits, targets = _perfect_logits(30, 5)
    cm = confusion_matrix_np(logits, targets, num_classes=5)
    assert cm.shape == (5, 5)
    assert cm.dtype == np.int32


def test_confusion_matrix_diagonal_on_perfect():
    logits, targets = _perfect_logits(10, 5)
    cm = confusion_matrix_np(logits, targets, num_classes=5)
    # Off-diagonal should be zero
    np.testing.assert_array_equal(cm - np.diag(np.diag(cm)), 0)
