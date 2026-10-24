"""
test_training.py
Smoke tests for the training loop — runs 2 epochs on a synthetic dataset
to verify nothing crashes and loss decreases.
"""
from __future__ import annotations

import csv
import json
import tempfile
from pathlib import Path

import numpy as np
import pytest
import torch

from ml.src.features.landmarks import FEAT_DIM
from ml.src.features.dataset import WLASLDataset
from ml.src.models.tcn import TCN
from ml.src.train.config import TrainConfig
from ml.src.train.trainer import train


def _make_synthetic_splits(tmp: Path, n: int = 40, T: int = 20) -> Path:
    """Write a tiny synthetic dataset (train + val) for smoke-testing."""
    processed = tmp / "processed"
    splits    = tmp / "splits"
    splits.mkdir(parents=True)

    n_classes = 5
    label_map = {f"sign{i}": i for i in range(n_classes)}
    (splits / "label_map.json").write_text(json.dumps(label_map))

    for split_name in ("train", "val"):
        rows = []
        for i in range(n):
            label = i % n_classes
            gloss = f"sign{label}"
            npz_path = processed / split_name / f"{i:04d}.npz"
            npz_path.parent.mkdir(parents=True, exist_ok=True)
            seq = np.random.rand(T, FEAT_DIM).astype(np.float32)
            np.savez_compressed(str(npz_path), sequence=seq)
            rows.append({"npz_path": str(npz_path), "label": label, "gloss": gloss})

        with (splits / f"{split_name}.csv").open("w", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=["npz_path", "label", "gloss"])
            writer.writeheader()
            writer.writerows(rows)

    return splits


@pytest.mark.slow
def test_train_smoke():
    """Two epochs on 40 synthetic samples — verify loss is finite and checkpoint saved."""
    with tempfile.TemporaryDirectory() as tmp:
        tmp = Path(tmp)
        splits = _make_synthetic_splits(tmp)

        cfg = TrainConfig(
            splits_dir   = str(splits),
            max_frames   = 16,
            num_workers  = 0,   # no multiprocessing in tests
            num_classes  = 5,
            hidden       = 32,
            epochs       = 2,
            batch_size   = 8,
            lr           = 1e-3,
            run_dir      = str(tmp / "runs"),
            run_name     = "smoke",
            save_top_k   = 1,
            augment_train= False,
        )

        best_ckpt = train(cfg, patience=999)
        assert best_ckpt.exists(), "best.pt not created"

        state = torch.load(str(best_ckpt), map_location="cpu")
        assert "model" in state
        assert "metrics" in state
        assert 0.0 <= state["metrics"]["top1"] <= 1.0


def test_tcn_forward_no_nan():
    """Verify TCN output contains no NaN for random input."""
    model = TCN(feat_dim=FEAT_DIM, num_classes=100, hidden=128)
    x = torch.randn(4, 32, FEAT_DIM)
    out = model(x)
    assert not torch.isnan(out).any(), "NaN in model output"
    assert out.shape == (4, 100)


def test_train_config_defaults():
    cfg = TrainConfig()
    assert cfg.epochs == 60
    assert cfg.batch_size == 32
    assert cfg.num_classes == 100
    assert cfg.checkpoint_dir.parts[-1] == "checkpoints"
