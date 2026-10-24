"""
to_onnx.py
Export a trained TCN checkpoint to ONNX for browser inference (ONNX Runtime Web).

What this produces:
  - A single .onnx file with:
      input  "sequence"  shape: (1, T, 392)  dynamic T
      output "logits"    shape: (1, num_classes)
  - A companion labels.json next to the .onnx file for the web app.

Usage:
  python -m ml.src.export.to_onnx \\
      --checkpoint runs/baseline/checkpoints/best.pt \\
      --output web/public/model.onnx \\
      --label-map ml/data/splits/label_map.json
"""
from __future__ import annotations

import argparse
import json
import logging
import sys
from pathlib import Path

import torch

from ml.src.features.landmarks import FEAT_DIM
from ml.src.models.tcn import TCN

log = logging.getLogger(__name__)

MAX_T = 64   # must match training max_frames


def export(
    checkpoint_path: str,
    output_path: str,
    label_map_path: str | None = None,
    opset: int = 17,
) -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
        handlers=[logging.StreamHandler(sys.stdout)],
    )

    ckpt = torch.load(checkpoint_path, map_location="cpu")
    cfg  = ckpt.get("config", {})
    num_classes = cfg.get("num_classes", 100)
    hidden      = cfg.get("hidden",      256)

    model = TCN(feat_dim=FEAT_DIM, num_classes=num_classes, hidden=hidden)
    model.load_state_dict(ckpt["model"])
    model.eval()

    out = Path(output_path)
    out.parent.mkdir(parents=True, exist_ok=True)

    dummy = torch.zeros(1, MAX_T, FEAT_DIM)
    torch.onnx.export(
        model,
        dummy,
        str(out),
        input_names=["sequence"],
        output_names=["logits"],
        dynamic_axes={"sequence": {1: "T"}},
        opset_version=opset,
        do_constant_folding=True,
    )
    log.info("ONNX model exported to %s", out)

    # Verify the exported model
    try:
        import onnx
        model_proto = onnx.load(str(out))
        onnx.checker.check_model(model_proto)
        log.info("ONNX model check passed.")
    except ImportError:
        log.warning("onnx package not installed — skipping verification.")

    # Export companion labels.json for the web app
    if label_map_path and Path(label_map_path).exists():
        label_map: dict[str, int] = json.loads(
            Path(label_map_path).read_text()
        )
        ordered = sorted(label_map.items(), key=lambda kv: kv[1])
        labels_list = [g for g, _ in ordered]
        labels_out  = out.parent / "labels.json"
        labels_out.write_text(json.dumps(labels_list, indent=2))
        log.info("Labels written to %s", labels_out)

    # Print model size
    size_kb = out.stat().st_size / 1024
    log.info("Model size: %.1f KB (%.2f MB)", size_kb, size_kb / 1024)

    val_metrics = ckpt.get("metrics", {})
    if val_metrics:
        log.info(
            "Checkpoint val metrics — top-1: %.4f | top-5: %.4f",
            val_metrics.get("top1", 0),
            val_metrics.get("top5", 0),
        )


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Export TCN to ONNX")
    parser.add_argument("--checkpoint", required=True)
    parser.add_argument("--output",     default="web/public/model.onnx")
    parser.add_argument("--label-map",  default="ml/data/splits/label_map.json")
    parser.add_argument("--opset",      type=int, default=17)
    args = parser.parse_args()
    export(args.checkpoint, args.output, args.label_map, args.opset)
