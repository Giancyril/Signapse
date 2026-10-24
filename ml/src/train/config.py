"""
config.py
Training hyper-parameters as a frozen dataclass.
Override any field via CLI args in ml/scripts/train.py.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path


@dataclass
class TrainConfig:
    # ── Data ────────────────────────────────────────────────────────────────
    splits_dir:  str = "ml/data/splits"
    max_frames:  int = 64
    num_workers: int = 4

    # ── Model ────────────────────────────────────────────────────────────────
    num_classes: int = 100
    hidden:      int = 256
    # FEAT_DIM is imported from landmarks at runtime — do not duplicate here

    # ── Training ────────────────────────────────────────────────────────────
    epochs:      int = 60
    batch_size:  int = 32
    lr:          float = 3e-4
    weight_decay: float = 1e-4

    # Cosine annealing — restarts every *T_0* epochs
    scheduler_T0:   int = 20
    scheduler_eta_min: float = 1e-6

    # Label smoothing (helps generalisation on small datasets)
    label_smoothing: float = 0.1

    # ── Augmentation ────────────────────────────────────────────────────────
    augment_train: bool = True

    # ── Checkpointing ───────────────────────────────────────────────────────
    run_dir:        str = "runs"
    run_name:       str = "baseline"
    save_top_k:     int = 3   # keep best-k checkpoints by val top-1
    log_every_n:    int = 10  # steps between console log lines

    # ── Export ──────────────────────────────────────────────────────────────
    onnx_path: str = "web/public/model.onnx"

    @property
    def checkpoint_dir(self) -> Path:
        return Path(self.run_dir) / self.run_name / "checkpoints"

    @property
    def log_dir(self) -> Path:
        return Path(self.run_dir) / self.run_name / "logs"
