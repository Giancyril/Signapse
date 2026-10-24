"""
to_onnx.py
Export a trained TCN checkpoint to ONNX for browser inference.

Usage:
  python -m ml.src.export.to_onnx --checkpoint runs/best.pt --output web/public/model.onnx
"""
from __future__ import annotations

import argparse
from pathlib import Path

import torch

from ml.src.features.landmarks import FEAT_DIM
from ml.src.models.tcn import TCN

MAX_T = 64   # maximum sequence length used in training


def export(checkpoint_path: str, output_path: str, num_classes: int = 100) -> None:
    model = TCN(feat_dim=FEAT_DIM, num_classes=num_classes)
    state = torch.load(checkpoint_path, map_location="cpu")
    model.load_state_dict(state["model"])
    model.eval()

    dummy = torch.zeros(1, MAX_T, FEAT_DIM)
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    torch.onnx.export(
        model,
        dummy,
        output_path,
        input_names=["sequence"],
        output_names=["logits"],
        dynamic_axes={"sequence": {1: "T"}},
        opset_version=17,
    )
    print(f"Exported ONNX model to {output_path}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--checkpoint", required=True)
    parser.add_argument("--output", default="web/public/model.onnx")
    parser.add_argument("--num-classes", type=int, default=100)
    args = parser.parse_args()
    export(args.checkpoint, args.output, args.num_classes)
