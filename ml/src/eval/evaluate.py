"""
evaluate.py
Standalone evaluation script — runs the trained model on the test split
and prints a full metrics report.

Usage:
  python -m ml.src.eval.evaluate --checkpoint runs/baseline/checkpoints/best.pt
"""
from __future__ import annotations

import argparse
import json
import logging
import sys
from pathlib import Path

import numpy as np
import torch
from torch.utils.data import DataLoader

from ml.src.eval.metrics import compute_metrics, confusion_matrix_np
from ml.src.features.dataset import WLASLDataset
from ml.src.features.landmarks import FEAT_DIM
from ml.src.models.tcn import TCN

log = logging.getLogger(__name__)


def evaluate(checkpoint_path: str, splits_dir: str, max_frames: int = 64) -> dict:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
        handlers=[logging.StreamHandler(sys.stdout)],
    )

    ckpt = torch.load(checkpoint_path, map_location="cpu")
    cfg_dict: dict = ckpt.get("config", {})
    num_classes = cfg_dict.get("num_classes", 100)
    hidden      = cfg_dict.get("hidden",      256)

    model = TCN(feat_dim=FEAT_DIM, num_classes=num_classes, hidden=hidden)
    model.load_state_dict(ckpt["model"])
    model.eval()

    test_ds = WLASLDataset(splits_dir, split="test", max_frames=max_frames)
    log.info("Test set: %d samples", len(test_ds))

    loader = DataLoader(test_ds, batch_size=64, shuffle=False, num_workers=2)

    all_logits: list[torch.Tensor] = []
    all_labels: list[torch.Tensor] = []

    with torch.no_grad():
        for batch in loader:
            logits = model(batch["sequence"])
            all_logits.append(logits)
            all_labels.append(batch["label"])

    logits_t  = torch.cat(all_logits)
    labels_t  = torch.cat(all_labels)
    metrics   = compute_metrics(logits_t, labels_t)
    cm        = confusion_matrix_np(logits_t, labels_t, num_classes)

    log.info("─" * 50)
    log.info("TEST RESULTS  (n=%d)", len(test_ds))
    log.info("  Top-1 accuracy     : %.4f  (%.1f %%)", metrics["top1"], metrics["top1"] * 100)
    log.info("  Top-5 accuracy     : %.4f  (%.1f %%)", metrics["top5"], metrics["top5"] * 100)
    log.info("  Mean class accuracy: %.4f  (%.1f %%)", metrics["mean_class_acc"], metrics["mean_class_acc"] * 100)
    log.info("─" * 50)

    # Save results alongside the checkpoint
    out_dir = Path(checkpoint_path).parent.parent / "eval"
    out_dir.mkdir(exist_ok=True)
    (out_dir / "metrics.json").write_text(json.dumps(metrics, indent=2))
    np.save(str(out_dir / "confusion_matrix.npy"), cm)
    log.info("Saved metrics + confusion matrix to %s", out_dir)

    return metrics


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--checkpoint", required=True)
    parser.add_argument("--splits-dir", default="ml/data/splits")
    parser.add_argument("--max-frames", type=int, default=64)
    args = parser.parse_args()
    evaluate(args.checkpoint, args.splits_dir, args.max_frames)
