"""
dataset.py
Phase 1 data pipeline — PyTorch Dataset.

Reads the split CSVs produced by make_splits.py and provides a Dataset
compatible with torch.utils.data.DataLoader.

Padding / truncation:
  - All sequences are padded with zeros to *max_frames* length.
  - A boolean attention mask is returned: True = real frame, False = padding.
"""
from __future__ import annotations

import csv
from pathlib import Path
from typing import Literal

import numpy as np
import torch
from torch.utils.data import Dataset

from ml.src.features.landmarks import FEAT_DIM

Split = Literal["train", "val", "test"]


class WLASLDataset(Dataset):
    """
    Args:
        splits_dir: Path to ml/data/splits/
        split:      One of "train", "val", "test"
        max_frames: Pad / truncate all sequences to this length
        augment:    If True, apply temporal jitter and mirror augmentation (train only)
    """

    def __init__(
        self,
        splits_dir: str | Path,
        split: Split = "train",
        max_frames: int = 64,
        augment: bool = False,
    ) -> None:
        self.max_frames = max_frames
        self.augment = augment
        self.samples: list[tuple[Path, int]] = []

        csv_path = Path(splits_dir) / f"{split}.csv"
        if not csv_path.exists():
            raise FileNotFoundError(
                f"Split CSV not found: {csv_path}. Run make_splits.py first."
            )

        with csv_path.open() as f:
            reader = csv.DictReader(f)
            for row in reader:
                self.samples.append((Path(row["npz_path"]), int(row["label"])))

    # ------------------------------------------------------------------
    # Dataset interface
    # ------------------------------------------------------------------

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, idx: int) -> dict[str, torch.Tensor]:
        npz_path, label = self.samples[idx]
        data = np.load(npz_path)
        seq: np.ndarray = data["sequence"]  # (T, FEAT_DIM)

        if self.augment:
            seq = self._augment(seq)

        seq = self._pad_or_truncate(seq)  # (max_frames, FEAT_DIM)

        # Build attention mask: True for real frames
        real_len = min(len(data["sequence"]), self.max_frames)
        mask = torch.zeros(self.max_frames, dtype=torch.bool)
        mask[:real_len] = True

        return {
            "sequence": torch.from_numpy(seq),  # (T, FEAT_DIM) float32
            "mask":     mask,                    # (T,) bool
            "label":    torch.tensor(label, dtype=torch.long),
        }

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _pad_or_truncate(self, seq: np.ndarray) -> np.ndarray:
        T = len(seq)
        if T >= self.max_frames:
            return seq[: self.max_frames]
        pad = np.zeros((self.max_frames - T, FEAT_DIM), dtype=np.float32)
        return np.concatenate([seq, pad], axis=0)

    def _augment(self, seq: np.ndarray) -> np.ndarray:
        """Temporal jitter (±10 % speed) + random horizontal mirror."""
        T = len(seq)
        if T < 2:
            return seq

        # Temporal jitter: resample at random speed
        factor = np.random.uniform(0.9, 1.1)
        new_len = max(2, int(T * factor))
        indices = np.linspace(0, T - 1, new_len).astype(int)
        seq = seq[indices]

        # Horizontal mirror: negate x-coordinates (every 4th value starting at 0)
        if np.random.rand() < 0.5:
            seq = seq.copy()
            seq[:, 0::4] *= -1  # flip x of all landmarks

        return seq
