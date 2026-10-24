"""
train.py
Entry-point for Phase 2 training. Parses CLI args, builds a TrainConfig,
kicks off training, then auto-exports to ONNX.

Usage examples:
  # Quick smoke-test (2 epochs, tiny batch)
  python -m ml.scripts.train --epochs 2 --batch-size 4 --run-name smoke

  # Full run
  python -m ml.scripts.train --run-name baseline --epochs 60

  # Resume is not yet supported — start fresh or load checkpoint manually.
"""
from __future__ import annotations

import argparse
import logging
import sys

from ml.src.export.to_onnx import export
from ml.src.train.config import TrainConfig
from ml.src.train.trainer import train

log = logging.getLogger(__name__)


def parse_args() -> TrainConfig:
    parser = argparse.ArgumentParser(description="Train WLASL100 TCN model")

    # Data
    parser.add_argument("--splits-dir",  default="ml/data/splits")
    parser.add_argument("--max-frames",  type=int, default=64)
    parser.add_argument("--num-workers", type=int, default=4)

    # Model
    parser.add_argument("--num-classes", type=int, default=100)
    parser.add_argument("--hidden",      type=int, default=256)

    # Training
    parser.add_argument("--epochs",         type=int,   default=60)
    parser.add_argument("--batch-size",     type=int,   default=32)
    parser.add_argument("--lr",             type=float, default=3e-4)
    parser.add_argument("--weight-decay",   type=float, default=1e-4)
    parser.add_argument("--label-smoothing",type=float, default=0.1)
    parser.add_argument("--no-augment",     action="store_true")
    parser.add_argument("--patience",       type=int,   default=15)

    # Checkpointing
    parser.add_argument("--run-dir",  default="runs")
    parser.add_argument("--run-name", default="baseline")
    parser.add_argument("--save-top-k", type=int, default=3)

    # Export
    parser.add_argument("--onnx-path",   default="web/public/model.onnx")
    parser.add_argument("--label-map",   default="ml/data/splits/label_map.json")
    parser.add_argument("--skip-export", action="store_true",
                        help="Do not export to ONNX after training")

    args = parser.parse_args()

    cfg = TrainConfig(
        splits_dir      = args.splits_dir,
        max_frames      = args.max_frames,
        num_workers     = args.num_workers,
        num_classes     = args.num_classes,
        hidden          = args.hidden,
        epochs          = args.epochs,
        batch_size      = args.batch_size,
        lr              = args.lr,
        weight_decay    = args.weight_decay,
        label_smoothing = args.label_smoothing,
        augment_train   = not args.no_augment,
        run_dir         = args.run_dir,
        run_name        = args.run_name,
        save_top_k      = args.save_top_k,
        onnx_path       = args.onnx_path,
    )
    return cfg, args


def main() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
        handlers=[logging.StreamHandler(sys.stdout)],
    )

    cfg, args = parse_args()

    log.info("Starting training run: %s", cfg.run_name)
    best_ckpt = train(cfg, patience=args.patience)

    if not args.skip_export:
        log.info("Exporting best checkpoint to ONNX...")
        export(
            checkpoint_path=str(best_ckpt),
            output_path=cfg.onnx_path,
            label_map_path=args.label_map,
        )
    else:
        log.info("Skipping ONNX export (--skip-export set).")


if __name__ == "__main__":
    main()
