"""
test_dataset.py
Tests for WLASLDataset using a small synthetic fixture.
"""
from __future__ import annotations

import csv
import json
import tempfile
from pathlib import Path

import numpy as np
import pytest

from ml.src.features.landmarks import FEAT_DIM
from ml.src.features.dataset import WLASLDataset


def _write_fixture(tmp: Path, n_samples: int = 8, T: int = 30) -> Path:
    """Write synthetic .npz files and a train.csv into *tmp*."""
    processed = tmp / "processed"
    splits    = tmp / "splits"
    splits.mkdir(parents=True)

    label_map = {"book": 0, "drink": 1, "help": 2}
    (splits / "label_map.json").write_text(json.dumps(label_map))

    rows = []
    for i in range(n_samples):
        label = i % len(label_map)
        gloss = list(label_map.keys())[label]
        npz_path = processed / f"{i:04d}.npz"
        npz_path.parent.mkdir(parents=True, exist_ok=True)
        seq = np.random.rand(T, FEAT_DIM).astype(np.float32)
        np.savez_compressed(str(npz_path), sequence=seq)
        rows.append({"npz_path": str(npz_path), "label": label, "gloss": gloss})

    with (splits / "train.csv").open("w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["npz_path", "label", "gloss"])
        writer.writeheader()
        writer.writerows(rows)

    return splits


def test_dataset_length():
    with tempfile.TemporaryDirectory() as tmp:
        splits = _write_fixture(Path(tmp))
        ds = WLASLDataset(splits, split="train", max_frames=64)
        assert len(ds) == 8


def test_dataset_item_shapes():
    with tempfile.TemporaryDirectory() as tmp:
        splits = _write_fixture(Path(tmp))
        ds = WLASLDataset(splits, split="train", max_frames=64)
        item = ds[0]
        assert item["sequence"].shape == (64, FEAT_DIM)
        assert item["mask"].shape == (64,)
        assert item["label"].shape == ()


def test_dataset_padding():
    """Sequences shorter than max_frames should be zero-padded."""
    with tempfile.TemporaryDirectory() as tmp:
        splits = _write_fixture(Path(tmp), T=20)
        ds = WLASLDataset(splits, split="train", max_frames=64)
        item = ds[0]
        # Frames 20..63 should be zeros
        assert item["sequence"][20:].sum().item() == pytest.approx(0.0)
        # Mask: first 20 True, rest False
        assert item["mask"][:20].all()
        assert not item["mask"][20:].any()


def test_dataset_augment_does_not_crash():
    with tempfile.TemporaryDirectory() as tmp:
        splits = _write_fixture(Path(tmp))
        ds = WLASLDataset(splits, split="train", max_frames=64, augment=True)
        item = ds[0]
        assert item["sequence"].shape == (64, FEAT_DIM)


def test_dataset_missing_csv_raises():
    with tempfile.TemporaryDirectory() as tmp:
        with pytest.raises(FileNotFoundError):
            WLASLDataset(tmp, split="train")
