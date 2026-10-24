"""
trainer.py
Full training loop for the TCN sign recogniser.

Features:
  - Cosine annealing with warm restarts (CosineAnnealingWarmRestarts)
  - Label-smoothing cross-entropy
  - Top-k checkpoint saving (keeps best-k by val top-1)
  - TensorBoard logging (loss, top-1, top-5, lr)
  - Gradient clipping (norm=5.0)
  - Mixed precision (torch.amp) when CUDA is available
  - Early stopping if val top-1 does not improve for *patience* epochs
"""
from __future__ import annotations

import heapq
import json
import logging
import sys
import time
from pathlib import Path
from typing import Optional

import torch
import torch.nn as nn
from torch.cuda.amp import GradScaler, autocast
from torch.utils.data import DataLoader
try:
    from torch.utils.tensorboard import SummaryWriter
except ImportError:
    class SummaryWriter:
        def __init__(self, *args, **kwargs): pass
        def add_scalar(self, *args, **kwargs): pass
        def close(self): pass

from ml.src.eval.metrics import compute_metrics
from ml.src.features.dataset import WLASLDataset
from ml.src.features.landmarks import FEAT_DIM
from ml.src.models.tcn import TCN
from ml.src.train.config import TrainConfig

log = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_device() -> torch.device:
    if torch.cuda.is_available():
        return torch.device("cuda")
    if torch.backends.mps.is_available():
        return torch.device("mps")
    return torch.device("cpu")


def _build_loaders(cfg: TrainConfig) -> tuple[DataLoader, DataLoader]:
    train_ds = WLASLDataset(
        cfg.splits_dir, split="train",
        max_frames=cfg.max_frames, augment=cfg.augment_train,
    )
    val_ds = WLASLDataset(
        cfg.splits_dir, split="val",
        max_frames=cfg.max_frames, augment=False,
    )
    train_loader = DataLoader(
        train_ds, batch_size=cfg.batch_size, shuffle=True,
        num_workers=cfg.num_workers, pin_memory=True, drop_last=True,
    )
    val_loader = DataLoader(
        val_ds, batch_size=cfg.batch_size, shuffle=False,
        num_workers=cfg.num_workers, pin_memory=True,
    )
    log.info("Train: %d samples | Val: %d samples", len(train_ds), len(val_ds))
    return train_loader, val_loader


class _CheckpointManager:
    """Keeps the top-k checkpoints by val top-1 accuracy."""

    def __init__(self, ckpt_dir: Path, keep: int = 3) -> None:
        self.ckpt_dir = ckpt_dir
        self.keep = keep
        ckpt_dir.mkdir(parents=True, exist_ok=True)
        # min-heap: (top1, path)
        self._heap: list[tuple[float, str]] = []

    def save(
        self,
        state: dict,
        epoch: int,
        top1: float,
    ) -> Optional[Path]:
        path = self.ckpt_dir / f"epoch{epoch:03d}_top1{top1:.4f}.pt"
        torch.save(state, path)

        heapq.heappush(self._heap, (top1, str(path)))
        if len(self._heap) > self.keep:
            _, old = heapq.heappop(self._heap)
            Path(old).unlink(missing_ok=True)

        # Always save a "best" symlink-compatible copy
        best_path = self.ckpt_dir / "best.pt"
        best_top1 = max(t for t, _ in self._heap)
        if top1 >= best_top1:
            torch.save(state, best_path)

        return path


# ---------------------------------------------------------------------------
# One epoch routines
# ---------------------------------------------------------------------------

def _train_epoch(
    model: nn.Module,
    loader: DataLoader,
    criterion: nn.Module,
    optimizer: torch.optim.Optimizer,
    scaler: GradScaler,
    device: torch.device,
    cfg: TrainConfig,
    epoch: int,
    writer: SummaryWriter,
    global_step: list[int],
) -> float:
    model.train()
    total_loss = 0.0

    for batch_idx, batch in enumerate(loader):
        seq    = batch["sequence"].to(device)   # (B, T, F)
        labels = batch["label"].to(device)      # (B,)

        optimizer.zero_grad()
        with autocast(enabled=device.type == "cuda"):
            logits = model(seq)                 # (B, C)
            loss   = criterion(logits, labels)

        scaler.scale(loss).backward()
        scaler.unscale_(optimizer)
        torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=5.0)
        scaler.step(optimizer)
        scaler.update()

        total_loss += loss.item()
        gs = global_step[0]
        if gs % cfg.log_every_n == 0:
            writer.add_scalar("train/loss_step", loss.item(), gs)
        global_step[0] += 1

    avg_loss = total_loss / len(loader)
    writer.add_scalar("train/loss_epoch", avg_loss, epoch)
    return avg_loss


@torch.no_grad()
def _val_epoch(
    model: nn.Module,
    loader: DataLoader,
    criterion: nn.Module,
    device: torch.device,
    epoch: int,
    writer: SummaryWriter,
) -> tuple[float, dict[str, float]]:
    model.eval()
    total_loss = 0.0
    all_logits: list[torch.Tensor] = []
    all_labels: list[torch.Tensor] = []

    for batch in loader:
        seq    = batch["sequence"].to(device)
        labels = batch["label"].to(device)
        logits = model(seq)
        total_loss += criterion(logits, labels).item()
        all_logits.append(logits.cpu())
        all_labels.append(labels.cpu())

    avg_loss = total_loss / len(loader)
    all_logits_t = torch.cat(all_logits)
    all_labels_t = torch.cat(all_labels)
    metrics = compute_metrics(all_logits_t, all_labels_t)

    writer.add_scalar("val/loss",             avg_loss,           epoch)
    writer.add_scalar("val/top1",             metrics["top1"],    epoch)
    writer.add_scalar("val/top5",             metrics["top5"],    epoch)
    writer.add_scalar("val/mean_class_acc",   metrics["mean_class_acc"], epoch)

    return avg_loss, metrics


# ---------------------------------------------------------------------------
# Main trainer
# ---------------------------------------------------------------------------

def train(cfg: TrainConfig, patience: int = 15) -> Path:
    """Run the full training loop. Returns path to best checkpoint."""
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
        handlers=[logging.StreamHandler(sys.stdout)],
    )

    device = _get_device()
    log.info("Device: %s", device)

    cfg.checkpoint_dir.mkdir(parents=True, exist_ok=True)
    cfg.log_dir.mkdir(parents=True, exist_ok=True)

    # Save config
    (cfg.checkpoint_dir.parent / "config.json").write_text(
        json.dumps(cfg.__dict__, indent=2, default=str)
    )

    train_loader, val_loader = _build_loaders(cfg)

    model = TCN(
        feat_dim=FEAT_DIM,
        num_classes=cfg.num_classes,
        hidden=cfg.hidden,
    ).to(device)
    log.info(
        "Model params: %s",
        f"{sum(p.numel() for p in model.parameters()):,}",
    )

    criterion = nn.CrossEntropyLoss(label_smoothing=cfg.label_smoothing)
    optimizer = torch.optim.AdamW(
        model.parameters(), lr=cfg.lr, weight_decay=cfg.weight_decay
    )
    scheduler = torch.optim.lr_scheduler.CosineAnnealingWarmRestarts(
        optimizer, T_0=cfg.scheduler_T0, eta_min=cfg.scheduler_eta_min
    )
    scaler = GradScaler(enabled=device.type == "cuda")
    writer = SummaryWriter(log_dir=str(cfg.log_dir))
    ckpt_mgr = _CheckpointManager(cfg.checkpoint_dir, keep=cfg.save_top_k)

    best_top1 = 0.0
    no_improve = 0
    global_step = [0]

    for epoch in range(1, cfg.epochs + 1):
        t0 = time.time()
        train_loss = _train_epoch(
            model, train_loader, criterion, optimizer, scaler,
            device, cfg, epoch, writer, global_step,
        )
        val_loss, metrics = _val_epoch(
            model, val_loader, criterion, device, epoch, writer,
        )
        scheduler.step()
        writer.add_scalar("train/lr", scheduler.get_last_lr()[0], epoch)

        elapsed = time.time() - t0
        log.info(
            "Epoch %3d/%d | train_loss=%.4f | val_loss=%.4f | "
            "top1=%.4f | top5=%.4f | %.1fs",
            epoch, cfg.epochs,
            train_loss, val_loss,
            metrics["top1"], metrics["top5"], elapsed,
        )

        state = {
            "epoch":   epoch,
            "model":   model.state_dict(),
            "optim":   optimizer.state_dict(),
            "metrics": metrics,
            "config":  cfg.__dict__,
        }
        ckpt_mgr.save(state, epoch, metrics["top1"])

        if metrics["top1"] > best_top1:
            best_top1 = metrics["top1"]
            no_improve = 0
        else:
            no_improve += 1
            if no_improve >= patience:
                log.info("Early stopping at epoch %d (patience=%d)", epoch, patience)
                break

    writer.close()
    best_ckpt = cfg.checkpoint_dir / "best.pt"
    log.info("Training complete. Best val top-1: %.4f | Checkpoint: %s", best_top1, best_ckpt)
    return best_ckpt
